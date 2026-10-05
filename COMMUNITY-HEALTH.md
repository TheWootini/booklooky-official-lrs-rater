<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Software community health

Filled from the template in Appendix 2 of the Apereo incubation process (`http://archived.apereo.org/content/apereo-incubation-process`). Section 5.11 of that process calls the template Appendix 1; in the same document Appendix 1 is the glossary and Appendix 2 is this template. Figures below are from this git history and the GitHub API for `TheWootini/booklooky-official-lrs-rater` on 5 October 2026, plus the v0.2.1 release commit.

**BookLooky Official LRS Rater**

**Status:** Neither incubating nor graduated. Not an Apereo project. Not a former Jasig or Sakai project.

## Background and objectives

This repository is the open-source reference implementation of BookLooky’s official transcript-based Looky Rating System (LRS) rater. Given a full plaintext transcript, it returns ten 0–5 scores and one age band (1+, 4+, 8+, 13+, or 18+), with quoted excerpts for non-zero category scores. Looking up ratings on BookLooky.com is a separate hosted service. Official BookLooky certification is not issued by running this MIT code yourself.

The software license is MIT. Documentation is CC BY 4.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Technologies

Node.js 18 or newer, TypeScript, and the xAI Grok API (`GROK_API_KEY`). No npm runtime dependencies. CI tests Node 18, 20, and 22.

## Statistics

| Date of first git tag | Date of first GitHub Release | Number of GitHub Releases |
|---|---|---|
| v0.2.0 on 15 September 2026 (tag only; no GitHub Release was published for it) | v0.2.1 on 5 October 2026 | 1 |

| Commits on `main` through v0.2.1 | Contributors with commits | Commit pattern |
|---|---|---|
| 14 | 1 (GitHub user TheWootini, user id 168128785; git author names BookLooky and TheOfferHaus are that same account) | A handful of commits from 2 July 2026 through 28 September 2026, then the 5 October 2026 release commit. Not daily or weekly. |

| GitHub issues ever opened | Pull requests ever opened | Discussion threads | Stars | Forks |
|---|---|---|---|---|
| 0 | 0 | 1 (the 18 July 2026 welcome post, 0 comments) | 2 | 1 (`btopro/booklooky-official-lrs-rater`) |

**Number of sites in use:** not estimated. This repo does not phone home, and no install count is collected here. BookLooky.com is a separate service.

## Context

One person maintains the repository. The welcome discussion said a check-in would happen at the end of July 2026. No later discussion thread existed on 5 October 2026.

## 2026 highlights

- 2 July 2026: repository created and the transcript rater published.
- 15 September 2026: tag v0.2.0 (Grok model, age bands, CI). No GitHub Release.
- 28 September 2026: MIT/CC BY notices, SPDX headers, third-party notices, CLA text, support and decision records.
- 5 October 2026: root `LICENSE` and `NOTICE`, trademark knockout search, conflict-resolution policy, Ethical OS review of the public ethicalos.org page, Apereo alignment note, this health record, and the first GitHub Release.

## Future plans

No roadmap. The maintainer has not set a list of future features. Near-term work that is already decided is only what [CHANGELOG.md](CHANGELOG.md) and [DECISIONS.md](DECISIONS.md) already record.

## Repositories and downloads

- Source: https://github.com/TheWootini/booklooky-official-lrs-rater
- Release: https://github.com/TheWootini/booklooky-official-lrs-rater/releases/tag/v0.2.1
- The package is not published to the npm registry by this release. Install from the git tag.

## Commercial support

Left blank for Apereo’s commercial-affiliate list, which this project is not on. Paid official full-text scans and library bulk processing are BookLooky.com services, not an Apereo support offering and not something this repository sells.
