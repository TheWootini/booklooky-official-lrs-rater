# BookLooky Official LRS Rater

The reference implementation of BookLooky's **official transcript-based Looky Rating System (LRS) rater** — the engine behind [BookLooky Official Scan](https://booklooky.com/official-scan/upload).

Given a full book transcript, it produces an evidence-backed content report:

- **10 LRS category ratings** (0–5) in two groups:
  - **Content Intensity:** Violence, Love & Romance, Mental Health, Language, Substance Use, Fear / Horror
  - **Story Themes:** Fantasy / Supernatural, LGBTQ+ Representation, Sci-Fi / Futuristic, Disability & Neurodiversity
- **Quoted transcript excerpts** justifying every non-zero rating (a non-zero score with no verifiable excerpt is downgraded to 0)
- **A minimum-age recommendation** on fixed bands (`1+`, `4+`, `8+`, `13+`, `18+`) with a five-part, evidence-based justification

## Scope

This repository implements BookLooky's **official transcript-based rater only**. It does not include the metadata-based quick-scan used on booklooky.com when users search a title and click Scan Now — that is a separate, private system. Official BookLooky-certified ratings and LRS badges are issued only through [booklooky.com](https://booklooky.com).

## How it works

The rater runs three phases over a transcript:

1. **Segment scan** — the transcript is split into ~100k-character overlapping segments. Each segment is scanned once; the model extracts up to 3 short quotes per category with an explanation of why each matters. Category scopes are strictly defined (e.g. `language` means profanity/slurs/explicit wording only — never jargon or wordplay; `lgbtq` means LGBTQ+ representation only — never generic gender-role content).
2. **Category focus** — for each of the 10 categories, the segments with the strongest signals are re-read in full and the model assigns a whole-book 0–5 rating backed by exactly 5 quoted passages. Content Intensity categories measure strength/frequency; Story Themes measure plot prominence (not warnings). Deterministic post-processing rules then apply (e.g. if the model's own rationale admits sexual innuendo but scored romance 0, the rating is raised to 1). **Every non-zero rating must have validated excerpt evidence, or it is downgraded to 0.**
3. **Age recommendation** — with the category ratings locked, a final pass determines a single minimum age using a fixed five-part framework: protagonist age & voice, content intensity (LRS), tone & thematic maturity, comparable titles, and edge cases.

See [docs/LRS-SPEC.md](docs/LRS-SPEC.md) for the category definitions and rating scale.

## Requirements

- Node.js 18+
- An [xAI API key](https://docs.x.ai/) (`GROK_API_KEY`)

## CLI usage

```bash
npm install
npm run build

GROK_API_KEY=your-key node dist/cli/lrs-scan.js \
  --title "Book Title" \
  --author "Author Name" \
  --isbn 9781234567890 \
  --out report.json \
  transcript.txt
```

The transcript must be plain text (`.txt`). If your source is PDF, DOCX, or EPUB, extract the text first with the tool of your choice.

A full run costs one model call per ~100k-character segment, plus 10 category-focus calls and 1 age-recommendation call.

## Library usage

```ts
import { rateTranscript } from '@booklooky/official-lrs-rater';

const { report, grokAnalysis } = await rateTranscript({
  title: 'Book Title',
  author: 'Author Name',
  transcript: fullBookText,
  model: process.env.GROK_MODEL_REASONING, // optional; default grok-4.6
});

console.log(report.ratings.violence.rating);       // 0–5
console.log(report.ratings.violence.excerpts);     // quoted evidence
console.log(report.minimumAge);                    // 1, 4, 8, 13, or 18
console.log(report.ageRecommendation?.reasons);    // five-part justification
```

For long books in serverless or resumable environments, the phases are also exported individually: `chunkTranscript`, `runOfficialScanChunkScanPass` (with a time budget and per-result callback for persistence), and `finalizeOfficialScanFromChunkScans`.

## Configuration

| Environment variable | Purpose | Default |
|---|---|---|
| `GROK_API_KEY` | xAI API key (required) | — |
| `GROK_MODEL_REASONING` | Model used for all passes | `grok-4.6` |

## Output shape

```jsonc
{
  "report": {
    "minimumAge": 13,
    "confidence": 0.85,                 // 0–1
    "reasoningSummary": "…",
    "ratings": {
      "violence": {
        "rating": 3,
        "excerpts": [
          { "excerpt": "…", "explanation": "…", "locationHint": "Chapter 4" }
        ]
      },
      "language": {
        "rating": 0,
        "noteWhenZero": "No meaningful results discovered for this rating."
      }
      // … all 10 categories
    },
    "ageRecommendation": {
      "minimumAge": 13,
      "marketCategory": "13+",
      "confidence": "high",
      "reasons": [ { "title": "Protagonist age & voice", "text": "…" } /* ×5 */ ],
      "detailedJustification": "…",
      "reasoningSummary": "…"
    }
  },
  "grokAnalysis": {
    "violence": 3, "romance": 1, "mentalHealth": 2, "fantasy": 4,
    "language": 0, "substanceUse": 0, "lgbtq": 0, "fear": 2,
    "sciFi": 0, "disability": 0,
    "confidence": 0.85, "reasoning": "…", "minimumAge": 13, "ageSource": "ai"
  }
}
```

## LLM discovery files

Agents and coding assistants can start here:

| File | Purpose |
|---|---|
| [`/llms.txt`](llms.txt) | Curated index (canonical [llms.txt](https://llmstxt.org/) format) |
| [`/llms-full.txt`](llms-full.txt) | README + LRS-SPEC in one fetch |
| [`/.well-known/llms.txt`](.well-known/llms.txt) | Mirror for agents that check RFC 8615-style paths |
| [`/.well-known/ai.json`](.well-known/ai.json) | Machine-readable discovery pointers |

On GitHub these are available as raw files under `main`. If you later host this package on a custom domain, serve the same paths from the origin root as `text/plain` / `application/json`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [GOVERNANCE.md](GOVERNANCE.md).

Pull requests use a [Contributor License Agreement](CLA.md). The CLA Assistant GitHub Action will comment on your PR with signing instructions.

## Trademark

"BookLooky", "Looky Rating System", "LRS", and the Certified LRS Badge are trademarks of BookLooky. This code is MIT-licensed; the trademarks are not. Ratings produced by running this tool yourself are not official BookLooky ratings.

## License

[MIT](LICENSE.md)
