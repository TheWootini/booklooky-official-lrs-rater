import { grokJson } from './grok-client';
import { romanceRatingWithInnuendoRule } from './scoring-rules';
import {
  buildOfficialScanAgeRecommendationPrompt,
  confidenceLabelToScore,
  normalizeOfficialScanMinimumAge,
  parseOfficialScanAgeRecommendationResponse,
} from './age-recommendation';
import {
  OFFICIAL_SCAN_CATEGORY_FOCUS_MAX_CHARS_PER_CHUNK,
  OFFICIAL_SCAN_DEFAULT_CHUNK_SCAN_CONCURRENCY,
} from './constants';
import { OFFICIAL_SCAN_CATEGORIES, isOfficialScanStoryThemeKey } from './categories';
import type {
  ContentAnalysis,
  OfficialScanCategoryKey,
  OfficialScanCategoryResult,
  OfficialScanExcerpt,
  OfficialScanReport,
} from './types';
import { dedupeExcerpts } from './report-utils';
import { chunkTranscript, cleanTranscriptText } from './transcript';

/** Chunk-scan: what the JSON key "lgbtq" means (LGBTQ+ only). */
const GENDER_SIGNAL_SCOPE_CHUNK = `Category "lgbtq" (LGBTQ+ representation) — LGBTQ+ ONLY:
- Use "lgbtq" ONLY when the passage clearly involves LGBTQ+ themes: sexual orientation or gender identity (including questioning), same-sex or explicitly queer relationships, homophobia, transphobia, anti-LGBTQ slurs or harassment, coming out, transition, or unmistakable queer representation tied to those themes.
- Do NOT use "lgbtq" for: general men-vs-women banter; "strong woman" / "weak man" tropes; generic sexism or feminism with no LGBTQ+ angle; straight dating or marriage talk with no queer subtext; jokes about respecting women, pink ribbons, or competence unless the passage ALSO clearly ties to LGBTQ+ identity or anti-LGBTQ bias.
- Negative examples (use an empty "lgbtq" array here): colleagues quipping that women are "men who didn’t grow enough"; a character insisting he "respects women" with an awareness-ribbon joke; arguing men vs women strength with no queer element. (Still: two women holding hands is NOT LGBTQ+ unless context shows romance or identity—not just friendship.)`;

/** Category-focus pass: same scope when category === lgbtq. */
const GENDER_FOCUS_SCOPE = `SCOPE for "lgbtq": This category is LGBTQ+ representation ONLY. Assign rating 0 unless the evidence clearly concerns LGBTQ+ identity, same-sex/queer relationships, or anti-LGBTQ prejudice. If the text is only general gender roles, men/women dynamics, or "strong woman" material with no LGBTQ+ through-line, return rating 0 and excerpts: [].`;

/** Chunk-scan: "language" = profanity, hate speech, explicit sexual wording—not general diction. */
const LANGUAGE_SIGNAL_SCOPE_CHUNK = `Category "language" (objectionable wording ONLY):
- Use "language" ONLY for: clear profanity / curse words; slurs or hateful epithets aimed at people or groups; or sexually explicit or crude sexual *words* and graphic sexual phrasing (this aligns with sexual-content concerns—here judge the vulgarity or explicitness of the wording itself, not romantic plot).
- Do NOT use "language" for: technical jargon or trade terminology; puns, riddles, or harmless wordplay; invented fantasy/sci-fi terms; formal or literary vocabulary; mild oaths unless they are unambiguous strong profanity in context; extended metaphors with no actual slur or swear word on the page; passages that merely discuss sex or romance without crude/explicit diction.
- Negative examples (use an empty "language" array): in-world slang with no real-world slur; a pun or homophone joke; characters speaking clinically or politely about intimacy; worldbuilding terms that sound odd but are not obscene.`;

/** Category-focus pass when category === language. */
const LANGUAGE_FOCUS_SCOPE = `SCOPE for "language": Rate ONLY profanity, slurs/hateful language, and explicit sexual wording. Assign rating 0 if the evidence is only jargon, puns, wordplay, invented terms, or non-profane vocabulary—even if the topic is mature.`;

