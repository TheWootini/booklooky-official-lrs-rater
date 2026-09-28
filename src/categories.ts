// SPDX-License-Identifier: MIT
import type { OfficialScanCategoryKey } from './types';

/** How strong or frequent sensitive content is. */
export const OFFICIAL_SCAN_CONTENT_INTENSITY_KEYS = [
  'violence',
  'romance',
  'mentalHealth',
  'language',
  'substanceUse',
  'fear',
] as const satisfies readonly OfficialScanCategoryKey[];

/** What the book is about — prominence indicators, not warnings. */
export const OFFICIAL_SCAN_STORY_THEME_KEYS = [
  'fantasy',
  'lgbtq',
  'sciFi',
  'disability',
] as const satisfies readonly OfficialScanCategoryKey[];

export const OFFICIAL_SCAN_CATEGORIES: OfficialScanCategoryKey[] = [
  ...OFFICIAL_SCAN_CONTENT_INTENSITY_KEYS,
  ...OFFICIAL_SCAN_STORY_THEME_KEYS,
];

export const OFFICIAL_SCAN_CATEGORY_LABELS: Record<OfficialScanCategoryKey, string> = {
  violence: 'Violence',
  romance: 'Love & Romance',
  mentalHealth: 'Mental Health',
  fantasy: 'Fantasy / Supernatural',
  sciFi: 'Sci-Fi / Futuristic',
  language: 'Language',
  substanceUse: 'Substance Use',
  lgbtq: 'LGBTQ+ Representation',
  disability: 'Disability & Neurodiversity',
  fear: 'Fear / Horror',
};

export function isOfficialScanStoryThemeKey(key: OfficialScanCategoryKey): boolean {
  return (OFFICIAL_SCAN_STORY_THEME_KEYS as readonly string[]).includes(key);
}
