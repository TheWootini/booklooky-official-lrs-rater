# The Looky Rating System (LRS)

The Looky Rating System rates books across **8 content categories** on a **0–5 intensity scale**, providing spoiler-free content guidance. Scores measure how present a theme is in the text — not age-appropriateness, and not a judgment of quality.

## The scale

| Score | Meaning |
|---|---|
| 0 | None — the theme is not present |
| 1 | Very low — brief, mild references |
| 2 | Low — present but light |
| 3 | Medium — a recurring or notable element |
| 4 | Moderate–high — a significant, sustained element |
| 5 | High — the theme is central to what the story is about |

A score is never lowered because the book targets young readers; intensity and audience are assessed separately (see [Age recommendation](#age-recommendation)).

## The 8 categories

| Key | Label | Covers |
|---|---|---|
| `violence` | Violence | Physical conflict, fighting, injury, death, peril, graphic descriptions |
| `romance` | Love & Romance | Romantic feelings and relationships, kissing, sexual content — including flirtation, innuendo, implied sexual tension, double entendres, and euphemistic references |
| `mentalHealth` | Mental Health | Grief, anxiety, depression, trauma, self-harm, suicide, psychological struggle |
| `fantasy` | Fantasy / Supernatural | Magic, supernatural elements, secondary worlds, magical creatures |
| `language` | Language | Profanity and curse words; slurs or hateful epithets; sexually explicit or crude wording. **Not** jargon, puns, wordplay, invented terms, or formal vocabulary — the category rates the vulgarity of the wording itself |
| `substanceUse` | Substance Use | Alcohol, drugs, smoking — use, abuse, and depiction |
| `lgbtq` | LGBTQ+ | LGBTQ+ representation: sexual orientation or gender identity, same-sex/queer relationships, coming out, transition, homophobia/transphobia. **Not** generic gender-role content, men-vs-women dynamics, or "strong woman" tropes with no LGBTQ+ through-line |
| `fear` | Fear / Horror | Suspense, horror, dread, frightening imagery |

### Category boundary rules

Two boundaries cause most misratings, so the official rater enforces them explicitly:

- **Innuendo routes to `romance`, not `language`.** Implied sexual subtext, double entendres, and euphemism belong to `romance` even when no crude word appears on the page. `language` only triggers on the explicitness of the wording itself.
- **`lgbtq` requires an actual LGBTQ+ through-line.** General banter about men and women, sexism, or feminism without a queer element scores 0. Conversely, if evidence of LGBTQ+ representation is present in the rater's own rationale, the score cannot remain 0.

## Evidence requirements (official transcript scan)

The official rater reads the full book text and enforces:

1. **Every non-zero rating must be backed by quoted transcript excerpts** (up to 5 per category), each with an explanation of why it matters. If no validated excerpt supports a positive rating, the rating is downgraded to 0 and the report says so.
2. **Zero ratings carry an explicit note** stating that no meaningful results were discovered.
3. **Excerpts are deduplicated** and kept short (1–4 sentences) with enough surrounding context to avoid false positives.

## Age recommendation

After the 8 category scores are locked, a single **minimum age** (a whole number, e.g. `10` meaning 10+; range 0–25, no fixed buckets) is determined using a five-part framework, applied in order:

1. **Protagonist age & voice** — kids typically read up 2–3 years
2. **Content intensity (LRS)** — tied explicitly to the locked category scores
3. **Tone & thematic maturity** — external/hopeful vs internal/dark/ambiguous
4. **Comparable titles** — market positioning (e.g. Percy Jackson vs The Hunger Games)
5. **Edge cases & author notes** — borderline factors worth flagging

Each report includes all five reasons, a detailed justification, a confidence label (`high` / `medium` / `low`, stored as 0.85 / 0.65 / 0.45), and an executive summary.
