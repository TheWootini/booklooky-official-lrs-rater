# Changelog

All notable changes to `@booklooky/official-lrs-rater` are documented here.

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
