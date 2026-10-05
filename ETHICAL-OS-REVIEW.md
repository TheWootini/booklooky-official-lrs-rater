<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Ethical OS review

**Reviewed:** 5 October 2026  
**Reviewer:** recorded for the project by the maintainer’s request, from the public page at [https://ethicalos.org/](https://ethicalos.org/) as fetched that day  
**Scope:** this repository, the official transcript rater. Not BookLooky.com’s private quick-scan, accounts, or billing.

## What was actually read

On 5 October 2026, `https://ethicalos.org/` is the Institute for the Future page **“A Playbook for Ethical Technology Governance”** (Tingari-Silverton Foundation). The page says the playbook is for people in government and other governing roles. It names the civil-service values of integrity, honesty, objectivity, loyalty, and stewardship. It structures decisions around:

- **5 risk zones:** Law Enforcement, Public Health, Equity and Inclusion, Artificial Intelligence, and Climate
- **2 scenarios per zone**, each with a decision tree and 3–5 questions

The scenario worksheets are behind a form on that site (“share a little information about yourself first”). Those worksheets were not retrieved, so this review does not answer scenario questions that were not on the public page.

The older Ethical OS toolkit PDF was requested at `https://ethicalos.org/wp-content/uploads/2018/08/EthicalOS_Toolkit-2.pdf`. The server returned **404**. This review does not reconstruct that 2018 booklet from memory.

This project is not a government agency. The notes below apply the five published risk zones to the rater anyway, because that is the material the linked site now presents.

## Law enforcement

The rater does not identify readers, report them, or connect to a law-enforcement system. It scores a transcript the operator already has.

The scores can still be used by someone else as a reason to remove a book from a shelf. The README states that BookLooky is not a government or movie-style rating authority, and that output from a self-run copy is not an official BookLooky rating. The tool does not distinguish “describe this text” from “this text should be removed.” That distinction has to stay in the documentation and in how operators use the numbers. The code does not enforce it.

## Public health

Mental health is one of the six Content Intensity categories. The score is about how the topic appears in the book. It is not a clinical assessment of a reader and not a statement that a book about mental illness is unsafe. Nothing in this repository is a health service. Publishing a 0–5 mental-health number next to a title can still be read as a warning. The spec’s job is to keep the label tied to depiction, not to diagnosis.

## Equity and inclusion

LGBTQ+ representation and disability and neurodiversity are Story Theme scores. In [docs/LRS-SPEC.md](docs/LRS-SPEC.md) those scores measure how central a theme is, not whether the theme is a warning. A 0–5 number can still be sorted, filtered, and used to exclude books. The rater does not stop that use.

The CLI, prompts, and JSON reports are English-only, as the README says. Non-English books are outside what this version can rate fairly.

[CONTRIBUTING.md](CONTRIBUTING.md) does not accept pull requests that change core scoring. One maintainer controls those rules. That is a concentration of judgment, not a broad community check on whether a category is being used as a warning.

## Artificial intelligence

Rating is done by calling xAI’s Grok API (`GROK_API_KEY`). The operator’s transcript, which may be an entire copyrighted book, is sent to that service. This repository does not host the model and does not spell out xAI’s retention terms.

The code requires quoted evidence for a non-zero category score and downgrades a non-zero score with no validated excerpt to 0. That limits invented citations. It does not make the model’s judgment neutral, and a confidence field can look more certain than the underlying call.

Age bands are 1+, 4+, 8+, 13+, and 18+. They are this system’s bands. They are not a government rating.

## Climate

This repository has no climate feature. Each scan makes remote model calls. No energy or emissions figure is measured here, and none is claimed.

## Values on the playbook page

| Value named on the page | What this repo currently does |
|---|---|
| Integrity | README says a self-run scan is not an official BookLooky rating or badge. |
| Honesty | [TRADEMARK-SEARCH.md](TRADEMARK-SEARCH.md) records a federal knockout search instead of calling the names registered trademarks. |
| Objectivity | The spec defines scores as intensity or theme prominence. Operators can still treat them as verdicts. |
| Loyalty and stewardship | One maintainer. [CONFLICT-RESOLUTION.md](CONFLICT-RESOLUTION.md) says that person does not mediate a dispute in which they are a party. There is no second steward yet. |

## Not claimed

This file is not a completed IFTF workshop, not legal advice, and not a statement that the rater is free of the risks above.
