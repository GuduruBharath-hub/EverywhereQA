import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AuditReport, Finding } from "./types.js";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char] ?? char);
}

function findingCard(item: Finding, advisory = false): string {
  const label = advisory ? "advisory" : item.severity;
  const note = advisory ? " &middot; does not affect score" : "";
  return `<article class="finding ${advisory ? "advisory" : item.severity}">
    <div><span class="pill">${label}</span><span>${escapeHtml(item.pillar)}</span></div>
    <h3>${escapeHtml(item.message)}</h3><code>${escapeHtml(item.selector)}</code>
    <p>${escapeHtml(item.remediation)}</p>
    <small>${escapeHtml(item.scenario)} &middot; ${escapeHtml(item.ruleId)}${note}</small>
  </article>`;
}

function reportHtml(report: AuditReport): string {
  const json = JSON.stringify(report).replaceAll("<", "\\u003c");
  const cards = (Object.entries(report.scores) as [string, number][])
    .map(([name, score]) => `<div class="score"><span>${escapeHtml(name)}</span><strong>${score}</strong><i style="--score:${score}%"></i></div>`)
    .join("");
  const findings = report.findings.length
    ? report.findings.map((item) => findingCard(item)).join("")
    : `<div class="empty">No deterministic findings in the executed scenarios.</div>`;
  const advisories = report.advisories.length
    ? report.advisories.map((item) => findingCard(item, true)).join("")
    : `<div class="empty">No heuristic source advisories.</div>`;
  const scenarios = report.scenarios.map((scenario) => `<article class="scenario">
    <img src="${escapeHtml(scenario.screenshot)}" alt="Evidence screenshot for ${escapeHtml(scenario.label)}">
    <div><span class="pill ${scenario.status === "passed" ? "pass" : ""}">${escapeHtml(scenario.status)}</span>
    <h3>${escapeHtml(scenario.label)}</h3>
    <p>${escapeHtml(scenario.locale)} &middot; ${scenario.viewport.width}&times;${scenario.viewport.height} &middot; ${(scenario.durationMs / 1000).toFixed(1)}s</p></div>
  </article>`).join("");
  const delta = report.verification
    ? `<section class="delta"><div><strong>${report.verification.scoreChange >= 0 ? "+" : ""}${report.verification.scoreChange}</strong><span>score change</span></div><div><strong>${report.verification.fixed.length}</strong><span>fixed</span></div><div><strong>${report.verification.introduced.length}</strong><span>introduced</span></div></section>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Everywhere QA Global Passport</title>
<style>
:root{color-scheme:dark;--ink:#f5f1e8;--muted:#aaa9a2;--panel:#181b1a;--line:#323735;--mint:#9ce6bd;--coral:#ff806d}*{box-sizing:border-box}body{margin:0;background:#0d0f0e;color:var(--ink);font:15px/1.55 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1120px,92vw);margin:auto;padding:56px 0 80px}header{display:flex;justify-content:space-between;gap:24px;align-items:end;border-bottom:1px solid var(--line);padding-bottom:28px}h1{font-size:clamp(38px,7vw,80px);line-height:.95;letter-spacing:-.06em;margin:8px 0}.eyebrow,.pill{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mint)}.tagline{color:var(--muted);max-width:36ch}.scores{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:28px 0}.score{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;overflow:hidden}.score span{display:block;text-transform:capitalize;color:var(--muted)}.score strong{font-size:34px}.score i{display:block;height:3px;background:linear-gradient(90deg,var(--mint) var(--score),var(--line) 0);margin-top:12px}.delta{display:flex;gap:12px;margin:20px 0}.delta div{flex:1;border:1px solid var(--line);border-radius:16px;padding:18px}.delta strong,.delta span{display:block}.delta strong{font-size:28px;color:var(--mint)}h2{margin-top:52px;font-size:28px}.grid,.scenarios{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.finding{background:var(--panel);border:1px solid var(--line);border-left:3px solid #f2c14e;border-radius:14px;padding:20px}.finding.critical,.finding.serious{border-left-color:var(--coral)}.finding.advisory{border-left-color:#82a7ff}.finding h3{font-size:18px}.finding code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mint)}.finding p,.finding small,.scenario p{color:var(--muted)}.pill{display:inline-block;border:1px solid currentColor;border-radius:99px;padding:3px 8px;margin-right:8px}.pill.pass{color:var(--mint)}.scenario{overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:16px}.scenario img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;background:#090b0a}.scenario div{padding:16px}.scenario h3{margin:12px 0 0}.scenario p{margin:5px 0 0}.empty{padding:40px;border:1px dashed var(--line);border-radius:14px;color:var(--muted)}footer{margin-top:52px;border-top:1px solid var(--line);padding-top:24px;color:var(--muted)}@media(max-width:760px){header{display:block}.scores{grid-template-columns:repeat(2,1fr)}.grid,.scenarios{grid-template-columns:1fr}.delta{flex-direction:column}}
</style></head><body><main><header><div><span class="eyebrow">Global Passport &middot; ${escapeHtml(report.runId)}</span><h1>Everywhere<br>QA</h1></div><p class="tagline">${escapeHtml(report.target.url)}<br>${escapeHtml(report.generatedAt)}</p></header><section class="scores">${cards}</section>${delta}<h2>Executed scenarios</h2><section class="scenarios">${scenarios}</section><h2>Deterministic evidence</h2><section class="grid">${findings}</section><h2>Heuristic advisories</h2><section class="grid">${advisories}</section><footer>${escapeHtml(report.disclaimer)}</footer></main><script type="application/json" id="report-data">${json}</script></body></html>`;
}

export async function writeReport(report: AuditReport, outDir: string): Promise<{ jsonPath: string; htmlPath: string }> {
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, "report.json");
  const htmlPath = join(outDir, "report.html");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(htmlPath, reportHtml(report), "utf8");
  return { jsonPath, htmlPath };
}

export async function readReport(path: string): Promise<AuditReport> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read baseline report at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Baseline is not a report object.");
  const value = parsed as Partial<AuditReport>;
  if (value.schemaVersion !== "1.0" || typeof value.runId !== "string" || !Array.isArray(value.findings) || typeof value.scores?.overall !== "number") {
    throw new Error("Baseline report is malformed or uses an unsupported schema version.");
  }
  return value as AuditReport;
}
