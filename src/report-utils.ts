import { OFFICIAL_SCAN_CATEGORIES } from './categories';
import {
  ensureReportAgeRecommendation,
  normalizeAgeRecommendation,
  normalizeOfficialScanMinimumAge,
} from './age-recommendation';
import type { ContentAnalysis, OfficialScanExcerpt, OfficialScanReport } from './types';

function clampInt0to5(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(5, v));
}

function clamp01(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/** Stored as 0–1; display as e.g. "85% confidence score". */
export function officialScanConfidenceToPercent(confidence: unknown): number {
  const v = Number(confidence);
  if (!Number.isFinite(v)) return 0;
  if (v > 1) return Math.max(0, Math.min(100, Math.round(v)));
  return Math.max(0, Math.min(100, Math.round(v * 100)));
}

export function formatOfficialScanConfidenceScore(confidence: unknown): string {
  return `${officialScanConfidenceToPercent(confidence)}% confidence score`;
}

export function officialScanPercentToConfidence(percent: unknown): number {
  const pct = Number(percent);
  if (!Number.isFinite(pct)) return 0;
  return clamp01(pct / 100);
}

function normalizeExcerptKey(text: string): string {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function dedupeExcerpts(excerpts: OfficialScanExcerpt[]): OfficialScanExcerpt[] {
  const seen = new Set<string>();
  const out: OfficialScanExcerpt[] = [];
  for (const e of excerpts) {
    const excerpt = String(e.excerpt || '').trim();
    const explanation = String(e.explanation || '').trim();
    if (!excerpt || !explanation) continue;
    const key = normalizeExcerptKey(excerpt);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      excerpt,
      explanation,
      locationHint: String(e.locationHint || '').trim() || undefined,
    });
  }
  return out;
}

export function buildGrokAnalysisFromReport(
  report: OfficialScanReport,
  previous?: ContentAnalysis
): ContentAnalysis {
  const normalized = ensureReportAgeRecommendation(report);
  const ratings = normalized.ratings;
  return {
    violence: clampInt0to5(ratings.violence?.rating),
    romance: clampInt0to5(ratings.romance?.rating),
    mentalHealth: clampInt0to5(ratings.mentalHealth?.rating),
    fantasy: clampInt0to5(ratings.fantasy?.rating),
    language: clampInt0to5(ratings.language?.rating),
    substanceUse: clampInt0to5(ratings.substanceUse?.rating),
    lgbtq: clampInt0to5(ratings.lgbtq?.rating),
    fear: clampInt0to5(ratings.fear?.rating),
    confidence: clamp01(normalized.confidence),
    reasoning: String(normalized.reasoningSummary || '').trim(),
    minimumAge: normalizeOfficialScanMinimumAge(normalized.minimumAge),
    ageSource: previous?.ageSource ?? 'ai',
  };
}

export function normalizeOfficialScanReport(raw: OfficialScanReport): OfficialScanReport {
  const ratings = {} as OfficialScanReport['ratings'];
  for (const cat of OFFICIAL_SCAN_CATEGORIES) {
    const entry = raw.ratings?.[cat];
    const rating = clampInt0to5(entry?.rating);
    if (rating > 0) {
      ratings[cat] = {
        rating,
        excerpts: dedupeExcerpts(Array.isArray(entry?.excerpts) ? entry.excerpts : []),
      };
    } else {
      ratings[cat] = {
        rating: 0,
        noteWhenZero: String(entry?.noteWhenZero || 'No meaningful results discovered for this rating.').trim(),
      };
    }
  }

  const reasoningSummary =
    String(raw.reasoningSummary || '').trim() ||
    String(raw.ageRecommendation?.reasoningSummary || '').trim() ||
    'Ratings generated from transcript evidence.';

  const ageRecommendation = raw.ageRecommendation
    ? normalizeAgeRecommendation(raw.ageRecommendation, reasoningSummary)
    : undefined;

  const minimumAge = normalizeOfficialScanMinimumAge(
    ageRecommendation?.minimumAge ?? raw.minimumAge
  );

  const base: OfficialScanReport = {
    minimumAge,
    confidence: clamp01(raw.confidence),
    ratings,
    reasoningSummary: ageRecommendation?.reasoningSummary || reasoningSummary,
    ageRecommendation,
  };

  return ensureReportAgeRecommendation(base);
}
