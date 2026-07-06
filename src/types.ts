/**
 * Core types for the Looky Rating System (LRS) official transcript rater.
 *
 * These shapes match the official report format used by BookLooky.com.
 */

/** LRS category keys — six Content Intensity + four Story Themes, each rated 0–5. */
export type OfficialScanCategoryKey =
  | 'violence'
  | 'romance'
  | 'mentalHealth'
  | 'fantasy'
  | 'language'
  | 'substanceUse'
  | 'lgbtq'
  | 'fear'
  | 'sciFi'
  | 'disability';

/** A quoted transcript passage supporting a category rating. */
export type OfficialScanExcerpt = {
  excerpt: string;
  locationHint?: string;
  explanation: string;
};

export type OfficialScanCategoryResult = {
  /** 0–5 */
  rating: number;
  /** Present when rating > 0. */
  excerpts?: OfficialScanExcerpt[];
  /** Present when rating === 0. */
  noteWhenZero?: string;
};

export type OfficialScanAgeReason = {
  title: string;
  text: string;
};

export type OfficialScanAgeRecommendation = {
  /** Single minimum age in years (e.g. 10 → 10+). Flexible 0–25, not bucket-locked. */
  minimumAge: number;
  marketCategory: string;
  confidence: 'high' | 'medium' | 'low';
  /** Exactly five evidence-based reasons (fixed framework order). */
  reasons: OfficialScanAgeReason[];
  detailedJustification: string;
  authorNotes?: string;
  reasoningSummary: string;
};

export type OfficialScanReport = {
  /** Denormalized from ageRecommendation for convenience. */
  minimumAge: number;
  /** 0–1 */
  confidence: number;
  ratings: Record<OfficialScanCategoryKey, OfficialScanCategoryResult>;
  reasoningSummary: string;
  ageRecommendation?: OfficialScanAgeRecommendation;
};

/** Where a minimum-age value came from. */
export type AgeSource =
  | 'ai'
  | 'categories'
  | 'description'
  | 'publisher'
  | 'admin'
  | 'fallback'
  | 'unknown';

/**
 * Flat score summary (0–5 each) derived from an official report.
 * Shape-compatible with BookLooky's catalog analysis records.
 */
export interface ContentAnalysis {
  violence: number;
  romance: number;
  mentalHealth: number;
  fantasy: number;
  language: number;
  substanceUse: number;
  lgbtq: number;
  fear: number;
  sciFi: number;
  disability: number;
  /** 0–1 */
  confidence: number;
  reasoning: string;
  minimumAge: number | undefined;
  ageSource?: AgeSource;
}
