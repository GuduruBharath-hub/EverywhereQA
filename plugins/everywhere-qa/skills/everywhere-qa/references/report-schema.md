# Global Passport schema

`report.json` uses schema version `1.1`. Schema `1.0` baselines are normalized as one-page reports when the built-in profiles are used.

## Trusted fields

- `runId`, `generatedAt`, `target`, and `tools`: run provenance. `target.pages` lists explicit page IDs and URLs; `target.profileSignature` identifies the executed profile matrix.
- `scenarios[]`: scenario kind, page ID and URL, locale, viewport, duration, screenshot, and status.
- `findings[]`: deterministic page-aware evidence used for scoring and repair.
- `advisories[]`: heuristic source hints; never treat these as confirmed failures.
- `scores`: overall plus accessibility, RTL/text expansion, locale, and resilience scores.
- `pageScores[]`: the same scores for each explicit route. Overall pillar scores average the page scores.
- `verification`: baseline ID, fixed, remaining, introduced, score change, matched visual comparisons, and regression-gate result.

## Finding fields

Each finding has a stable ID, rule ID, pillar, severity, scenario, optional page ID and URL, selector, message, evidence, confidence, and remediation. Compare runs using page ID, rule ID, scenario, and selector rather than prose.

## Verification policy

Verification is valid only when routes and profile signatures match. `--gate regression` fails after writing the report when the overall score decreases or a newly introduced serious/critical deterministic finding appears. Exit code `2` means the gate failed; exit code `1` means the audit itself failed.

## Score policy

Each page and pillar begins at 100. Deterministic findings deduct 20/12/7/3 points for critical/serious/moderate/minor severity. Heuristic advisories do not affect scores. Multi-page pillar scores average the per-page pillar scores. Overall weighting is accessibility 35%, RTL/text expansion 25%, locale 20%, and resilience 20%.

Scores summarize the executed automation only; they are not compliance grades.
