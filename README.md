<p align="center">
  <img src="plugins/everywhere-qa/assets/logo.svg" width="112" alt="Everywhere QA globe and check logo">
</p>

# Everywhere QA

> Fix once. Work everywhere.

[Live demo](https://everywhere-qa-demo-2ifz.vercel.app/) · [Broken fixture](https://everywhere-qa-demo-2ifz.vercel.app/lab-broken) · [Repaired fixture](https://everywhere-qa-demo-2ifz.vercel.app/lab) · [Verified results](docs/RESULTS.md)

**OpenAI Build Week category:** Developer Tools

Everywhere QA is a local-first Codex plugin and public CLI that tests explicit web routes across global user conditions, gives GPT‑5.6 a deterministic evidence ledger, repairs React/Next.js source, and reruns the identical matrix to prove the result.

**Test real contexts → show evidence → patch source → verify improvement → gate regressions**

## What v0.2 tests

| Scenario | Default context | Deterministic evidence |
| --- | --- | --- |
| Access | Desktop, reduced motion, keyboard traversal | axe-core rules, focus reachability, screenshot |
| RTL | `ar-SA`, Riyadh timezone, 390×844 viewport | Direction metadata, overflow, clipped controls |
| Text expansion | Mobile, pseudo-localized copy expanded by 40% | Newly introduced overflow and clipping |
| Constrained mobile | `hi-IN`, Kolkata timezone, throttled 3G | Load time, request failures, console errors, language metadata |

Run those profiles on one URL with no config, or on up to ten explicit same-origin routes with locale, timezone, viewport, expansion, and network overrides. Everywhere QA never crawls a sitemap.

Source-code pattern matches are labeled **heuristic advisories**. They never affect the score and are never presented as proven failures.

## Target users

| User | Why Everywhere QA is useful |
| --- | --- |
| Frontend and full-stack developers | Find accessibility, responsive-layout, locale, and slow-network problems before release, with selectors and screenshots that lead back to source. |
| React and Next.js teams | Use Codex to turn deterministic findings into scoped TypeScript and CSS repairs, then verify them with the same routes and profiles. |
| QA and accessibility engineers | Add repeatable global-condition checks without presenting automation as certification or complete human review. |
| Localization teams | Stress layouts with configurable RTL locales and text expansion before translated content reaches production. |
| Startups, agencies, and solo builders | Replace several disconnected audit tools with one evidence-backed local workflow and no OpenAI API key. |
| Open-source maintainers | Share a portable Global Passport and fail a release when serious global regressions are introduced. |

## Main use cases

- Audit a local or staging release across accessibility, RTL, localization stress, and constrained networks.
- Let GPT‑5.6 in Codex repair high-impact React/Next.js TypeScript issues using deterministic browser evidence.
- Compare matched baseline/current screenshots and fixed, remaining, and introduced findings.
- Test a small, explicit route matrix without opening the scope to arbitrary crawling.
- Use `--gate regression` to fail verification when the score drops or a serious/critical deterministic issue is introduced.
- Share the generated JSON plus responsive HTML report with product, engineering, localization, and QA reviewers.

## Install the Codex plugin — judges and users

Requirements: a current Codex CLI/app with the `codex plugin` command, Node.js 20+, npm, Git access, and Chromium-capable Windows, macOS, or Linux.

No clone or local build is required:

```powershell
codex plugin marketplace add GuduruBharath-hub/EverywhereQA --ref v0.2.0
codex plugin add everywhere-qa@everywhere-qa
npx --yes everywhere-qa@0.2.0 setup
```

The first command installs the tagged Git marketplace. The second installs the plugin. The third explicitly downloads the matching Playwright Chromium browser; it is not hidden in a package lifecycle script.

For the complete ordered walkthrough, report outputs, exit codes, and troubleshooting, see [Installation and testing](docs/INSTALLATION.md).

Start a fresh Codex thread so the newly installed skill is loaded, select GPT‑5.6, open the target repository, start its app, and prompt:

```text
Audit and fix this app for users everywhere: http://localhost:3000
```

For an audit that must remain read-only:

```text
Audit this app for users everywhere without changing the repository: http://localhost:3000
```

The skill treats `audit`, `inspect`, `check`, `review`, and `report` as read-only. Source changes require explicit words such as `fix`, `repair`, `change`, `improve`, or `implement`.

## Test without rebuilding

Judges have three independent paths:

1. **Hosted product:** open the [broken fixture](https://everywhere-qa-demo-2ifz.vercel.app/lab-broken), use **View repaired**, and review the [verified result](docs/RESULTS.md).
2. **Installed Codex plugin:** use the three commands above, start a fresh GPT‑5.6 thread, and audit a local repository.
3. **Published CLI:** audit the hosted fixture directly:

```powershell
npx --yes everywhere-qa@0.2.0 audit `
  --url https://everywhere-qa-demo-2ifz.vercel.app/lab-broken `
  --out artifacts/judge-audit
```

Open `artifacts/judge-audit/report.html`. The audit engine does not require an OpenAI API key and does not upload source, screenshots, or report data.

## CLI

```text
everywhere setup
everywhere audit --url <url> [--config <file>] [--repo <path>] [--out <directory>] [--timeout <ms>]
everywhere verify --baseline <report.json> --url <url> [--config <file>] [--repo <path>] [--out <directory>] [--timeout <ms>] [--gate <off|regression>]
```

`--gate regression` writes the complete verification report and exits with code `2` when the overall score decreases or a new serious/critical deterministic finding is introduced. Exit code `1` means the audit itself failed.

### Multi-route configuration

Copy [everywhere.config.example.json](everywhere.config.example.json) or create a smaller file:

```json
{
  "routes": [
    { "id": "home", "path": "/" },
    { "id": "checkout", "path": "/checkout" }
  ],
  "profiles": {
    "rtl": { "locale": "he-IL", "timezoneId": "Asia/Jerusalem" },
    "textExpansion": { "ratio": 0.5 },
    "resilience": { "network": { "latencyMs": 500, "downloadKbps": 512, "uploadKbps": 256 } }
  }
}
```

Then use the identical URL and configuration for audit and verification:

```powershell
everywhere audit --url http://127.0.0.1:3000 --config everywhere.config.json --repo . --out artifacts/baseline
everywhere verify --baseline artifacts/baseline/report.json --url http://127.0.0.1:3000 --config everywhere.config.json --repo . --out artifacts/verified --gate regression
```

Route IDs must be unique lowercase identifiers. Paths must begin with one `/`, stay on the base URL’s origin, and total no more than ten. Verification rejects route or profile mismatches instead of presenting an invalid delta.

## Global Passport v2

Schema `1.1` records:

- Target URL, explicit pages, profile signature, timestamp, and tool versions.
- Page-aware deterministic findings and heuristic advisories.
- Per-page scores plus averaged accessibility, RTL/text expansion, locale, resilience, and overall scores.
- Fixed, remaining, and introduced findings plus score delta.
- Preserved baseline screenshots paired with the matching verified screenshots.
- Regression-gate policy, status, and reasons.

Schema `1.0` reports are normalized as single-page baselines when verification uses the original built-in profiles.

## Scoring

Each page and pillar begins at 100. Deterministic findings deduct 20, 12, 7, or 3 points for critical, serious, moderate, or minor severity. Multi-page pillar scores average the corresponding page scores. Overall weighting is accessibility 35%, RTL/text expansion 25%, locale 20%, and resilience 20%. Advisories never affect scores.

## Supported platforms

- **Validated host:** Windows with Node.js 20+ and npm.
- **Expected hosts:** macOS and Linux capable of running Node.js 20+, npm, and Playwright Chromium; clean-environment validation is recorded during the v0.2 release.
- **Browser:** Playwright Chromium only.
- **Audit targets:** Reachable HTTP(S) pages explicitly supplied by URL or same-origin route configuration.
- **Automatic repair targets:** React or Next.js TypeScript repositories.
- **Codex surface:** Codex CLI/app with GPT‑5.6 selected. The deterministic engine itself uses no model or OpenAI API.

## Architecture

- `packages/engine` — published TypeScript CLI, Playwright scenarios, configuration, scoring, comparison, gate, and JSON/HTML reports.
- `plugins/everywhere-qa` — installable Codex plugin, authorization-aware audit/fix workflow, report contract, repair policy, npm runner, and brand assets.
- `apps/demo` — Next.js companion site, interactive passport, intentionally broken `/lab-broken`, and repaired `/lab` fixture.

The engine creates the evidence; the model does not manufacture findings. GPT‑5.6 operates through Codex as the repository-aware repair layer.

## Contributor development

Clone only if you want to develop the engine, plugin, or companion site:

```powershell
git clone https://github.com/GuduruBharath-hub/EverywhereQA.git
cd EverywhereQA
npm install
npx playwright install chromium
npm test
npm run typecheck
npm run build
```

Start the optimized fixture server before integration testing:

```powershell
npm run start -w @everywhere-qa/demo -- --hostname 127.0.0.1 --port 3001
npm run test:integration
```

Use a disposable branch or fresh clone for repair demonstrations. The canonical `/lab-broken` route must remain intentionally broken; `/lab` is the permanent repaired reference.

## How Codex and GPT‑5.6 were used

Codex and GPT‑5.6 were used throughout the primary build thread to:

- Turn the brief into the TypeScript workspace, deterministic Playwright/axe engine, plugin, fixtures, report UI, tests, and Vercel deployment.
- Establish the read-only audit boundary and explicit repair authorization policy.
- Choose page-aware stable signatures, per-page score averaging, and profile signatures so multi-route verification stays comparable.
- Design schema `1.1` migration rather than invalidating existing `1.0` evidence.
- Preserve and pair baseline screenshots so repairs are visually inspectable, not only summarized by a score.
- Define a deterministic regression gate that writes evidence before returning a release-blocking status.
- Diagnose the v0.1 installation flaw: the cached plugin referenced an engine outside its archive. v0.2 replaces that path with a pinned public npm runtime.
- Iterate on the square globe-and-check brand across the Codex plugin, website, favicon, and README.
- Diagnose Windows certificate behavior, React hydration timing, network-measurement variance, and Vercel output configuration.

GPT‑5.6 is meaningfully integrated as the reasoning and repair layer: it reads deterministic findings and screenshots, traces them to React/CSS source, chooses scoped changes, runs the repository’s existing checks, and invokes identical verification. Measurement remains deterministic while model reasoning is used where repository context and engineering judgment matter.

## Limitations

- Chromium only; browser diversity remains future work.
- Multi-route audits accept explicit same-origin paths and intentionally do not crawl arbitrary sites.
- Source-aware repairs are supported only for React/Next.js TypeScript.
- Automated checks cannot establish complete accessibility, cultural, legal, or translation quality.
- Everywhere QA is not a WCAG certification, legal opinion, or compliance guarantee. Human review remains required.

## Team

Everywhere QA was built collaboratively for OpenAI Build Week by **Guduru Bharath** and **Ratan Kaushik**. The Git history preserves each contributor's work; the repository owner and collaborators may also keep GitHub forks on their profiles while linking back to this canonical project.

## License

MIT. See [third-party notices](THIRD_PARTY_NOTICES.md).
