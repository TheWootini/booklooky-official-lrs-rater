import type { OfficialScanCategoryKey } from './types';

/** The 8 LRS categories, rated 0–5. */
export const OFFICIAL_SCAN_CATEGORIES: OfficialScanCategoryKey[] = [
  'violence',
  'romance',
  'mentalHealth',
  'fantasy',
  'language',
  'substanceUse',
  'lgbtq',
  'fear',
];

export const OFFICIAL_SCAN_CATEGORY_LABELS: Record<OfficialScanCategoryKey, string> = {
  violence: 'Violence',
  romance: 'Love & Romance',
  mentalHealth: 'Mental Health',
  fantasy: 'Fantasy / Supernatural',
  language: 'Language',
  substanceUse: 'Substance Use',
  lgbtq: 'LGBTQ+',
  fear: 'Fear / Horror',
};
