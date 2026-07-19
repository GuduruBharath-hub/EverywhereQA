import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import type { AuditReport, Finding, ResolvedAuditConfig, ScenarioKind, ScenarioResult, VisualComparison } from "./types.js";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char] ?? char);
}

function findingCard(item: Finding, advisory = false): string {
  const label = advisory ? "advisory" : item.severity;
  const note = advisory ? " &middot; does not affect score" : "";
  const page = item.pageId ? `${escapeHtml(item.pageId)} &middot; ` : "";
  return `<article class="finding ${advisory ? "advisory" : item.severity}">
    <div><span class="pill">${label}</span><span>${escapeHtml(item.pillar)}</span></div>
    <h3>${escapeHtml(item.message)}</h3><code>${escapeHtml(item.selector)}</code>
    <p>${escapeHtml(item.remediation)}</p>
    <small>${page}${escapeHtml(item.scenario)} &middot; ${escapeHtml(item.ruleId)}${note}</small>
  </article>`;
}

function reportHtml(report: AuditReport): string {
  const json = JSON.stringify(report).replaceAll("<", "\\u003c");
  const cards = (Object.entries(report.scores) as [string, number][])
    .map(([name, score]) => `<div class="score"><span>${escapeHtml(name)}</span><strong>${score}</strong><i style="--score:${score}%"></i></div>`)
    .join("");
  const pageCards = report.pageScores.length > 1 ? `<section class="page-scores">${report.pageScores.map((page) => `<article><span>${escapeHtml(page.pageId)}</span><strong>${page.scores.overall}</strong><small>${escapeHtml(page.pageUrl)}</small></article>`).join("")}</section>` : "";
  const findings = report.findings.length
    ? report.findings.map((item) => findingCard(item)).join("")
    : `<div class="empty">No deterministic findings in the executed scenarios.</div>`;
  const advisories = report.advisories.length
    ? report.advisories.map((item) => findingCard(item, true)).join("")
    : `<div class="empty">No heuristic source advisories.</div>`;
  const scenarios = report.scenarios.map((scenario) => `<article class="scenario">
    <img src="${escapeHtml(scenario.screenshot)}" alt="Evidence screenshot for ${escapeHtml(scenario.label)} on ${escapeHtml(scenario.pageId)}">
    <div><span class="pill ${scenario.status === "passed" ? "pass" : ""}">${escapeHtml(scenario.status)}</span>
    <h3>${escapeHtml(scenario.label)}</h3>
    <p>${escapeHtml(scenario.pageId)} &middot; ${escapeHtml(scenario.locale)} &middot; ${scenario.viewport.width}&times;${scenario.viewport.height} &middot; ${(scenario.durationMs / 1000).toFixed(1)}s</p></div>
  </article>`).join("");
  const verification = report.verification;
  const delta = verification
    ? `<section class="delta"><div><strong>${verification.scoreChange >= 0 ? "+" : ""}${verification.scoreChange}</strong><span>score change</span></div><div><strong>${verification.fixed.length}</strong><span>fixed</span></div><div><strong>${verification.remaining.length}</strong><span>remaining</span></div><div><strong>${verification.introduced.length}</strong><span>introduced</span></div></section>`
    : "";
  const gate = verification && verification.gate.policy !== "off"
    ? `<section class="gate ${verification.gate.status}"><strong>Regression gate: ${escapeHtml(verification.gate.status)}</strong>${verification.gate.reasons.length ? `<ul>${verification.gate.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>` : `<p>No score drop or newly introduced serious/critical finding.</p>`}</section>`
    : "";
  const proof = verification?.visualComparisons.length
    ? `<h2>Proof of repair</h2><p class="section-copy">The same route and browser profile before and after the repair.</p><section class="proof">${verification.visualComparisons.map((item) => `<article><div class="proof-head"><strong>${escapeHtml(item.pageId)}</strong><span>${escapeHtml(item.label)}</span></div><div class="proof-pair"><figure><figcaption>Before</figcaption><img src="${escapeHtml(item.beforeScreenshot)}" alt="Before repair: ${escapeHtml(item.label)}"></figure><figure><figcaption>Verified</figcaption><img src="${escapeHtml(item.afterScreenshot)}" alt="After repair: ${escapeHtml(item.label)}"></figure></div></article>`).join("")}</section>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Everywhere QA Global Passport</title>
<style>
:root{color-scheme:dark;--ink:#f5f1e8;--muted:#aaa9a2;--panel:#181b1a;--line:#323735;--mint:#9ce6bd;--coral:#ff806d;--yellow:#f3cf70}*{box-sizing:border-box}body{margin:0;background:#0d0f0e;color:var(--ink);font:15px/1.55 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1120px,92vw);margin:auto;padding:56px 0 80px}header{display:flex;justify-content:space-between;gap:24px;align-items:end;border-bottom:1px solid var(--line);padding-bottom:28px}h1{font-size:clamp(38px,7vw,80px);line-height:.95;letter-spacing:-.06em;margin:8px 0}.eyebrow,.pill{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mint)}.tagline,.section-copy{color:var(--muted);max-width:60ch}.scores{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:28px 0}.score,.page-scores article{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;overflow:hidden}.score span,.page-scores span,.page-scores small{display:block;color:var(--muted)}.score strong,.page-scores strong{font-size:34px}.score i{display:block;height:3px;background:linear-gradient(90deg,var(--mint) var(--score),var(--line) 0);margin-top:12px}.page-scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:20px 0}.page-scores small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.delta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.delta div{border:1px solid var(--line);border-radius:16px;padding:18px}.delta strong,.delta span{display:block}.delta strong{font-size:28px;color:var(--mint)}.gate{border:1px solid var(--mint);background:#11271d;border-radius:14px;padding:18px;margin:20px 0}.gate.failed{border-color:var(--coral);background:#2c1714}.gate p,.gate ul{margin-bottom:0;color:var(--muted)}h2{margin:52px 0 8px;font-size:28px}.grid,.scenarios{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.finding{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--yellow);border-radius:14px;padding:20px}.finding.critical,.finding.serious{border-left-color:var(--coral)}.finding.advisory{border-left-color:#82a7ff}.finding h3{font-size:18px}.finding code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mint)}.finding p,.finding small,.scenario p{color:var(--muted)}.pill{display:inline-block;border:1px solid currentColor;border-radius:99px;padding:3px 8px;margin-right:8px}.pill.pass{color:var(--mint)}.scenario{overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:16px}.scenario img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;background:#090b0a}.scenario div{padding:16px}.scenario h3{margin:12px 0 0}.scenario p{margin:5px 0 0}.proof{display:grid;gap:16px}.proof>article{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px}.proof-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:14px}.proof-head span{color:var(--muted)}.proof-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.proof figure{margin:0;min-width:0}.proof figcaption{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--mint);margin-bottom:7px}.proof img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:10px;border:1px solid var(--line)}.empty{padding:40px;border:1px dashed var(--line);border-radius:14px;color:var(--muted)}footer{margin-top:52px;border-top:1px solid var(--line);padding-top:24px;color:var(--muted)}@media(max-width:760px){header{display:block}.scores{grid-template-columns:repeat(2,1fr)}.grid,.scenarios,.proof-pair{grid-template-columns:1fr}.delta{grid-template-columns:repeat(2,1fr)}}
</style></head><body><main><header><div><span class="eyebrow">Global Passport &middot; ${escapeHtml(report.runId)}</span><h1>Everywhere<br>QA</h1></div><p class="tagline">${escapeHtml(report.target.url)}<br>${escapeHtml(report.generatedAt)}<br>${report.target.pages.length} page${report.target.pages.length === 1 ? "" : "s"} audited</p></header><section class="scores">${cards}</section>${pageCards}${delta}${gate}${proof}<h2>Executed scenarios</h2><section class="scenarios">${scenarios}</section><h2>Deterministic evidence</h2><section class="grid">${findings}</section><h2>Heuristic advisories</h2><section class="grid">${advisories}</section><footer>${escapeHtml(report.disclaimer)}</footer></main><script type="application/json" id="report-data">${json}</script></body></html>`;
}

export async function writeReport(report: AuditReport, outDir: string): Promise<{ jsonPath: string; htmlPath: string }> {
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, "report.json");
  const htmlPath = join(outDir, "report.html");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(htmlPath, reportHtml(report), "utf8");
  return { jsonPath, htmlPath };
}