/** Chunk-scan: "romance" includes implied / euphemistic sexual subtext (route here, not "language"). */
const ROMANCE_SIGNAL_SCOPE_CHUNK = `Category "romance" (romantic and sexual content, including implied):
- Use "romance" for: romantic feelings or relationships; kissing; sexual content; flirtation; sexual innuendo; implied sexual tension; double entendres; euphemistic sexual references; mild sexual humor—even when wording is non-graphic.
- Do NOT send sexual innuendo or implied sexual subtext to "language" unless the issue is profanity, slurs, or explicitly crude sexual wording (see language scope above).
- If this segment clearly contains sexual innuendo or flirtation with sexual subtext, include at least one "romance" signal (do not rely on another category alone).`;

/** Category-focus pass when category === romance. */
const ROMANCE_FOCUS_SCOPE = `SCOPE for "romance": Rate romantic and sexual themes including flirtation, innuendo, implied sexual tension, double entendres, and euphemistic sexual references. If the transcript evidence shows any such innuendo or implied sexual subtext, rating MUST be at least 1—never 0 when that subtext is present. Reserve 0 only when there is no romantic or sexual content of any kind in the excerpts you evaluated.`;

/** Story themes: score plot prominence, not intensity or appropriateness. */
const STORY_THEME_FOCUS_SCOPE = `SCOPE for story theme categories (fantasy, lgbtq, sciFi, disability): Rate how CENTRAL this theme is to the plot (0 = not present, 5 = central storyline). This is a presence indicator, NOT content intensity and NOT a warning. A higher score means the theme is more central — not that the book is less appropriate.`;

const FANTASY_FOCUS_SCOPE = `SCOPE for "fantasy": Magic, supernatural elements, witches/wizards, magical creatures, or alternate fantasy worlds. Do NOT score science fiction here (space travel, advanced technology without magic) — use sciFi instead.`;

const SCI_FI_FOCUS_SCOPE = `SCOPE for "sciFi": Science fiction, futuristic or speculative technology, space travel, aliens, robots, dystopian futures, and time travel grounded in science (not magic). Do NOT score pure fantasy/magic here — use fantasy instead. A book may score in both only if it genuinely blends both.`;

const DISABILITY_FOCUS_SCOPE = `SCOPE for "disability": Physical disability, chronic illness, neurodiversity (e.g. autism, ADHD), Deaf/HoH, blind/visually impaired representation. Score prominence only — not a warning. Do NOT conflate with mental health intensity alone unless disability/neurodiversity representation is clearly present.`;

const FANTASY_SCI_FI_SCOPE_CHUNK = `Categories "fantasy" and "sciFi" (story themes — prominence only):
- "fantasy": magic, supernatural, witches/wizards, magical creatures, enchanted worlds.
- "sciFi": futuristic technology, space travel, aliens, robots, dystopian tech, speculative science — NOT magic-based.
- A book may have signals in both if it genuinely blends science fantasy.`;

const DISABILITY_SIGNAL_SCOPE_CHUNK = `Category "disability" (story theme — prominence only):
- Use "disability" for clear disability, chronic illness, or neurodiversity representation (physical disability, autism, ADHD, Deaf/HoH, blind/VI, etc.).
- Score based on how central the representation is — not as a warning.
- Do NOT use for generic mental health struggles alone unless disability/neurodiversity is clearly present.`;

export type OfficialScanChunkSignal = {
  quote: string;
  why: string;
};

/** One model result for a single transcript segment. */
export type OfficialScanChunkScanResult = {
  chunkIndex: number;
  signals: Record<OfficialScanCategoryKey, OfficialScanChunkSignal[]>;
  notes?: string;
};

function clampInt0to5(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(5, Math.round(x)));
}

