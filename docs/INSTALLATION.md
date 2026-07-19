# Install and test Everywhere QA

This guide separates the three ways to evaluate Everywhere QA. Judges can use the hosted demo or public CLI without cloning the repository. Install the Codex plugin when you want the complete audit, repair, and verification workflow.

## Requirements

- Node.js 20 or newer and npm.
- A Windows, macOS, or Linux host capable of running Playwright Chromium.
- For plugin use: a current Codex CLI/app with the `codex plugin` command and GPT-5.6 selected.
- For automatic repairs: a React or Next.js TypeScript repository you are authorized to change.

## Option 1: inspect the hosted demo

No installation is required.

1. Open the [intentionally broken fixture](https://everywhere-qa-demo-2ifz.vercel.app/lab-broken).
2. Use **View repaired** to move to the repaired `/lab` route.
3. Review the recorded [64 to 100 verification result](RESULTS.md).

The hosted pages demonstrate the product story. Run the CLI or plugin to generate fresh browser evidence.

## Option 2: run the public CLI

### 1. Install the matching Chromium browser

```powershell
npx --yes everywhere-qa@0.2.0 setup
```

This is an explicit setup step. The npm package does not download a browser from a hidden install script.

### 2. Audit a URL

```powershell
npx --yes everywhere-qa@0.2.0 audit `
  --url https://everywhere-qa-demo-2ifz.vercel.app/lab-broken `
  --out artifacts/judge-audit
```

Open `artifacts/judge-audit/report.html` in a browser. The same directory contains `report.json` and scenario screenshots.

### 3. Audit multiple routes when needed

Copy [`everywhere.config.example.json`](../everywhere.config.example.json), keep only the same-origin routes you want, and run:

```powershell
npx --yes everywhere-qa@0.2.0 audit `
  --url http://127.0.0.1:3000 `
  --config everywhere.config.json `
  --repo . `
  --out artifacts/baseline
```

Everywhere QA accepts at most ten explicit routes. It does not crawl a sitemap or follow arbitrary production links.

### 4. Verify a repaired version and gate regressions

Keep the same base URL, route configuration, and scenario profiles used by the baseline:

```powershell
npx --yes everywhere-qa@0.2.0 verify `
  --baseline artifacts/baseline/report.json `
  --url http://127.0.0.1:3000 `
  --config everywhere.config.json `
  --repo . `
  --out artifacts/verified `
  --gate regression
```

The verification report includes fixed, remaining, and introduced findings, score delta, per-page scores, and matched before/after screenshots.

Exit codes:

- `0`: the command completed and the requested gate passed.
- `1`: setup, input validation, navigation, or audit execution failed.
- `2`: verification completed and wrote its report, but the regression gate detected a lower score or a new serious/critical deterministic finding.

## Option 3: install the Codex plugin

### 1. Install the tagged marketplace and plugin

```powershell
codex plugin marketplace add GuduruBharath-hub/EverywhereQA --ref v0.2.0
codex plugin add everywhere-qa@everywhere-qa
npx --yes everywhere-qa@0.2.0 setup
```

No repository clone or monorepo build is required. The plugin invokes the pinned public `everywhere-qa@0.2.0` runtime.

### 2. Start the target application

Use the target repository's normal development command, such as `npm run dev`, and confirm its URL loads before starting the audit.

### 3. Start a fresh Codex thread

Newly installed skills are discovered in a fresh thread. Select GPT-5.6, open the target repository as the workspace, and use one of these prompts.

Read-only audit:

```text
Audit this app for users everywhere without changing the repository: http://localhost:3000
```

Audit, repair, and verify:

```text
Audit and fix this app for users everywhere: http://localhost:3000
```

The plugin keeps audit-only language read-only. A source change requires explicit repair authorization such as `fix`, `repair`, `change`, `improve`, or `implement`.

### 4. Review the proof

Before accepting repairs:

1. Review the baseline HTML report and screenshots.
2. Review the source diff produced by Codex.
3. Confirm the repository's existing tests still pass.
4. Review the verified report's fixed, remaining, and introduced findings.
5. Confirm the regression gate passed when it was requested.

## What the plugin supports

- Auditing reachable HTTP(S) pages on Chromium.
- Accessibility and keyboard checks, RTL mobile layouts, 40% text expansion, Indian locale behavior, and constrained mobile networks.
- Up to ten configured same-origin routes.
- Automatic source repair for React and Next.js TypeScript projects.
- JSON and responsive HTML Global Passport reports stored locally.

It does not claim WCAG certification, legal compliance, translation quality, or complete human accessibility coverage.

## Troubleshooting

### Chromium is missing

Run `npx --yes everywhere-qa@0.2.0 setup` again. If a managed network blocks Playwright downloads, allow the official Playwright browser download endpoint or test on a network that permits it.

### The application is unreachable or times out

Open the exact URL in a browser, confirm the development server is still running, and retry with a larger `--timeout` value if the application legitimately needs more time.

### Verification rejects the baseline

Use the same route IDs, route paths, and scenario profile configuration for audit and verification. A mismatch is rejected intentionally because its score delta would be misleading.

### The plugin was installed but does not activate

Start a fresh Codex thread after installation and phrase the request as a global-readiness, accessibility, RTL, localization stress, or Global Passport audit.

### Audit-only mode changed files

That is a defect. Preserve the Git diff, stop the workflow, and open an issue in the [canonical repository](https://github.com/GuduruBharath-hub/EverywhereQA/issues). The supported audit path is designed not to modify the target repository.