function scenarioKind(id: string): ScenarioKind {
  if (id.includes("accessibility")) return "accessibility";
  if (id.includes("rtl")) return "rtl";
  if (id.includes("pseudo") || id.includes("expansion")) return "text-expansion";
  return "resilience";
}

function normalizeLegacyFinding(item: Finding, targetUrl: string): Finding {
  if (item.confidence === "heuristic" || item.scenario === "source-review") return item;
  const kind = scenarioKind(item.scenario);
  return { ...item, scenario: `target:${kind}`, pageId: "target", pageUrl: targetUrl };
}

function normalizeLegacy(value: any): AuditReport {
  const targetUrl = value.target.url as string;
  const scenarios = (value.scenarios as any[]).map((scenario) => {
    const kind = scenarioKind(scenario.id);
    return { ...scenario, id: `target:${kind}`, kind, pageId: "target", pageUrl: targetUrl } as ScenarioResult;
  });
  const findings = (value.findings as Finding[]).map((item) => normalizeLegacyFinding(item, targetUrl));
  const advisories = (value.advisories as Finding[]).map((item) => normalizeLegacyFinding(item, targetUrl));
  return {
    ...value,
    schemaVersion: "1.1",
    target: { ...value.target, pages: [{ id: "target", url: targetUrl }], profileSignature: "legacy-default" },
    scenarios,
    findings,
    advisories,
    pageScores: [{ pageId: "target", pageUrl: targetUrl, scores: value.scores }],
    ...(value.verification ? {
      verification: {
        ...value.verification,
        fixed: value.verification.fixed.map((item: Finding) => normalizeLegacyFinding(item, targetUrl)),
        remaining: value.verification.remaining.map((item: Finding) => normalizeLegacyFinding(item, targetUrl)),
        introduced: value.verification.introduced.map((item: Finding) => normalizeLegacyFinding(item, targetUrl)),
        visualComparisons: [],
        gate: { policy: "off", status: "not-run", reasons: [] }
      }
    } : {})
  } as AuditReport;
}