function clamp01(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function emptyRatings(): Record<OfficialScanCategoryKey, OfficialScanCategoryResult> {
  return {
    violence: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    romance: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    mentalHealth: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    fantasy: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    language: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    substanceUse: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    lgbtq: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    fear: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    sciFi: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
    disability: { rating: 0, noteWhenZero: 'No meaningful results discovered for this rating.' },
  };
}

async function scanTranscriptChunk(params: { chunkIndex: number; text: string }): Promise<OfficialScanChunkScanResult> {
  const prompt = `You are BookLooky's official paid transcript rater (LRS). You will be given ONE segment of a full book transcript.

Task:
- For each category, if this segment contains clear evidence, extract up to 3 short quotes (1-3 sentences each) and explain WHY they matter.
- Content Intensity categories (violence, romance, mentalHealth, language, substanceUse, fear): evidence of how strong or frequent the content is.
- Story Theme categories (fantasy, lgbtq, sciFi, disability): evidence of how central the theme is to the plot — NOT a warning.
- Be conservative and context-aware.
- If a category is not clearly evidenced in this segment, return an empty array for that category.

${GENDER_SIGNAL_SCOPE_CHUNK}

${LANGUAGE_SIGNAL_SCOPE_CHUNK}

${ROMANCE_SIGNAL_SCOPE_CHUNK}

${FANTASY_SCI_FI_SCOPE_CHUNK}

${DISABILITY_SIGNAL_SCOPE_CHUNK}

Return ONLY JSON in this exact shape:
{
  "chunkIndex": ${params.chunkIndex},
  "signals": {
    "violence": [{"quote":"...","why":"..."}],
    "romance": [{"quote":"...","why":"..."}],
    "mentalHealth": [{"quote":"...","why":"..."}],
    "fantasy": [{"quote":"...","why":"..."}],
    "language": [{"quote":"...","why":"..."}],
    "substanceUse": [{"quote":"...","why":"..."}],
    "lgbtq": [{"quote":"...","why":"..."}],
    "fear": [{"quote":"...","why":"..."}],
    "sciFi": [{"quote":"...","why":"..."}],
    "disability": [{"quote":"...","why":"..."}]
  },
  "notes": "optional"
}

CHUNK TEXT:
${params.text}`;

  const res = await grokJson<OfficialScanChunkScanResult>(prompt, { maxTokens: 1600, temperature: 0.2, timeoutMs: 120000 });

  const signals = {} as Record<OfficialScanCategoryKey, OfficialScanChunkSignal[]>;
  for (const k of OFFICIAL_SCAN_CATEGORIES) {
    const arr = Array.isArray((res as any).signals?.[k]) ? (res as any).signals[k] : [];
    signals[k] = arr
      .slice(0, 3)
      .map((x: any) => ({ quote: String(x.quote || '').trim(), why: String(x.why || '').trim() }))
      .filter((x: any) => x.quote && x.why);
  }

  return {
    chunkIndex: params.chunkIndex,
    signals,
    notes: typeof (res as any).notes === 'string' ? (res as any).notes : undefined,
  };
}

/**
 * Scans pending transcript segments until the time budget is exhausted
 * (the caller can persist results and re-invoke to resume).
 */
export async function runOfficialScanChunkScanPass(params: {
  chunks: Array<{ chunkIndex: number; text: string }>;
  completedChunkIndexes: Set<number>;
  timeBudgetMs: number;
  concurrency: number;
  onEach: (result: OfficialScanChunkScanResult) => Promise<void>;
}): Promise<{ scannedThisPass: number }> {
  const pending = params.chunks.filter((c) => !params.completedChunkIndexes.has(c.chunkIndex));
  let scannedThisPass = 0;
  const start = Date.now();
  let i = 0;

  while (i < pending.length) {
    if (Date.now() - start >= params.timeBudgetMs) break;
    const wave = pending.slice(i, i + params.concurrency);
    i += params.concurrency;
    await mapLimit(wave, params.concurrency, async (c) => {
      const r = await scanTranscriptChunk({ chunkIndex: c.chunkIndex, text: c.text });
      await params.onEach(r);
      scannedThisPass++;
    });
  }

  return { scannedThisPass };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (idx < items.length) {
      const current = idx++;
      out[current] = await fn(items[current]);
    }
  });
  await Promise.all(workers);
  return out;
}

type CategoryFocusedResult = {
  category: OfficialScanCategoryKey;
  rating: number;
  excerpts: Array<{ excerpt: string; explanation: string; locationHint?: string }>;
  rationale: string;
};

/** When a focus-pass rating is dropped for lack of validated evidence (author-facing report). */
const NOTE_RATING_ZERO_NO_VERIFIED_EVIDENCE =
  'No quotable transcript excerpts with explanations met our validation rules for this category, so the rating was set to 0.';

/**
 * Collect up to `max` excerpt rows from per-chunk scan signals (quote + why), deduped by excerpt prefix.
 */
