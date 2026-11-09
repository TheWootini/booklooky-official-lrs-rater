// SPDX-License-Identifier: MIT
/**
 * Shared LRS age bands for official transcript scans.
 * Display is age-only (1+, 4+, 8+, 13+, 15+, 18+).
 */

export const LRS_AGE_BANDS = [1, 4, 8, 13, 15, 18] as const;
export type LrsAgeBand = (typeof LRS_AGE_BANDS)[number];

export const LRS_AGE_BAND_LABELS: Record<LrsAgeBand, string> = {
  1: '1+',
  4: '4+',
  8: '8+',
  13: '13+',
  15: '15+',
  18: '18+',
};

/** @deprecated Use LRS_AGE_BAND_LABELS — kept for backward-compatible imports. */
export const LRS_MOVIE_RATING_BY_AGE: Record<LrsAgeBand, { marketCategory: string }> = {
  1: { marketCategory: LRS_AGE_BAND_LABELS[1] },
  4: { marketCategory: LRS_AGE_BAND_LABELS[4] },
  8: { marketCategory: LRS_AGE_BAND_LABELS[8] },
  13: { marketCategory: LRS_AGE_BAND_LABELS[13] },
  15: { marketCategory: LRS_AGE_BAND_LABELS[15] },
  18: { marketCategory: LRS_AGE_BAND_LABELS[18] },
};

/**
 * Bumped when the band set changes. v2 added 15+ (October 2026).
 * This rater does not re-score older reports on its own.
 */
export const LRS_AGE_SCALE_VERSION = 2;

/** 15+ = mature teen. Shared by the age-band prompt and the official age recommendation. */
export const LRS_15_PLUS_DEFINITION =
  'mature teen: stronger or frequent profanity, non-graphic (fade-to-black or briefly described) sexual content, more intense but non-gratuitous violence, and/or depicted substance use.';

/** 18+ is reserved for hardcore adult material only. */
export const LRS_18_PLUS_DEFINITION =
  'adult only, reserved for explicit (on-page, detailed) sexual content, graphic or gratuitous violence such as lingering gore or torture, or otherwise hardcore adult material. Do NOT use 18 just because a book is shelved as adult fiction or has mature themes; use 15 for those.';

export const LRS_AGE_BAND_PROMPT = `minimumAge: youngest appropriate audience. Use exactly one of: 1, 4, 8, 13, 15, or 18
(1 = baby, board, tactile, cloth, wordless or very-few-words books; ages 0–3 snap here. 4 = picture books and early readers. 8 = elementary–middle grade. 13 = teen / young adult. 15 = ${LRS_15_PLUS_DEFINITION} 18 = ${LRS_18_PLUS_DEFINITION})
Never output 0, 2, or 3 (those are 1+). Never output 10, 11, 12, 14, 16, or 17.
Most mainstream YA and adult fiction with mature-but-not-explicit content belongs at 15, not 18.`;

export function normalizeLrsMinimumAge(value: unknown, fallback: LrsAgeBand = 8): LrsAgeBand {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 4) return 1;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 13) return 13;
  if (n <= 15) return 15;
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
