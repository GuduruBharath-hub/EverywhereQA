import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readReport, writeReport } from "./report.js";
import type { AuditReport } from "./types.js";

const report: AuditReport = {
  schemaVersion: "1.1", runId: "test-run", target: { url: "https://example.com", pages: [{ id: "target", url: "https://example.com" }], profileSignature: "default" }, generatedAt: "2026-07-19T00:00:00.000Z",
  tools: { everywhereQa: "0.2.0", playwright: "1", axeCore: "4" },
  scenarios: [{ id: "target:accessibility", kind: "accessibility", label: "Keyboard", pageId: "target", pageUrl: "https://example.com", locale: "en-US", viewport: { width: 100, height: 100 }, durationMs: 20, screenshot: "screenshots/access.png", status: "passed" }],
  findings: [],
  advisories: [{ id: "advice", ruleId: "source-locale-literal", pillar: "locale", severity: "minor", scenario: "source-review", selector: "page.tsx", message: "Review a literal.", evidence: "page.tsx", confidence: "heuristic", remediation: "Use Intl." }],
  scores: { overall: 100, accessibility: 100, rtl: 100, locale: 100, resilience: 100 },
  pageScores: [{ pageId: "target", pageUrl: "https://example.com", scores: { overall: 100, accessibility: 100, rtl: 100, locale: 100, resilience: 100 } }],
  summary: { deterministic: 0, advisory: 1, critical: 0 },
  disclaimer: "Not certification."
};

describe("report serialization", () => {
  it("writes readable JSON and portable HTML", async () => {
    const directory = await mkdtemp(join(tmpdir(), "everywhere-report-"));
    const paths = await writeReport(report, directory);
    expect((await readReport(paths.jsonPath)).runId).toBe("test-run");
    const html = await readFile(paths.htmlPath, "utf8");
    expect(html).toContain("Global Passport");
    expect(html).toContain("screenshots/access.png");
    expect(html).toContain("does not affect score");
  });

  it("normalizes schema 1.0 baselines to one page", async () => {
    const directory = await mkdtemp(join(tmpdir(), "everywhere-report-"));
    const path = join(directory, "legacy.json");
    await writeFile(path, JSON.stringify({
      ...report,
      schemaVersion: "1.0",
      target: { url: "https://example.com" },
      scenarios: [{ id: "accessibility-desktop", label: "Keyboard", locale: "en-US", viewport: { width: 100, height: 100 }, durationMs: 20, screenshot: "screenshots/access.png", status: "passed" }],
      pageScores: undefined
    }));
    const normalized = await readReport(path);
    expect(normalized.schemaVersion).toBe("1.1");
    expect(normalized.target.pages).toEqual([{ id: "target", url: "https://example.com" }]);
    expect(normalized.scenarios[0]).toMatchObject({ id: "target:accessibility", pageId: "target", kind: "accessibility" });
  });

  it("rejects malformed baselines", async () => {
    const directory = await mkdtemp(join(tmpdir(), "everywhere-report-"));
    const path = join(directory, "bad.json");
    await writeFile(path, "{}");
    await expect(readReport(path)).rejects.toThrow("malformed");
  });
});