function excerptsFromChunkSignals(
  category: OfficialScanCategoryKey,
  scans: OfficialScanChunkScanResult[],
  max: number
): Array<{ excerpt: string; explanation: string; locationHint?: string }> {
  const out: Array<{ excerpt: string; explanation: string; locationHint?: string }> = [];
  const seen = new Set<string>();
  for (const scan of scans) {
    const signals = scan.signals[category] ?? [];
    for (const s of signals) {
      const excerpt = String(s.quote || '').trim();
      const explanation = String(s.why || '').trim();
      if (!excerpt || !explanation) continue;
      const key = excerpt.slice(0, 280);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ excerpt, explanation });
      if (out.length >= max) return out;
    }
  }
  return out;
}

type ReconciledCategory = CategoryFocusedResult & {
  /** When final rating is 0 only because we removed an unsupported positive rating. */
  downgradedForMissingEvidence?: boolean;
};

/**
 * Every non-zero category rating must have at least one validated excerpt+explanation.
 * Otherwise try segment-level chunk signals; if still none, downgrade to 0.
 */
function reconcileCategoryEvidence(
  f: CategoryFocusedResult,
  scansSorted: OfficialScanChunkScanResult[]
): ReconciledCategory {
  if (f.rating <= 0) {
    return { ...f, excerpts: [], downgradedForMissingEvidence: false };
  }

  const excerpts = f.excerpts.slice(0, 5).filter((e) => e.excerpt && e.explanation);
  if (excerpts.length > 0) {
    return { ...f, excerpts, downgradedForMissingEvidence: false };
  }

  const fromChunks = excerptsFromChunkSignals(f.category, scansSorted, 5);
  if (fromChunks.length > 0) {
    return {
      ...f,
      excerpts: fromChunks,
      downgradedForMissingEvidence: false,
    };
  }

  return {
    ...f,
    rating: 0,
    excerpts: [],
    downgradedForMissingEvidence: true,
  };
}

function clipForCategoryFocus(text: string): string {
  const max = OFFICIAL_SCAN_CATEGORY_FOCUS_MAX_CHARS_PER_CHUNK;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[…segment truncated for model context limit…]`;
}

async function extractForCategory(params: {
  category: OfficialScanCategoryKey;
  candidateChunkIndexes: number[];
  chunks: Array<{ chunkIndex: number; text: string }>;
}): Promise<CategoryFocusedResult> {
  const chosen = params.chunks.filter((c) => params.candidateChunkIndexes.includes(c.chunkIndex)).slice(0, 3);
  const joined = chosen
    .map((c) => `TRANSCRIPT PART ${c.chunkIndex + 1}\n${clipForCategoryFocus(c.text)}`)
    .join('\n\n---\n\n');

  const focusExtras: string[] = [];
  if (params.category === 'lgbtq') focusExtras.push(GENDER_FOCUS_SCOPE);
  if (params.category === 'language') focusExtras.push(LANGUAGE_FOCUS_SCOPE);
  if (params.category === 'romance') focusExtras.push(ROMANCE_FOCUS_SCOPE);
  if (isOfficialScanStoryThemeKey(params.category)) focusExtras.push(STORY_THEME_FOCUS_SCOPE);
  if (params.category === 'fantasy') focusExtras.push(FANTASY_FOCUS_SCOPE);
  if (params.category === 'sciFi') focusExtras.push(SCI_FI_FOCUS_SCOPE);
  if (params.category === 'disability') focusExtras.push(DISABILITY_FOCUS_SCOPE);
  const scopeBlock = focusExtras.length > 0 ? `\n${focusExtras.join('\n\n')}\n` : '';

  const prompt = `You are BookLooky's official paid transcript rater (LRS). Focus ONLY on category: ${params.category}.\n\nYou will be given a few parts of the transcript (labeled TRANSCRIPT PART n — this is an internal sequence number, not a chapter). Your job:\n- Assign an integer rating 0-5 for THIS category for the whole book, based ONLY on the evidence present here.\n- If rating > 0, extract EXACTLY 5 passages (short excerpts, 1-4 sentences each) that justify the rating.\n- Each excerpt must include enough surrounding context to avoid false positives.\n- Each excerpt object MUST include both "excerpt" and "explanation" as non-empty strings; omitting either will invalidate the evidence.\n- If rating == 0, return excerpts: [] and explain that no meaningful results were found.${scopeBlock}\nReturn ONLY JSON:\n{\n  \"category\": \"${params.category}\",\n  \"rating\": 0,\n  \"rationale\": \"...\",\n  \"excerpts\": [\n    {\"excerpt\":\"...\",\"explanation\":\"...\",\"locationHint\":\"Chapter 4\"}\n  ]\n}\n\nFor each excerpt, locationHint is optional: use a chapter or section label if the quoted text or nearby lines name it (e.g. \"Ch. 12\", \"Epilogue\"). Never use the word \"chunk\". Omit locationHint if the passage does not indicate chapter/section.\n\nTRANSCRIPT EVIDENCE:\n${joined}`;

  const res = await grokJson<any>(prompt, { maxTokens: 2500, temperature: 0.2, timeoutMs: 70000 });
  const rationaleText = String(res.rationale || '').trim();
  const rating = romanceRatingWithInnuendoRule(clampInt0to5(res.rating), rationaleText);
  const excerpts = Array.isArray(res.excerpts) ? res.excerpts : [];

  const normalizedExcerpts = excerpts
    .slice(0, 5)
    .map((e: any) => ({
      excerpt: String(e.excerpt || '').trim(),
      explanation: String(e.explanation || '').trim(),
      locationHint: String(e.locationHint || '').trim() || undefined,
    }))
    .filter((e: any) => e.excerpt && e.explanation);

  return {
    category: params.category,
    rating,
    rationale: rationaleText,
    excerpts: rating > 0 ? normalizedExcerpts.slice(0, 5) : [],
  };
}

