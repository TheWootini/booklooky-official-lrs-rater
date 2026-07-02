import { OFFICIAL_SCAN_CATEGORY_LABELS } from './categories';
import type {
  OfficialScanAgeRecommendation,
  OfficialScanAgeReason,
  OfficialScanCategoryKey,
  OfficialScanReport,
} from './types';

export const OFFICIAL_SCAN_AGE_REASON_TITLES = [
  'Protagonist age & voice',
  'Content intensity (LRS)',
  'Tone & thematic maturity',
  'Comparable titles',
  'Edge cases & author notes',
] as const;

const VOICE_SAMPLE_MAX_CHARS = 1500;

/** Flexible single minimum age (0–25). No 4/8/13/18 bucket lock. */
export function normalizeOfficialScanMinimumAge(value: unknown, fallback = 8): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.ceil(n);
  return Math.max(0, Math.min(rounded, 25));
}

export function confidenceLabelToScore(label: unknown): number {
  const s = String(label || '').trim().toLowerCase();
  if (s === 'high') return 0.85;
  if (s === 'medium') return 0.65;
  if (s === 'low') return 0.45;
  return 0.65;
}

export function confidenceScoreToLabel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.75) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

function normalizeReason(raw: unknown, fallbackTitle: string): OfficialScanAgeReason {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const title = String(obj.title || fallbackTitle).trim() || fallbackTitle;
  const text = String(obj.text || obj.body || obj.rationale || '').trim();
  return { title, text };
}

export function normalizeAgeRecommendation(
  raw: Partial<OfficialScanAgeRecommendation> | undefined,
  fallbackSummary = ''
): OfficialScanAgeRecommendation {
  const reasonsRaw = Array.isArray(raw?.reasons) ? raw!.reasons! : [];
  const reasons: OfficialScanAgeReason[] = OFFICIAL_SCAN_AGE_REASON_TITLES.map((title, i) => {
    const fromRaw = normalizeReason(reasonsRaw[i], title);
    return {
      title: fromRaw.title || title,
      text: fromRaw.text,
    };
  });

  const minimumAge = normalizeOfficialScanMinimumAge(raw?.minimumAge);
  const reasoningSummary =
    String(raw?.reasoningSummary || '').trim() ||
    String(fallbackSummary || '').trim() ||
    'Age recommendation generated from transcript evidence and LRS ratings.';

  return {
    minimumAge,
    marketCategory: String(raw?.marketCategory || '').trim() || 'General audience',
    confidence: (['high', 'medium', 'low'] as const).includes(raw?.confidence as 'high' | 'medium' | 'low')
      ? (raw!.confidence as 'high' | 'medium' | 'low')
      : confidenceScoreToLabel(confidenceLabelToScore(raw?.confidence)),
    reasons,
    detailedJustification: String(raw?.detailedJustification || '').trim() || reasoningSummary,
    authorNotes: String(raw?.authorNotes || '').trim() || undefined,
    reasoningSummary,
  };
}

export function ensureReportAgeRecommendation(report: OfficialScanReport): OfficialScanReport {
  if (report.ageRecommendation) {
    const ageRec = normalizeAgeRecommendation(report.ageRecommendation, report.reasoningSummary);
    return {
      ...report,
      minimumAge: ageRec.minimumAge,
      ageRecommendation: ageRec,
      reasoningSummary: report.reasoningSummary?.trim() || ageRec.reasoningSummary,
    };
  }

  const ageRec = normalizeAgeRecommendation(
    {
      minimumAge: report.minimumAge,
      marketCategory: 'See report summary',
      confidence: confidenceScoreToLabel(report.confidence ?? 0.65),
      reasons: [{ title: OFFICIAL_SCAN_AGE_REASON_TITLES[0], text: report.reasoningSummary }],
      detailedJustification: report.reasoningSummary,
      reasoningSummary: report.reasoningSummary,
    },
    report.reasoningSummary
  );

  return {
    ...report,
    minimumAge: ageRec.minimumAge,
    ageRecommendation: ageRec,
  };
}

type ReconciledCategoryInput = {
  category: OfficialScanCategoryKey;
  rating: number;
  rationale: string;
  excerpts: Array<{ excerpt: string; explanation: string; locationHint?: string }>;
};

