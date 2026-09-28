// SPDX-License-Identifier: MIT
/**
 * Deterministic post-processing rules applied on top of model output.
 */

/** Substrings in model-written rationale that imply sexual innuendo was considered—enforce romance ≥ 1 if score stayed 0. */
const REASONING_INNUENDO_HINTS = [
  'innuendo',
  'double entendre',
  'euphemis',
  'sexual tension',
  'sexual subtext',
  'implied sexual',
  'flirtation',
  'flirting',
  'sexual humor',
  'off-color',
];

function reasoningImpliesInnuendoDiscussed(text: string): boolean {
  const t = text.toLowerCase();
  for (const hint of REASONING_INNUENDO_HINTS) {
    const index = t.indexOf(hint);
    if (index !== -1) {
      const preceding = t.substring(Math.max(0, index - 45), index);
      if (!preceding.match(/\b(no|not|without|lack of|none|zero)\b/)) {
        return true;
      }
    }
  }
  return false;
}

/** Enforce romance ≥ 1 when the rationale admits innuendo-like content but the rating stayed 0. */
export function romanceRatingWithInnuendoRule(rating: number, rationaleLike: string): number {
  if (rating !== 0) return rating;
  if (reasoningImpliesInnuendoDiscussed(rationaleLike)) return 1;
  return rating;
}