/** Category extraction + synthesis after all per-segment scans are available (possibly resumed across runs). */
export async function finalizeOfficialScanFromChunkScans(params: {
  title: string;
  author: string;
  isbn?: string;
  chunks: Array<{ chunkIndex: number; text: string }>;
  scans: OfficialScanChunkScanResult[];
}): Promise<{ report: OfficialScanReport; grokAnalysis: ContentAnalysis }> {
  if (params.chunks.length === 0) {
    throw new Error('No transcript chunks found for this job.');
  }
  if (params.scans.length !== params.chunks.length) {
    throw new Error(`Chunk scan mismatch: expected ${params.chunks.length} segment scans, found ${params.scans.length}.`);
  }

  const scansSorted = [...params.scans].sort((a, b) => a.chunkIndex - b.chunkIndex);
  for (let i = 0; i < params.chunks.length; i++) {
    if (scansSorted[i].chunkIndex !== params.chunks[i].chunkIndex) {
      throw new Error('Chunk scan indexes do not align with transcript segments.');
    }
  }

  const candidatesByCategory = Object.fromEntries(
    OFFICIAL_SCAN_CATEGORIES.map((cat) => [cat, new Map<number, number>()])
  ) as Record<OfficialScanCategoryKey, Map<number, number>>;

  for (const scan of scansSorted) {
    for (const cat of OFFICIAL_SCAN_CATEGORIES) {
      const count = scan.signals[cat]?.length ?? 0;
      if (count > 0) {
        candidatesByCategory[cat].set(scan.chunkIndex, (candidatesByCategory[cat].get(scan.chunkIndex) ?? 0) + count);
      }
    }
  }

  const focused = await Promise.all(
    OFFICIAL_SCAN_CATEGORIES.map(async (cat) => {
      const ranked = Array.from(candidatesByCategory[cat].entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([chunkIndex]) => chunkIndex);
      return await extractForCategory({
        category: cat,
        candidateChunkIndexes: ranked,
        chunks: params.chunks,
      });
    })
  );

  const reconciled: ReconciledCategory[] = focused.map((f) => reconcileCategoryEvidence(f, scansSorted));

  const ratings = emptyRatings();
  const defaultZeroNote = 'No meaningful results discovered for this rating.';
  for (const f of reconciled) {
    if (f.rating > 0 && f.excerpts.length > 0) {
      ratings[f.category] = {
        rating: f.rating,
        excerpts: f.excerpts.slice(0, 5),
      };
    } else {
      ratings[f.category] = {
        rating: 0,
        noteWhenZero: f.downgradedForMissingEvidence ? NOTE_RATING_ZERO_NO_VERIFIED_EVIDENCE : defaultZeroNote,
      };
    }
  }

  const voiceSample =
    params.chunks.length > 0
      ? params.chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex)[0]?.text ?? ''
      : '';
  const chunkNotes = scansSorted
    .map((s) => (typeof s.notes === 'string' ? s.notes.trim() : ''))
    .filter(Boolean)
    .slice(0, 5);

  const agePrompt = buildOfficialScanAgeRecommendationPrompt({
    title: params.title,
    author: params.author,
    isbn: params.isbn,
    reconciled,
    voiceSample,
    chunkNotes,
  });

  const ageRaw = await grokJson<Record<string, unknown>>(agePrompt, {
    maxTokens: 3200,
    temperature: 0.2,
    timeoutMs: 90000,
  });
  const ageRecommendation = parseOfficialScanAgeRecommendationResponse(ageRaw);
  const minimumAge = normalizeOfficialScanMinimumAge(ageRecommendation.minimumAge);
  const confidence = clamp01(confidenceLabelToScore(ageRecommendation.confidence));
  const reasoningSummary = ageRecommendation.reasoningSummary;

  const report: OfficialScanReport = {
    minimumAge,
    confidence,
    ratings,
    reasoningSummary: reasoningSummary || 'Ratings generated from transcript evidence.',
    ageRecommendation: {
      ...ageRecommendation,
      minimumAge,
      reasoningSummary: reasoningSummary || ageRecommendation.reasoningSummary,
    },
  };

  const grokAnalysis: ContentAnalysis = {
    violence: clampInt0to5(ratings.violence.rating),
    romance: clampInt0to5(ratings.romance.rating),
    mentalHealth: clampInt0to5(ratings.mentalHealth.rating),
    fantasy: clampInt0to5(ratings.fantasy.rating),
    language: clampInt0to5(ratings.language.rating),
    substanceUse: clampInt0to5(ratings.substanceUse.rating),
    lgbtq: clampInt0to5(ratings.lgbtq.rating),
    fear: clampInt0to5(ratings.fear.rating),
    sciFi: clampInt0to5(ratings.sciFi.rating),
    disability: clampInt0to5(ratings.disability.rating),
    confidence,
    reasoning: report.reasoningSummary,
    minimumAge,
    ageSource: 'ai',
  };

  return { report, grokAnalysis };
}

