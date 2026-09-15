/**
 * Shared LRS age bands for official transcript scans.
 * Display is age-only (1+, 4+, 8+, 13+, 18+).
 */

export const LRS_AGE_BANDS = [1, 4, 8, 13, 18] as const;
export type LrsAgeBand = (typeof LRS_AGE_BANDS)[number];

export const LRS_AGE_BAND_LABELS: Record<LrsAgeBand, string> = {
  1: '1+',
  4: '4+',
  8: '8+',
  13: '13+',
  18: '18+',
};

/** @deprecated Use LRS_AGE_BAND_LABELS — kept for backward-compatible imports. */
export const LRS_MOVIE_RATING_BY_AGE: Record<LrsAgeBand, { marketCategory: string }> = {
  1: { marketCategory: LRS_AGE_BAND_LABELS[1] },
  4: { marketCategory: LRS_AGE_BAND_LABELS[4] },
  8: { marketCategory: LRS_AGE_BAND_LABELS[8] },
  13: { marketCategory: LRS_AGE_BAND_LABELS[13] },
  18: { marketCategory: LRS_AGE_BAND_LABELS[18] },
};

export const LRS_AGE_BAND_PROMPT = `minimumAge: youngest appropriate audience. Use exactly one of: 1, 4, 8, 13, or 18
(1 = baby, board, tactile, cloth, wordless or very-few-words books — ages 0–3 snap here. 4 = picture books and early readers. 8 = elementary–middle grade. 13 = teen / young adult. 18 = adult)
Never output 0, 2, or 3 (those are 1+). Never output 10, 11, 12, 16, or 17.`;

export function normalizeLrsMinimumAge(value: unknown, fallback: LrsAgeBand = 8): LrsAgeBand {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 4) return 1;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 13) return 13;
  return 18;
}

export function lrsAgeBandForAge(age: unknown): {
  minimumAge: LrsAgeBand;
  marketCategory: string;
} {
  const minimumAge = normalizeLrsMinimumAge(age);
  return { minimumAge, marketCategory: LRS_AGE_BAND_LABELS[minimumAge] };
}

export const lrsMovieRatingForAge = lrsAgeBandForAge;

export function formatLrsAgeDisplay(age: unknown): string {
  return LRS_AGE_BAND_LABELS[normalizeLrsMinimumAge(age)];
}

export function formatLrsAgeShort(age: unknown): string {
  return formatLrsAgeDisplay(age);
}
