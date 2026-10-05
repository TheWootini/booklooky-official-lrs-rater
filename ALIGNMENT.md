<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Apereo alignment note

**Date:** 5 October 2026  
**Status:** considered, not adopted. This repository does not depend on other Apereo software, and it is not an Apereo project.

The question asked by the incubation exit criteria is whether this rater should use other Apereo software, or has a practical overlap with an Apereo project. The projects below were considered against what this repository actually is: a Node.js 18+ command-line tool and library that sends a plaintext transcript to the xAI API and returns LRS scores. `package.json` has no runtime dependencies.

| Project | Consideration | Adopted |
|---|---|---|
| Sakai | A learning-management system. This rater does not run inside Sakai, and Sakai is not required to score a transcript. A campus could link out to BookLooky.com. That link is not built here. | No |
| uPortal | A campus portal. Same as Sakai: no portlet, no shared library, no API client in this repo. | No |
| CAS (Central Authentication Service) | This CLI authenticates to xAI with `GROK_API_KEY` in the environment. It does not use CAS. | No |
| Opencast | Lecture capture and video. This rater reads plain text, not video. | No |
| Bedework | Calendaring. No scheduling or calendar function in this rater. | No |

No integration with those projects is planned in this repository. There is no product roadmap beyond the release notes in [CHANGELOG.md](CHANGELOG.md).
