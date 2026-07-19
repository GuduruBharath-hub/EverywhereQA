# Verified fixture result — Global Passport v2

The production-mode reference run on July 19, 2026 exercised schema `1.1` across the deliberately broken and repaired fixtures.

| Result | Broken `/lab-broken` | Repaired `/lab` |
| --- | ---: | ---: |
| Overall | 64 | 100 |
| Accessibility | 48 | 100 |
| RTL and text expansion | 36 | 100 |
| Locale | 100 | 100 |
| Resilience | 93 | 100 |
| Deterministic findings | 13 | 0 |
| Heuristic advisories | 2 | 2 |

Verification classified **13 findings as fixed**, zero as remaining, and zero as newly introduced, for a **+36 point change**. The `regression` gate passed.

The v0.2 integration suite also proves:

- Four baseline screenshots are preserved and paired with their matching verified screenshots.
- A two-route configuration executes eight browser scenarios and produces per-page scores.
- A deliberate regression writes its report and exits with code `2`.
- Audit and verification modes leave the target repository digest unchanged.

Reproduce it after starting the production demo on port 3001:

```powershell
npm run build
npm run start -w @everywhere-qa/demo -- --hostname 127.0.0.1 --port 3001
```

Then, in another terminal:

```powershell
npm run test:integration
```

Expected final line:

```text
Integration gate passed: 64 -> 100; 13 fixed; 8 multi-route scenarios; regression exit 2 verified.
```

Generated reports and screenshots are written beneath `artifacts/integration/` and are intentionally git-ignored because reports can contain local repository paths and target-page data.