/**
 * Ask the model for additional distinct transcript excerpts for one category.
 * Existing excerpts are passed so the model avoids duplicates.
 */
export async function extractAdditionalExamplesForCategory(params: {
  category: OfficialScanCategoryKey;
  chunks: Array<{ chunkIndex: number; text: string }>;
  scans: OfficialScanChunkScanResult[];
  existingExcerpts: OfficialScanExcerpt[];
  count?: number;
  currentRating: number;
}): Promise<OfficialScanExcerpt[]> {
  const count = Math.max(1, Math.min(10, params.count ?? 5));
  if (params.currentRating <= 0) {
    throw new Error('Cannot request more examples when the category rating is 0.');
  }

  const scansSorted = [...params.scans].sort((a, b) => a.chunkIndex - b.chunkIndex);
  const signalCounts = new Map<number, number>();
  for (const scan of scansSorted) {
    const n = scan.signals[params.category]?.length ?? 0;
    if (n > 0) signalCounts.set(scan.chunkIndex, n);
  }

  let candidateIndexes = Array.from(signalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([idx]) => idx);

  if (candidateIndexes.length < 5) {
    const extras = params.chunks
      .map((c) => c.chunkIndex)
      .filter((idx) => !candidateIndexes.includes(idx))
      .slice(0, 5 - candidateIndexes.length);
    candidateIndexes = [...candidateIndexes, ...extras];
  }
  candidateIndexes = candidateIndexes.slice(0, 5);

  const chosen = params.chunks.filter((c) => candidateIndexes.includes(c.chunkIndex));
  const joined = chosen
    .map((c) => `TRANSCRIPT PART ${c.chunkIndex + 1}\n${clipForCategoryFocus(c.text)}`)
    .join('\n\n---\n\n');

  const focusExtras: string[] = [];
  if (params.category === 'lgbtq') focusExtras.push(GENDER_FOCUS_SCOPE);
  if (params.category === 'language') focusExtras.push(LANGUAGE_FOCUS_SCOPE);
  if (params.category === 'romance') focusExtras.push(ROMANCE_FOCUS_SCOPE);
  if (isOfficialScanStoryThemeKey(params.category)) focusExtras.push(STORY_THEME_FOCUS_SCOPE);
  if (params.category === 'fantasy') focusExtras.push(FANTASY_FOCUS_SCOPE);
  if (params.category === 'sciFi') focusExtras.push(SCI_FI_FOCUS_SCOPE);
  if (params.category === 'disability') focusExtras.push(DISABILITY_FOCUS_SCOPE);
  const scopeBlock = focusExtras.length > 0 ? `\n${focusExtras.join('\n\n')}\n` : '';

  const existingBlock =
    params.existingExcerpts.length > 0
      ? `\n\nALREADY CAPTURED (do NOT repeat or closely paraphrase):\n${params.existingExcerpts
          .map((e, i) => `${i + 1}. "${e.excerpt.slice(0, 240)}"`)
          .join('\n')}`
      : '';

  const prompt = `You are BookLooky's official paid transcript rater (LRS). Focus ONLY on category: ${params.category}.\n\nThe book already has an official rating of ${params.currentRating} for this category. Your job is to find EXACTLY ${count} NEW passages from the transcript that provide additional proof for this rating.\n- Each passage must be distinct from the already captured list below.\n- Each excerpt must include enough surrounding context to avoid false positives.\n- Each excerpt object MUST include both "excerpt" and "explanation" as non-empty strings.${scopeBlock}${existingBlock}\n\nReturn ONLY JSON:\n{\n  \"category\": \"${params.category}\",\n  \"excerpts\": [\n    {\"excerpt\":\"...\",\"explanation\":\"...\",\"locationHint\":\"Chapter 4\"}\n  ]\n}\n\nFor each excerpt, locationHint is optional: use a chapter or section label if the quoted text or nearby lines name it. Never use the word "chunk".\n\nTRANSCRIPT EVIDENCE:\n${joined}`;

  const res = await grokJson<any>(prompt, { maxTokens: 3500, temperature: 0.2, timeoutMs: 90000 });
  const excerpts = Array.isArray(res.excerpts) ? res.excerpts : [];
  const normalized = excerpts
    .map((e: any) => ({
      excerpt: String(e.excerpt || '').trim(),
      explanation: String(e.explanation || '').trim(),
      locationHint: String(e.locationHint || '').trim() || undefined,
    }))
    .filter((e: any) => e.excerpt && e.explanation);

  const merged = dedupeExcerpts([...params.existingExcerpts, ...normalized]);
  const existingKeys = new Set(params.existingExcerpts.map((e) => e.excerpt.replace(/\s+/g, ' ').trim().toLowerCase()));
  return merged.filter(
    (e) => !existingKeys.has(e.excerpt.replace(/\s+/g, ' ').trim().toLowerCase())
  );
}

