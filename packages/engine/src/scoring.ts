import type { AuditPage, AuditReport, Finding, GatePolicy, GateResult, PageScores, Pillar, Scores, VerificationDelta } from "./types.js";
import { stableSignature } from "./findings.js";

const weights: Record<Pillar, number> = {
  accessibility: 0.35,
  rtl: 0.25,
  locale: 0.2,
  resilience: 0.2
};

const penalties = { critical: 20, serious: 12, moderate: 7, minor: 3 } as const;

function overall(scores: Omit<Scores, "overall">): number {
  return Math.round(
    scores.accessibility * weights.accessibility +
    scores.rtl * weights.rtl +
    scores.locale * weights.locale +
    scores.resilience * weights.resilience
  );
}

export function calculateScores(findings: Finding[]): Scores {
  const deterministic = findings.filter((item) => item.confidence === "deterministic");
  const pillarScore = (pillar: Pillar) => {
    const deduction = deterministic
      .filter((item) => item.pillar === pillar)
      .reduce((sum, item) => sum + penalties[item.severity], 0);
    return Math.max(0, 100 - deduction);
  };
  const scores = {
    accessibility: pillarScore("accessibility"),
    rtl: pillarScore("rtl"),
    locale: pillarScore("locale"),
    resilience: pillarScore("resilience")
  };
  return { overall: overall(scores), ...scores };
}

export function calculatePageScores(findings: Finding[], pages: AuditPage[]): { scores: Scores; pageScores: PageScores[] } {
  const pageScores = pages.map((page) => ({
    pageId: page.id,
    pageUrl: page.url,
    scores: calculateScores(findings.filter((item) => item.pageId === page.id))
  }));
  const average = (pillar: keyof Omit<Scores, "overall">) => Math.round(pageScores.reduce((sum, page) => sum + page.scores[pillar], 0) / pageScores.length);
  const scoresWithoutOverall = {
    accessibility: average("accessibility"),
    rtl: average("rtl"),
    locale: average("locale"),
    resilience: average("resilience")
  };
  return { scores: { overall: overall(scoresWithoutOverall), ...scoresWithoutOverall }, pageScores };
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
    scoreChange: currentOverall - baseline.scores.overall,
    visualComparisons: [],
    gate: { policy: "off", status: "not-run", reasons: [] }
  };
}

export function evaluateGate(verification: VerificationDelta, policy: GatePolicy): GateResult {
  if (policy === "off") return { policy, status: "not-run", reasons: [] };
  const reasons: string[] = [];
  if (verification.scoreChange < 0) reasons.push(`Overall score decreased by ${Math.abs(verification.scoreChange)} point(s).`);
  const severe = verification.introduced.filter((item) => item.severity === "critical" || item.severity === "serious");
  if (severe.length) reasons.push(`${severe.length} new serious or critical deterministic finding(s) were introduced.`);
  return { policy, status: reasons.length ? "failed" : "passed", reasons };
}