export async function readReport(path: string): Promise<AuditReport> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read baseline report at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Baseline is not a report object.");
  const value = parsed as any;
  if (!["1.0", "1.1"].includes(value.schemaVersion) || typeof value.runId !== "string" || !Array.isArray(value.findings) || !Array.isArray(value.scenarios) || typeof value.scores?.overall !== "number" || typeof value.target?.url !== "string") {
    throw new Error("Baseline report is malformed or uses an unsupported schema version.");
  }
  if (value.schemaVersion === "1.0") return normalizeLegacy(value);
  if (!Array.isArray(value.target.pages) || typeof value.target.profileSignature !== "string" || !Array.isArray(value.pageScores)) {
    throw new Error("Baseline report is malformed or uses an unsupported schema version.");
  }
  return value as AuditReport;
}

export function assertBaselineCompatible(baseline: AuditReport, config: ResolvedAuditConfig): void {
  const beforeIds = baseline.target.pages.map((page) => page.id);
  const afterIds = config.pages.map((page) => page.id);
  if (beforeIds.length !== afterIds.length || beforeIds.some((page, index) => page !== afterIds[index])) {
    throw new Error("Baseline routes do not match this verification run. Reuse the same --url and --config used for the audit.");
  }
  const isSingleTarget = config.isDefault && baseline.target.pages.length === 1 && baseline.target.pages[0]?.id === "target";
  if (!isSingleTarget && baseline.target.pages.some((page, index) => page.url !== config.pages[index]?.url)) {
    throw new Error("Baseline route URLs do not match this verification run. Reuse the same --url and --config used for the audit.");
  }
  if (baseline.target.profileSignature === "legacy-default") {
    if (!config.isDefault) throw new Error("A schema 1.0 baseline can only be verified with the built-in single-page profiles.");
  } else if (baseline.target.profileSignature !== config.profileSignature) {
    throw new Error("Baseline profiles do not match this verification run. Reuse the same locale, viewport, expansion, and network configuration.");
  }
}

function safeScreenshotPath(root: string, screenshot: string): string {
  const full = resolve(root, screenshot);
  const back = relative(resolve(root), full);
  if (!back || back.startsWith(`..${sep}`) || back === ".." || isAbsolute(back)) throw new Error(`Baseline contains an unsafe screenshot path: ${screenshot}`);
  return full;
}

export async function copyBaselineScreenshots(baseline: AuditReport, current: ScenarioResult[], baselineDir: string, outDir: string): Promise<VisualComparison[]> {
  const destination = join(outDir, "baseline-screenshots");
  await mkdir(destination, { recursive: true });
  const comparisons: VisualComparison[] = [];
  for (const after of current) {
    const before = baseline.scenarios.find((scenario) => scenario.pageId === after.pageId && scenario.kind === after.kind);
    if (!before) throw new Error(`Baseline is missing scenario ${after.kind} for route ${after.pageId}.`);
    const filename = `${after.pageId}--${after.kind}.png`;
    try {
      await copyFile(safeScreenshotPath(baselineDir, before.screenshot), join(destination, filename));
    } catch (error) {
      throw new Error(`Unable to preserve baseline screenshot for ${after.pageId}/${after.kind}: ${error instanceof Error ? error.message : String(error)}`);
    }
    comparisons.push({
      scenarioId: after.id,
      kind: after.kind,
      pageId: after.pageId,
      label: after.label,
      beforeScreenshot: `baseline-screenshots/${filename}`,
      afterScreenshot: after.screenshot
    });
  }
  return comparisons;
}
