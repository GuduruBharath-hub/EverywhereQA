# Repair policy

## Priorities

1. Fix serious and critical deterministic findings first.
2. Prefer one accessibility, one RTL/text expansion, and one resilience or locale repair when impact is comparable.
3. Prefer native HTML, CSS logical properties, fluid sizing, `Intl` formatters, and graceful loading states.
4. Avoid dependency additions when a platform primitive solves the issue.

## Safety

- Inspect git status before editing and preserve unrelated work.
- Keep audit artifacts outside application source directories.
- Do not weaken tests, suppress axe rules, hide overflow globally, remove content, or add `aria-label` when a visible semantic label is more appropriate.
- Do not make the fixture pass by special-casing the audit scenarios.
- Run existing typecheck and tests before verification.

## Verification

A repair is verified only when the same page-aware stable signature is absent from the verification report and no new serious or critical finding is introduced. Routes and profiles must match the baseline. If the regression gate fails or a matched screenshot looks worse despite a score increase, report the conflict and stop rather than claiming success.
