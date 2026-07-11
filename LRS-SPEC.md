# Looky Rating System (LRS) Specification

This document defines the official rules for the Looky Rating System (LRS) used in official transcript-based scans.

## Category Groups

### Content Intensity (6 categories)
These measure the **strength and frequency** of sensitive content.

- **Violence**
- **Love & Romance**
- **Mental Health**
- **Language** (profanity, slurs, explicit wording)
- **Substance Use**
- **Fear / Horror**

### Story Themes (4 categories)
These measure **plot prominence / centrality** (not warnings).

- **Fantasy / Supernatural**
- **LGBTQ+ Representation**
- **Sci-Fi / Futuristic**
- **Disability & Neurodiversity**

## Rating Scale (0–5)

**Content Intensity Categories**
- **0** — None or negligible
- **1** — Mild / infrequent
- **2** — Moderate
- **3** — Notable / regular
- **4** — Strong / frequent
- **5** — Very strong / pervasive

**Story Themes Categories**
- **0** — Not present or barely mentioned
- **1** — Minor / background element
- **2** — Supporting element
- **3** — Significant element
- **4** — Major element
- **5** — Central to the plot

## Evidence Requirements
- Every non-zero rating **must** be supported by direct transcript excerpts.
- If no valid excerpts are found for a non-zero score, the rating is downgraded to 0.
- Exactly 5 supporting excerpts are selected for each non-zero rating in the final report.

## Age Recommendation
A minimum age (e.g. 10+) is calculated using a five-part framework:
1. Protagonist age & voice
2. Content Intensity (LRS scores)
3. Tone & thematic maturity
4. Comparable titles
5. Edge cases / special considerations

## Additional Rules
- Ratings are evidence-driven and deterministic where possible.
- Strict category scopes apply (e.g., “Language” covers profanity/slurs only — not jargon or wordplay).
- Post-processing rules are applied to maintain consistency (e.g., certain contradictions trigger automatic adjustments).

For implementation details, see the code in this repository.

Last updated: July 2026