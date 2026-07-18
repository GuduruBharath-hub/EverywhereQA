import { describe, expect, it } from "vitest";
import { calculateScores, compareReports } from "./scoring.js";
import { dedupeFindings, finding } from "./findings.js";
import type { AuditReport } from "./types.js";

const sample = finding({ ruleId: "axe-label", pillar: "accessibility", severity: "serious", scenario: "desktop", selector: "#email", message: "Input has no label", evidence: "screen.png", remediation: "Add a label" });

describe("scoring", () => {
  it("uses the documented pillar weights", () => {
    expect(calculateScores([sample])).toEqual({ overall: 96, accessibility: 88, rtl: 100, locale: 100, resilience: 100 });
  });

  it("does not deduct heuristic advisories", () => {
    expect(calculateScores([{ ...sample, confidence: "heuristic" }]).overall).toBe(100);
  });
});

describe("report comparison", () => {
  it("classifies fixed, remaining, and introduced findings", () => {
    const baseline = { runId: "before", findings: [sample], scores: { overall: 96 } } as AuditReport;
    const introduced = finding({ ruleId: "overflow", pillar: "rtl", severity: "moderate", scenario: "rtl", selector: "html", message: "Overflow", evidence: "rtl.png", remediation: "Make it fluid" });
    const delta = compareReports(baseline, [introduced], 98);
    expect(delta.fixed).toHaveLength(1);
    expect(delta.introduced).toHaveLength(1);
    expect(delta.remaining).toHaveLength(0);
    expect(delta.scoreChange).toBe(2);
  });

  it("deduplicates stable finding ids", () => {
    expect(dedupeFindings([sample, sample])).toHaveLength(1);
  });
});
