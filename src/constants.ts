/** Tuning constants for transcript chunking and category extraction. */

/**
 * Structural safety cap (pathological inputs). Epic novels (~500k words) land on the order of
 * ~30–80 segments at 100k chars per segment; this stays far above that.
 */
export const OFFICIAL_SCAN_SANITY_MAX_TRANSCRIPT_CHUNKS = 2500;

/**
 * Target size for transcript segments (characters). Larger → fewer model calls for the same book.
 * ~100k keeps million-word corpora to hundreds of segments while staying under typical model context limits.
 */
export const OFFICIAL_SCAN_TRANSCRIPT_CHUNK_CHARS = 100_000;

/** Overlap between consecutive chunks (characters) so splits rarely cut mid-thought. */
export const OFFICIAL_SCAN_TRANSCRIPT_CHUNK_OVERLAP = 4000;

/**
 * `extractForCategory` joins up to 3 full segments; cap each so the combined prompt stays within model limits.
 */
export const OFFICIAL_SCAN_CATEGORY_FOCUS_MAX_CHARS_PER_CHUNK = 36_000;

/** Default parallel model calls while scanning transcript segments. */
export const OFFICIAL_SCAN_DEFAULT_CHUNK_SCAN_CONCURRENCY = 6;
