# Decisions

Significant technical, licensing, and product-boundary decisions for this
repository. The goal is to record **why**, not only what changed in git.

Record new entries when a choice would surprise a future maintainer or an
institution evaluating the project. Lightweight is fine: date, decision,
reason, alternatives considered.

This project is **not an Apereo project** and does not claim Apereo membership.
HEOSAT was used as an onboarding assessment.

## 2026-09 — MIT for software, CC BY 4.0 for documentation

**Decision:** Source code is MIT. Documentation, manuals, guides, and other
textual educational materials are CC BY 4.0.

**Why:** MIT remains the OSI-approved software license. Splitting documentation
to CC BY 4.0 follows Aperio/HEOSAT guidance so forks and institutions can reuse
guides under a license that is conventional for educational text.

**Not chosen:** Keeping documentation under MIT (also legally possible, because
MIT covers “associated documentation files”).

## 2026-09 — Contributor License Agreement

**Decision:** External pull requests require a signed CLA (CLA Assistant on
GitHub). Code contributions are MIT; documentation contributions are CC BY 4.0.

**Why:** Clear copyright/patent grant to BookLooky while keeping the public
licenses OSI/CC. The CLA does not grant rights in BookLooky brand names.

## 2026-09 — Official rater vs proprietary quick-scan

**Decision:** This repository implements the official **full-transcript** rater
only. The metadata-based quick-scan on booklooky.com search is a separate,
private system. Self-run output from this tool is not an official BookLooky
rating.

**Why:** Official certification has operational controls (identity, billing,
review) that do not belong in a public MIT library.

## 2026-09 — Brand names until USPTO filing

**Decision:** “BookLooky,” “Looky Rating System,” “LRS,” and the Certified LRS
Badge are **brand names** of BookLooky. They are not licensed under MIT. They
are **not currently registered trademarks**. USPTO filing is planned after
Apereo onboarding. Until then, do not describe them as registered trademarks.

**Why:** Aperio noted the USPTO search did not list BookLooky. Overclaiming
registration would undermine licensing clarity.

## 2026-09 — GitHub Releases start at v0.2.1

**Decision:** Do not backfill a GitHub Release for v0.2.0. The next published
GitHub Release will be **v0.2.1** after this HEOSAT hygiene work lands.

**Why:** The documented release process had not yet been executed on GitHub
Releases. Starting cleanly at v0.2.1 avoids a retroactive empty-tag story.

## Follow-up (not done in this repo)

**booklooky.com** should name the **MIT** license wherever it currently says
only “open-source” (especially How it works and For authors), with a link to
this GitHub repository. That copy lives in the product site, not here.
