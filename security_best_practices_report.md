# Security Best Practices Report

**Project:** `@booklooky/official-lrs-rater` (`booklooky-official-lrs-rater`)  
**Date:** 2026-08-12  
**Skill:** [openai/skills/security-best-practices](https://www.skills.sh/openai/skills/security-best-practices)  
**Scope:** TypeScript / Node.js CLI library (official transcript LRS rater)

## Executive summary

This repository is a **Node.js 18+ TypeScript CLI/library** that reads a local book transcript, calls the xAI Grok API over HTTPS, and writes a JSON rating report. It is **not** a web app (no Express/Next/React surface in this package).

The OpenAI skill’s `references/` directory has **no Node.js CLI / general TypeScript backend** guide. Closest match is `javascript-express-web-server-security.md`, which only partially applies. This report therefore combines:

1. Applicable rules from that Express guidance (secrets, injection, filesystem, outbound HTTP, dependency hygiene)
2. Well-known Node/TypeScript security practices for CLI + LLM clients

**Overall risk:** Moderate for an LLM rating tool. There are **no Critical** remote RCE / hardcoded-secret findings. The main residual risks are **prompt injection via transcript content**, **unbounded API cost**, and **error/response handling** that could leak oversized or unexpected API error bodies. `npm audit` reports **0** vulnerabilities.

---

## Skill guidance coverage

| Language / stack | Skill reference used | Notes |
|---|---|---|
| TypeScript / Node CLI library | *None dedicated* | No `javascript-*-cli*` or `typescript-general-backend` file |
| Express web server | `javascript-express-web-server-security.md` | Partial: secrets, injection, filesystem, SSRF, deps |
| React / Next / Vue frontend | N/A | Not present in this repo |

---

## Critical

*No critical findings.*

---

## High

### Finding 1 — Prompt injection via untrusted transcript text in model prompts

**Impact:** A crafted transcript (or malicious title/author when used as a library) can attempt to override system instructions and skew ratings, age recommendations, or force verbose / expensive model behavior.

**Location:**

- `src/analyzer.ts` ~148 (`CHUNK TEXT:` embedding)
- `src/analyzer.ts` ~313 (`TRANSCRIPT EVIDENCE:` embedding)
- `src/analyzer.ts` ~523 (additional-examples prompt)
- `src/age-recommendation.ts` ~180–189 (`Title` / `Author` / `ISBN` / voice sample embedding)

**Evidence:** User-controlled book text and metadata are concatenated directly into prompts sent to Grok.

**Why it matters:** LLMs treat prompt text as instructions. This tool’s purpose requires sending the full book, so risk cannot be eliminated, but it can be reduced and documented.

**Fix / mitigation (recommended):**

1. Wrap untrusted content in clear delimiters and instruct the model that content inside delimiters is data only.
2. Keep post-conditions you already have (0–5 clamps, excerpt-required downgrades) — these already limit damage.
3. Document that callers must treat transcripts as untrusted input when exposing this library over a network.
4. Optionally cap transcript length / chunk count to bound cost and injection surface.

**False-positive notes:** Expected risk class for any full-text LLM rater. Not a classic OWASP injection into a SQL/shell sink.

---

## Medium

### Finding 2 — API error responses appended into thrown Error messages

**Status:** Fixed (2026-08-12) — `summarizeGrokErrorBody()` now prefers a short JSON `message`/`code` and truncates to 400 characters in `src/grok-client.ts`.

**Impact:** Upstream error bodies may contain internal details; large bodies can also flood logs/stderr when the CLI prints `err.message`.

**Location:** `src/grok-client.ts` (error path after `!res.ok`)

**Fix applied:** Truncate body and extract a compact message instead of appending the raw upstream payload.

### Finding 3 — Unbounded / weakly bounded model JSON parsing

**Status:** Fixed (2026-08-12) — `extractJsonObjectText()` / `parseGrokJsonContent()` in `src/grok-client.ts` enforce a 200k-char content cap, strip markdown fences, prefer direct `JSON.parse`, and fall back to brace-balanced extraction of the first object (no greedy `/\{[\s\S]*\}/` regex).

**Impact:** Malformed or huge model responses can cause `JSON.parse` failures, unexpected memory use, or acceptance of oddly shaped objects before field sanitization.

**Location:** `src/grok-client.ts` (model content parse path)

**Mitigation already present:** Downstream code clamps ratings, stringifies fields, and filters excerpts — good.

### Finding 4 — No transcript size / cost guardrails

**Impact:** A multi-million-character transcript triggers one API call per ~100k-character segment plus 11 follow-up calls, which can create large unexpected xAI spend.

**Location:** `src/analyzer.ts` `rateTranscript` / `runOfficialScanChunkScanPass`; README documents cost but code does not enforce a max.

**Fix:** Add configurable `maxTranscriptChars` / `maxChunks` with a clear error; default to a sane ceiling for the CLI.

### Finding 5 — CLI reads/writes arbitrary paths supplied by the operator

**Impact:** If this CLI is ever wrapped by an untrusted web/API layer that forwards user paths, path traversal / overwrite is possible. As a local operator tool, this is normal Unix CLI behavior.

**Location:** `src/cli/lrs-scan.ts` lines 70, 105 (`readFileSync` / `writeFileSync`)

**Fix (if reused behind a service):** Resolve paths under an allowlisted directory; reject `..`; never pass raw user paths. For pure local CLI, document the trust model instead of over-restricting.

---

## Low

### Finding 6 — `pull_request_target` CLA workflow with write permissions

**Impact:** Misconfiguration or a compromised action could write to the default branch. Risk is reduced by pinning `contributor-assistant/github-action` to a full commit SHA.

**Location:** `.github/workflows/cla.yml`

**Fix:** Keep the pin; limit `CLA_ACCESS_TOKEN` scope; ensure signatures branch policy is understood; periodically review the upstream action.

### Finding 7 — Devcontainer forwards host `GROK_API_KEY`

**Impact:** Expected for local/dev; ensure keys are never committed and containers are not shared/published with env baked in.

**Location:** `.devcontainer/devcontainer.json` `remoteEnv`

**Status:** Acceptable. `.gitignore` already ignores `.env*`.

### Finding 8 — Model id taken from environment without allowlist

**Impact:** Local/env compromise could point `GROK_MODEL_REASONING` at an unexpected model string. Low for a trusted-operator CLI.

**Location:** `src/grok-client.ts` line 9

**Fix:** Optional allowlist of known model ids.

---

## Informational / positive controls

| Control | Status |
|---|---|
| API key via env, not hardcoded | Pass (`GROK_API_KEY`) |
| Outbound HTTPS to fixed host `api.x.ai` (no user-controlled URL / SSRF) | Pass |
| No `eval` / `Function` / `child_process` | Pass |
| Rating outputs clamped 0–5; ages clamped | Pass |
| Non-zero ratings require excerpt evidence | Pass (integrity control) |
| `.env` ignored in git | Pass |
| `package-lock.json` present; `npm audit` clean | Pass (0 vulns) |
| Minimal dependency surface (typescript + @types/node only) | Pass |
| CLA action pinned to commit SHA | Pass |

---

## Suggested fix order

1. Finding 2 — truncate/sanitize Grok error bodies (small, safe)
2. Finding 3 — response size limit + stricter JSON parsing
3. Finding 4 — max transcript/chunk guards
4. Finding 1 — delimiter + docs for prompt-injection trust model
5. Finding 5 — only if this CLI will be driven by untrusted callers
6. Findings 6–8 — policy / optional hardening

---

*Generated with the openai `security-best-practices` skill workflow. No matching Node CLI reference file existed in the skill; Express guidance was applied only where relevant.*
