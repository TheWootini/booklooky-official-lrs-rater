# BookLooky Official LRS Rater

The official reference implementation of BookLooky’s transcript-based **Looky Rating System (LRS)** rater — the engine behind official BookLooky scans.

Given a full book transcript, it produces an evidence-backed content report with:
- 6 LRS category ratings (0–5)
  - **Content Intensity**: Violence, Love & Romance, Mental Health, Language, Substance Use, Fear / Horror
  - **Story Themes**: Fantasy / Supernatural, LGBTQ+ Representation, Sci-Fi / Futuristic, Disability & Neurodiversity
- Quoted transcript excerpts justifying every non-zero rating
- A minimum-age recommendation with a five-part, evidence-based justification

## Scope
This repository contains **only** the official transcript-based rater.  
The quick metadata-based scan used on [booklooky.com](https://booklooky.com) is a separate private system.  
**Official BookLooky-certified ratings and LRS badges** are issued only through booklooky.com.

## How It Works
The rater runs three phases:
1. **Segment scan** — transcript split into overlapping segments.
2. **Category focus** — detailed per-category analysis with evidence.
3. **Age recommendation** — final five-part justification.

See `docs/LRS-SPEC.md` for full category definitions and rating scale.

## Requirements
- Node.js 18+
- xAI API key (`GROK_API_KEY`)

## CLI Usage
```bash
npm install
npm run build

GROK_API_KEY=your-key node dist/cli/lrs-scan.js \
  --title "Book Title" \
  --author "Author Name" \
  --isbn 9781234567890 \
  --out report.json \
  transcript.txt

Library Usage
JavaScriptimport { rateTranscript } from '@booklooky/official-lrs-rater';

const { report } = await rateTranscript({
  title: 'Book Title',
  author: 'Author Name',
  transcript: fullBookText,
});

console.log(report.ratings.violence.rating);   // 0–5
console.log(report.minimumAge);


Configuration


GROK_API_KEYxAI API key (required)
GROK_MODEL_REASONING Model used grok-4.3


Trademark Notice

"BookLooky", "Looky Rating System", "LRS", and the Certified LRS Badge are trademarks of BookLooky. This code is MIT-licensed; trademarks are not included. Ratings produced locally are not official BookLooky ratings.


License
MIT — see LICENSE file.


Contributing
See CONTRIBUTING.md and GOVERNANCE.md