/**
 * End-to-end convenience: clean + chunk a transcript, scan every segment, and produce the official report.
 * (BookLooky production runs the same phases with resumable persistence between them.)
 */
export async function rateTranscript(params: {
  title: string;
  author: string;
  isbn?: string;
  transcript: string;
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}): Promise<{ report: OfficialScanReport; grokAnalysis: ContentAnalysis }> {
  const text = cleanTranscriptText(params.transcript);
  if (!text) {
    throw new Error('Transcript is empty after normalization.');
  }

  const chunkTexts = chunkTranscript(text);
  const chunks = chunkTexts.map((t, chunkIndex) => ({ chunkIndex, text: t }));
  const scans: OfficialScanChunkScanResult[] = [];

  await runOfficialScanChunkScanPass({
    chunks,
    completedChunkIndexes: new Set(),
    timeBudgetMs: Number.MAX_SAFE_INTEGER,
    concurrency: Math.max(1, params.concurrency ?? OFFICIAL_SCAN_DEFAULT_CHUNK_SCAN_CONCURRENCY),
    onEach: async (result) => {
      scans.push(result);
      params.onProgress?.(scans.length, chunks.length);
    },
  });

  return finalizeOfficialScanFromChunkScans({
    title: params.title,
    author: params.author,
    isbn: params.isbn,
    chunks,
    scans,
  });
}
