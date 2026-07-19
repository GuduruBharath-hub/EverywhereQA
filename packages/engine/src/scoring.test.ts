import { describe, expect, it } from "vitest";
import { calculatePageScores, calculateScores, compareReports, evaluateGate } from "./scoring.js";
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

  it("averages page scores instead of multiplying a route penalty", () => {
    const firstPage = { ...sample, pageId: "home", pageUrl: "https://example.com/" };
    const result = calculatePageScores([firstPage], [{ id: "home", url: "https://example.com/" }, { id: "about", url: "https://example.com/about" }]);
    expect(result.pageScores.map((page) => page.scores.overall)).toEqual([96, 100]);
    expect(result.scores.overall).toBe(98);
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

  it("keeps the same selector on different pages distinct", () => {
    expect(dedupeFindings([{ ...sample, id: "one", pageId: "home" }, { ...sample, id: "two", pageId: "checkout" }])).toHaveLength(2);
  });

  it("fails the regression gate only for score drops or introduced serious findings", () => {
    const delta = compareReports({ runId: "before", findings: [], scores: { overall: 100 } } as AuditReport, [{ ...sample, pageId: "target" }], 96);
    const gate = evaluateGate(delta, "regression");
    expect(gate.status).toBe("failed");
    expect(gate.reasons).toHaveLength(2);
    expect(evaluateGate({ ...delta, introduced: [], scoreChange: 4 }, "regression").status).toBe("passed");
  });
});
