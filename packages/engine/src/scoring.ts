import type { AuditReport, Finding, Pillar, Scores, VerificationDelta } from "./types.js";
import { stableSignature } from "./findings.js";

const weights: Record<Pillar, number> = {
  accessibility: 0.35,
  rtl: 0.25,
  locale: 0.2,
  resilience: 0.2
};

const penalties = { critical: 20, serious: 12, moderate: 7, minor: 3 } as const;

export function calculateScores(findings: Finding[]): Scores {
  const deterministic = findings.filter((item) => item.confidence === "deterministic");
  const pillarScore = (pillar: Pillar) => {
    const deduction = deterministic
      .filter((item) => item.pillar === pillar)
      .reduce((sum, item) => sum + penalties[item.severity], 0);
    return Math.max(0, 100 - deduction);
  };

  const accessibility = pillarScore("accessibility");
  const rtl = pillarScore("rtl");
  const locale = pillarScore("locale");
  const resilience = pillarScore("resilience");
  const overall = Math.round(
    accessibility * weights.accessibility +
      rtl * weights.rtl +
      locale * weights.locale +
      resilience * weights.resilience
  );
  return { overall, accessibility, rtl, locale, resilience };
}

export function compareReports(baseline: AuditReport, currentFindings: Finding[], currentOverall: number): VerificationDelta {
  const before = new Map(baseline.findings.map((item) => [stableSignature(item), item]));
  const after = new Map(currentFindings.map((item) => [stableSignature(item), item]));
  const fixed = [...before].filter(([key]) => !after.has(key)).map(([, item]) => item);
  const remaining = [...after].filter(([key]) => before.has(key)).map(([, item]) => item);
  const introduced = [...after].filter(([key]) => !before.has(key)).map(([, item]) => item);
  return {
    baselineRunId: baseline.runId,
    fixed,
    remaining,
    introduced,
    scoreChange: currentOverall - baseline.scores.overall
  };
}
