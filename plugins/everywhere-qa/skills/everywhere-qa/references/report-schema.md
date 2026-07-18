# Global Passport schema

`report.json` uses schema version `1.0`.

## Trusted fields

- `runId`, `generatedAt`, `target`, and `tools`: run provenance.
- `scenarios[]`: scenario ID, locale, viewport, duration, screenshot, and status.
- `findings[]`: deterministic evidence used for scoring and repair.
- `advisories[]`: heuristic source hints; never treat these as confirmed failures.
- `scores`: overall plus accessibility, RTL/text expansion, locale, and resilience scores.
- `verification`: baseline ID, fixed, remaining, introduced, and score change.

## Finding fields

Each finding has a stable ID, rule ID, pillar, severity, scenario, selector, message, evidence, confidence, and remediation. Compare runs using rule ID, scenario, and selector rather than prose.

## Score policy

Pillar scores begin at 100. Deterministic findings deduct 20/12/7/3 points for critical/serious/moderate/minor severity. Heuristic advisories do not affect scores. Overall weighting is accessibility 35%, RTL/text expansion 25%, locale 20%, and resilience 20%.

Scores summarize the executed automation only; they are not compliance grades.
