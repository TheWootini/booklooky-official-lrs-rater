# Changelog

All notable changes to `@booklooky/official-lrs-rater` are documented here.

## [0.2.1] - 2026-09-28

### Added

- SPDX `MIT` identifiers on TypeScript sources; documentation licensed CC BY 4.0 (`docs/LICENSE.md`).
- `THIRD_PARTY_NOTICES.md`, `SUPPORT.md`, and `DECISIONS.md`.
- CI `npm audit` and Node.js 18/20/22 test matrix.
- Issue templates with labels and a two-business-day acknowledgement target.

### Changed

- README license, brand-name (not registered-trademark) wording, Node support, English-only note, and higher-education use cases.
- CONTRIBUTING.md requires the CLA; CLA.md links to `LICENSE.md`.
- `package.json` `files` includes `LICENSE.md`; repository URL points at `TheWootini/booklooky-official-lrs-rater`.

[0.2.1]: https://github.com/TheWootini/booklooky-official-lrs-rater/releases/tag/v0.2.1

## [0.2.0] - 2026-09-15

### Changed

- Default xAI model for official transcript rating is **grok-4.6** (`GROK_MODEL_REASONING`).
- Minimum age output uses fixed **LRS age bands** (1, 4, 8, 13, 18 → displayed as 1+, 4+, 8+, 13+, 18+). `marketCategory` is age-only (no movie-style labels).
- Category focus and age recommendation Grok calls use **180s** timeouts; Grok JSON calls **retry once** on abort/timeouts.
- `rateTranscript`, chunk scan pass, finalize, and supplemental excerpt extraction accept an optional **`model`** override.

### Added

- `src/age-bands.ts` exported from the package entry point.
- Unit tests for age band normalization (`npm test`).
- GitHub Actions CI workflow (build + tests).
- `.env.example` for local configuration.

[0.2.0]: https://github.com/TheWootini/booklooky-official-lrs-rater/releases/tag/v0.2.0
