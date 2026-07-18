# Everywhere QA

> Fix once. Work everywhere.

Everywhere QA is a local-first Codex plugin that tests a web app across four global user conditions, gives GPT‑5.6 a deterministic evidence ledger, repairs the React/Next.js source, and reruns the exact same checks to prove the result.

It is an OpenAI Build Week Developer Tools entry. The core loop is:

**Test real contexts → show evidence → patch source → verify improvement**

## What it tests

| Scenario | Runtime context | Evidence |
| --- | --- | --- |
| Access | Desktop, reduced motion, keyboard traversal | axe-core rules, focus reachability, screenshot |
| Arabic RTL | `ar-SA`, Riyadh timezone, 390×844 viewport | Direction metadata, overflow, clipped controls |
| Text expansion | Mobile, pseudo-localized copy expanded by 40% | Newly introduced overflow and clipping |
| Constrained India mobile | `hi-IN`, Kolkata timezone, throttled 3G | Load time, request failures, console errors, language metadata |

The engine labels source-code pattern matches as **heuristic advisories**. Advisories never affect the score and are never presented as proven failures.

## Target users

| User | Why Everywhere QA is useful |
| --- | --- |
| Frontend and full-stack developers | Find accessibility, responsive-layout, locale, and slow-network problems before a release, with selectors and screenshots that lead back to the source. |
| React and Next.js teams | Use Codex to turn deterministic findings into scoped TypeScript and CSS repairs, then verify those repairs with the same browser scenarios. |
| QA and accessibility engineers | Add repeatable global-condition checks to exploratory testing without presenting automation as certification or complete human review. |
| Localization and internationalization teams | Stress layouts with Arabic RTL and 40% text expansion before translated content reaches production. |
| Startups, agencies, and solo builders | Run one local workflow instead of assembling separate accessibility, RTL, localization, and network-testing tools. No OpenAI API key is required for the audit engine. |
| Open-source maintainers | Give contributors a reproducible Global Passport and objective before/after evidence for user-facing fixes. |

## Use cases

### Pre-release global readiness check

Audit a staging or local URL before shipping. Everywhere QA runs all four contexts, records screenshots, and produces a prioritized report that a developer or QA reviewer can inspect.

### Evidence-backed repair with Codex

Ask Codex to audit and fix a React or Next.js TypeScript application. Codex uses the deterministic report to locate source, applies a small set of high-impact repairs, runs the repository's existing checks, and verifies the result against the baseline.

### RTL and text-expansion regression testing

Catch fixed-width cards, off-screen controls, physical left/right CSS, and clipped labels that often appear only after switching direction or expanding translated copy.

### Accessibility triage

Combine axe-core findings with keyboard traversal and screenshots so teams can prioritize missing labels, contrast failures, semantic problems, and keyboard barriers. Human accessibility review is still required.

### Locale-formatting review

Identify missing language metadata and source patterns that may hard-code dates, currency, or one locale's assumptions. Heuristic matches remain advisories until a person or Codex confirms them in context.

### Constrained-network resilience check

Exercise the page under a throttled Indian mobile profile to surface slow loading, failed requests, console errors, and UI that depends on optional resources.

### Before-and-after release evidence

Compare a new run with a saved baseline to show fixed, remaining, and newly introduced findings plus the score change. The standalone HTML Global Passport can be shared with engineering, product, or QA stakeholders.

## Quick start

Requirements: Node.js 20+, npm, and Chromium.

```powershell
npm install
npx playwright install chromium
npm run build
npm run start -w @everywhere-qa/demo -- --hostname 127.0.0.1 --port 3001
```

Use the optimized production server for scored audits. `npm run dev` is useful while editing the companion site, but its development bundles and hot-reload traffic make slow-network scores non-reproducible.

In a second terminal:

```powershell
node packages/engine/dist/cli.js audit `
  --url http://127.0.0.1:3001/lab-broken `
  --repo apps/demo `
  --out artifacts/baseline
```

Open `artifacts/baseline/report.html` to inspect the Global Passport.

Verify a repair with the same scenarios:

```powershell
node packages/engine/dist/cli.js verify `
  --baseline artifacts/baseline/report.json `
  --url http://127.0.0.1:3001/lab `
  --repo apps/demo `
  --out artifacts/verified
```

On POSIX shells, replace PowerShell backticks with `\` line continuations.

## Install the Codex plugin

This repository includes a local marketplace at `.agents/plugins/marketplace.json`.

```powershell
codex plugin marketplace add C:\path\to\everywhere-qa
codex plugin add everywhere-qa@personal
```

Start the target app, open a fresh Codex thread, select GPT‑5.6, and prompt. For the bundled production fixture, use:

```text
Audit and fix this app for users everywhere: http://127.0.0.1:3001/lab-broken
```

The skill distinguishes read-only audit requests from explicit repair authorization. Audit-only requests never edit target source.

## CLI

```text
everywhere audit --url <url> [--repo <path>] [--out <directory>] [--timeout <ms>]
everywhere verify --baseline <report.json> --url <url> [--repo <path>] [--out <directory>] [--timeout <ms>]
```

`report.json` contains provenance, scenarios, deterministic findings, heuristic advisories, pillar scores, and optional verification delta. `report.html` is standalone and shareable.

## Scoring

Each pillar begins at 100. Deterministic findings deduct 20, 12, 7, or 3 points for critical, serious, moderate, or minor severity. The overall score weights accessibility 35%, RTL/text expansion 25%, locale 20%, and resilience 20%. Scores summarize only the executed automation.

## Architecture

- `packages/engine` — TypeScript CLI, Playwright scenarios, axe integration, scoring, comparison, JSON and HTML reports.
- `plugins/everywhere-qa` — installable Codex plugin, guarded audit/fix workflow, report schema, repair policy, and assets.
- `apps/demo` — Next.js companion site, interactive sample passport, intentionally broken `/lab-broken` fixture, and repaired `/lab` fixture.

The audit engine is deterministic and uses no model or API. GPT‑5.6 runs through Codex, reads the evidence and repository, selects scoped repairs, executes tests, and invokes verification. No application source or report data is uploaded by the engine.

## Development and tests

```powershell
npm test
npm run typecheck
npm run build
```

The unit suite covers scoring weights, heuristic isolation, stable comparison, deduplication, pseudo-localization, report serialization, and malformed baselines. `/lab-broken` provides known integration failures; `/lab` shows the verified repaired state.

With a production demo server running on port 3001, run `npm run test:integration` to assert known rule IDs, screenshot artifacts, a meaningful score increase, zero introduced regressions, and an unchanged source digest during audit mode. See the [verified 66 to 100 result](docs/RESULTS.md).

## How Codex and GPT‑5.6 are used

The browser engine creates the evidence; the model does not manufacture findings. GPT‑5.6 in Codex reads the structured report and screenshots, traces high-impact findings to React or Next.js source, applies scoped repairs, runs the project's existing checks, and invokes Everywhere QA again for verification. This keeps measurement deterministic while using repository-aware reasoning where it is most valuable.

## Limitations

- Chromium only in the MVP.
- Audit mode works on any reachable HTTP(S) page; source-aware repair is supported only for React/Next.js TypeScript.
- Automated checks cannot establish complete accessibility, cultural, or translation quality.
- Everywhere QA is not a WCAG certification, legal opinion, or compliance guarantee. Human review remains required.

## License

MIT. See [third-party notices](THIRD_PARTY_NOTICES.md).
