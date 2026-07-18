import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readReport, writeReport } from "./report.js";
import type { AuditReport } from "./types.js";

const report: AuditReport = {
  schemaVersion: "1.0", runId: "test-run", target: { url: "https://example.com" }, generatedAt: "2026-07-19T00:00:00.000Z",
  tools: { everywhereQa: "0.1.0", playwright: "1", axeCore: "4" },
  scenarios: [{ id: "access", label: "Keyboard", locale: "en-US", viewport: { width: 100, height: 100 }, durationMs: 20, screenshot: "screenshots/access.png", status: "passed" }],
  findings: [],
  advisories: [{ id: "advice", ruleId: "source-locale-literal", pillar: "locale", severity: "minor", scenario: "source-review", selector: "page.tsx", message: "Review a literal.", evidence: "page.tsx", confidence: "heuristic", remediation: "Use Intl." }],
  scores: { overall: 100, accessibility: 100, rtl: 100, locale: 100, resilience: 100 }, summary: { deterministic: 0, advisory: 0, critical: 0 },
  disclaimer: "Not certification."
};

describe("report serialization", () => {
  it("writes readable JSON and standalone HTML", async () => {
    const directory = await mkdtemp(join(tmpdir(), "everywhere-report-"));
    const paths = await writeReport(report, directory);
    expect((await readReport(paths.jsonPath)).runId).toBe("test-run");
    const html = await readFile(paths.htmlPath, "utf8");
    expect(html).toContain("Global Passport");
    expect(html).toContain("screenshots/access.png");
    expect(html).toContain("does not affect score");
  });

  it("rejects malformed baselines", async () => {
    const directory = await mkdtemp(join(tmpdir(), "everywhere-report-"));
    const path = join(directory, "bad.json");
    await import("node:fs/promises").then(({ writeFile }) => writeFile(path, "{}"));
    await expect(readReport(path)).rejects.toThrow("malformed");
  });
});