export function buildOfficialScanAgeRecommendationPrompt(params: {
  title: string;
  author: string;
  isbn?: string;
  reconciled: ReconciledCategoryInput[];
  voiceSample: string;
  chunkNotes?: string[];
}): string {
  const lrsBlock = params.reconciled
    .map((f) => {
      const label = OFFICIAL_SCAN_CATEGORY_LABELS[f.category] || f.category;
      const excerptLines =
        f.rating > 0 && f.excerpts.length > 0
          ? f.excerpts
              .slice(0, 2)
              .map(
                (e, i) =>
                  `  ${i + 1}. "${e.excerpt.slice(0, 320)}" — ${e.explanation.slice(0, 240)}`
              )
              .join('\n')
          : '  (no scored excerpts)';
      return `${label} (${f.category}): rating=${f.rating}/5\n  Rationale: ${f.rationale.trim()}\n  Evidence:\n${excerptLines}`;
    })
    .join('\n\n');

  const notesBlock =
    params.chunkNotes && params.chunkNotes.length > 0
      ? `\nSCANNER NOTES (POV / context):\n${params.chunkNotes.map((n) => `- ${n}`).join('\n')}\n`
      : '';

  return `You are an expert literature analyst and publishing consultant for BookLooky Official Scan.

Determine the official age recommendation using industry norms (publishers, librarians, Common Sense Media-style guidance).

IMPORTANT:
- The LRS category scores below are FINAL (already verified against the transcript). Do NOT re-score or contradict them.
- Recommend a single minimum age: the youngest appropriate reader as a whole number (e.g. 10 means 10+). Use 0–12 granularly for board/picture/early readers when warranted. Do NOT provide a maximum age or upper bound.
- Apply this decision framework IN ORDER:
  1) Protagonist age & narrative voice (kids often read up 2–3 years)
  2) Content intensity — tie explicitly to the locked LRS scores
  3) Emotional/thematic maturity (external/hopeful vs internal/dark/ambiguous)
  4) Reading level & comparable titles (e.g. Percy Jackson vs Hunger Games)
  5) Borderline edge cases for the author
- Be evidence-based and professional for paying authors. Avoid blanket over-caution, but do not under-rate clear mature content.
- Your recommendation must align with the LRS evidence provided.

Return ONLY JSON:
{
  "minimumAge": 12,
  "marketCategory": "Young Adult (12+)",
  "confidence": "high",
  "reasons": [
    { "title": "Protagonist age & voice", "text": "..." },
    { "title": "Content intensity (LRS)", "text": "..." },
    { "title": "Tone & thematic maturity", "text": "..." },
    { "title": "Comparable titles", "text": "..." },
    { "title": "Edge cases & author notes", "text": "..." }
  ],
  "detailedJustification": "2-3 paragraphs, spoiler-light, constructive for the author",
  "authorNotes": "optional short paragraph on borderline factors",
  "reasoningSummary": "3-5 sentence executive summary for the report header"
}

BOOK:
Title: ${params.title}
Author: ${params.author}
ISBN: ${params.isbn ?? ''}

LOCKED LRS RATINGS:
${lrsBlock}
${notesBlock}
VOICE / OPENING SAMPLE (for POV & protagonist age):
${params.voiceSample.slice(0, VOICE_SAMPLE_MAX_CHARS)}`;
}

export function parseOfficialScanAgeRecommendationResponse(
  raw: Record<string, unknown>,
  fallbackSummary = ''
): OfficialScanAgeRecommendation {
  return normalizeAgeRecommendation(
    {
      minimumAge: raw.minimumAge as number | undefined,
      marketCategory: raw.marketCategory as string | undefined,
      confidence: raw.confidence as OfficialScanAgeRecommendation['confidence'] | undefined,
      reasons: raw.reasons as OfficialScanAgeReason[] | undefined,
      detailedJustification: raw.detailedJustification as string | undefined,
      authorNotes: raw.authorNotes as string | undefined,
      reasoningSummary: raw.reasoningSummary as string | undefined,
    },
    fallbackSummary
  );
}
