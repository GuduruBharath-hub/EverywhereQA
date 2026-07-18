# Verified fixture result

The production-mode reference run on July 19, 2026 exercised all four browser contexts against the deliberately broken and repaired fixtures.

| Result | Broken `/lab-broken` | Repaired `/lab` |
| --- | ---: | ---: |
| Overall | 66 | 100 |
| Accessibility | 48 | 100 |
| RTL and text expansion | 43 | 100 |
| Locale | 100 | 100 |
| Resilience | 93 | 100 |
| Deterministic findings | 12 | 0 |
| Heuristic advisories | 2 | 2 |

Verification classified 12 findings as fixed, zero as remaining, and zero as newly introduced, for a +34 point change. The integration gate also hashes the sample repository before and after audit mode to prove that auditing is read-only.

Reproduce it after starting the production demo on port 3001:

```powershell
npm run build
npm run start -w @everywhere-qa/demo -- --hostname 127.0.0.1 --port 3001
```

Then, in another terminal:

```powershell
npm run test:integration
```

The generated reports and screenshots are written beneath `artifacts/integration/` and are intentionally git-ignored because reports can contain local repository paths and target-page data.
