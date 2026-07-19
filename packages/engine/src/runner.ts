import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dedupeFindings, finding } from "./findings.js";
import { calculatePageScores, compareReports, evaluateGate } from "./scoring.js";
import { scanSource } from "./source-scan.js";
import { assertBaselineCompatible, copyBaselineScreenshots, writeReport } from "./report.js";
import type { AuditOptions, AuditPage, AuditProfiles, AuditReport, Finding, ScenarioKind, ScenarioResult, Severity } from "./types.js";

const require = createRequire(import.meta.url);
const playwrightVersion = (require("playwright/package.json") as { version: string }).version;
const axeVersion = (require("axe-core/package.json") as { version: string }).version;
const ENGINE_VERSION = "0.2.0";

type LayoutIssue = { selector: string; reason: string };
type ScenarioRun = { scenario: ScenarioResult; findings: Finding[] };

function impactSeverity(impact: string | null | undefined): Severity {
  if (impact === "critical") return "critical";
  if (impact === "serious") return "serious";
  if (impact === "minor") return "minor";
  return "moderate";
}

function scenarioId(page: AuditPage, kind: ScenarioKind): string {
  return `${page.id}:${kind}`;
}

function pageFinding(page: AuditPage, kind: ScenarioKind, input: Omit<Parameters<typeof finding>[0], "scenario" | "pageId" | "pageUrl">): Finding {
  return finding({ ...input, scenario: scenarioId(page, kind), pageId: page.id, pageUrl: page.url });
}

async function gotoTarget(browserPage: Page, page: AuditPage, timeoutMs: number): Promise<number> {
  const started = Date.now();
  try {
    const response = await browserPage.goto(page.url, { waitUntil: "load", timeout: timeoutMs });
    if (response && response.status() >= 400) throw new Error(`HTTP ${response.status()} ${response.statusText()}`);
  } catch (error) {
    throw new Error(`Could not load ${page.url}. Start the app and confirm the URL is reachable. ${error instanceof Error ? error.message : String(error)}`);
  }
  return Date.now() - started;
}

async function layoutIssues(page: Page): Promise<LayoutIssue[]> {
  return page.evaluate(() => {
    const selectorFor = (element: Element) => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${CSS.escape(testId)}"]`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && current !== document.body && parts.length < 4) {
        let part = current.tagName.toLowerCase();
        const parentElement: Element | null = current.parentElement;
        if (parentElement) {
          const siblings = [...parentElement.children].filter((item) => item.tagName === current?.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
        parts.unshift(part);
        current = parentElement;
      }
      return parts.join(" > ") || element.tagName.toLowerCase();
    };
    const width = document.documentElement.clientWidth;
    const issues: LayoutIssue[] = [];
    if (document.documentElement.scrollWidth > width + 2) {
      issues.push({ selector: "html", reason: `Document overflows horizontally by ${document.documentElement.scrollWidth - width}px.` });
    }
    const interactive = document.querySelectorAll("a,button,input,select,textarea,[tabindex]");
    for (const element of interactive) {
      const html = element as HTMLElement;
      const style = getComputedStyle(html);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = html.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.left < -1 || rect.right > width + 1) issues.push({ selector: selectorFor(element), reason: "Interactive control is partially outside the viewport." });
      if (html.scrollWidth > html.clientWidth + 2 || html.scrollHeight > html.clientHeight + 2) issues.push({ selector: selectorFor(element), reason: "Interactive control clips its content." });
      if (issues.length >= 15) break;
    }
    return issues;
  });
}

async function capture(page: Page, screenshotDir: string, id: string): Promise<string> {
  const full = join(screenshotDir, `${id}.png`);
  await page.screenshot({ path: full, fullPage: true, animations: "disabled", caret: "initial" });
  return `screenshots/${id}.png`;
}

async function close(context: BrowserContext): Promise<void> {
  await context.close().catch(() => undefined);
}

async function runAccessibility(browser: Browser, target: AuditPage, profile: AuditProfiles["accessibility"], screenshotDir: string, timeoutMs: number): Promise<ScenarioRun> {
  const kind = "accessibility" as const;
  const context = await browser.newContext({ locale: profile.locale, viewport: profile.viewport, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    const durationMs = await gotoTarget(page, target, timeoutMs);
    const screenshot = await capture(page, screenshotDir, `${target.id}--accessibility`);
    const results = await new AxeBuilder({ page }).analyze();
    const findings = results.violations.map((violation) => pageFinding(target, kind, {
      ruleId: `axe-${violation.id}`,
      pillar: "accessibility",
      severity: impactSeverity(violation.impact),
      selector: String(violation.nodes[0]?.target[0] ?? "document"),
      message: violation.help,
      evidence: screenshot,
      remediation: violation.nodes[0]?.failureSummary ?? violation.description,
      helpUrl: violation.helpUrl
    }));
    const focus = await page.evaluate(() => ({
      candidateCount: [...document.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])")].filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && !element.hasAttribute("disabled");
      }).length
    }));
    const focused = new Set<string>();
    for (let index = 0; index < Math.min(12, focus.candidateCount + 2); index += 1) {
      await page.keyboard.press("Tab");
      focused.add(await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        return active?.id || active?.getAttribute("data-testid") || active?.tagName || "none";
      }));
    }
    if (focus.candidateCount > 0 && [...focused].filter((value) => !["BODY", "HTML", "none"].includes(value)).length === 0) {
      findings.push(pageFinding(target, kind, { ruleId: "keyboard-no-focus", pillar: "accessibility", severity: "serious", message: "Keyboard traversal did not reach an interactive element.", evidence: screenshot, remediation: "Use native interactive controls and preserve a visible, logical tab order." }));
    }
    return { scenario: { id: scenarioId(target, kind), kind, label: "Keyboard and assistive technology", pageId: target.id, pageUrl: target.url, locale: profile.locale, viewport: profile.viewport, durationMs, screenshot, status: findings.length ? "completed-with-findings" : "passed" }, findings };
  } finally { await close(context); }
}

async function runRtl(browser: Browser, target: AuditPage, profile: AuditProfiles["rtl"], screenshotDir: string, timeoutMs: number): Promise<ScenarioRun> {
  const kind = "rtl" as const;
  const context = await browser.newContext({ locale: profile.locale, timezoneId: profile.timezoneId, viewport: profile.viewport, isMobile: true, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    const durationMs = await gotoTarget(page, target, timeoutMs);
    await page.waitForTimeout(150);
    const declaredDirection = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    await page.evaluate(() => { document.documentElement.dir = "rtl"; document.documentElement.lang = "ar"; });
    await page.waitForTimeout(100);
    const screenshot = await capture(page, screenshotDir, `${target.id}--rtl`);
    const findings = (await layoutIssues(page)).map((issue) => pageFinding(target, kind, { ruleId: "rtl-layout-overflow", pillar: "rtl", severity: issue.selector === "html" ? "serious" : "moderate", selector: issue.selector, message: issue.reason, evidence: screenshot, remediation: `Use fluid sizing and CSS logical properties, then verify this control in a ${profile.viewport.width}px RTL viewport.` }));
    if (declaredDirection !== "rtl") findings.push(pageFinding(target, kind, { ruleId: "rtl-direction-incorrect", pillar: "rtl", severity: "minor", selector: "html", message: declaredDirection ? `The page declares dir="${declaredDirection}" for an Arabic browser context.` : "The page does not declare a text direction for an Arabic browser context.", evidence: screenshot, remediation: "Set the html dir attribute from the active locale and update it when the locale changes." }));
    return { scenario: { id: scenarioId(target, kind), kind, label: "Right-to-left mobile", pageId: target.id, pageUrl: target.url, locale: profile.locale, viewport: profile.viewport, durationMs, screenshot, status: findings.length ? "completed-with-findings" : "passed" }, findings };
  } finally { await close(context); }
}

async function runPseudo(browser: Browser, target: AuditPage, profile: AuditProfiles["textExpansion"], screenshotDir: string, timeoutMs: number): Promise<ScenarioRun> {
  const kind = "text-expansion" as const;
  const context = await browser.newContext({ locale: profile.locale === "en-XA" ? "en-US" : profile.locale, viewport: profile.viewport, isMobile: true });
  try {
    const page = await context.newPage();
    const durationMs = await gotoTarget(page, target, timeoutMs);
    const before = new Set((await layoutIssues(page)).map((item) => `${item.selector}|${item.reason}`));
    await page.evaluate((ratio) => {
      const accents: Record<string, string> = { a:"á",b:"ƀ",c:"ç",d:"đ",e:"é",f:"ƒ",g:"ğ",h:"ħ",i:"í",j:"ĵ",k:"ķ",l:"ľ",m:"ɱ",n:"ñ",o:"ó",p:"þ",q:"ɋ",r:"ř",s:"š",t:"ŧ",u:"ú",v:"ṽ",w:"ŵ",x:"ẋ",y:"ý",z:"ž" };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.textContent?.trim() || /^(script|style|svg|code|pre|textarea)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }});
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      for (const node of nodes) {
        const text = node.textContent ?? "";
        const transformed = [...text].map((char) => {
          const replacement = accents[char.toLowerCase()];
          return replacement ? (char === char.toLowerCase() ? replacement : replacement.toUpperCase()) : char;
        }).join("");
        node.textContent = `[${transformed} ${"~".repeat(Math.max(1, Math.ceil(text.length * ratio)))}]`;
      }
    }, profile.ratio);
    await page.waitForTimeout(100);
    const screenshot = await capture(page, screenshotDir, `${target.id}--text-expansion`);
    const newIssues = (await layoutIssues(page)).filter((item) => !before.has(`${item.selector}|${item.reason}`));
    const percentage = Math.round(profile.ratio * 100);
    const findings = newIssues.map((issue) => pageFinding(target, kind, { ruleId: "text-expansion-layout", pillar: "rtl", severity: issue.selector === "html" ? "serious" : "moderate", selector: issue.selector, message: `${percentage}% text expansion caused a layout failure: ${issue.reason}`, evidence: screenshot, remediation: "Remove fixed text dimensions, allow wrapping, and retest with expanded labels." }));
    return { scenario: { id: scenarioId(target, kind), kind, label: `${percentage}% pseudo-localized text expansion`, pageId: target.id, pageUrl: target.url, locale: profile.locale, viewport: profile.viewport, durationMs, screenshot, status: findings.length ? "completed-with-findings" : "passed" }, findings };
  } finally { await close(context); }
}

async function runResilience(browser: Browser, target: AuditPage, profile: AuditProfiles["resilience"], screenshotDir: string, timeoutMs: number): Promise<ScenarioRun> {
  const kind = "resilience" as const;
  const context = await browser.newContext({ locale: profile.locale, timezoneId: profile.timezoneId, viewport: profile.viewport, isMobile: true });
  try {
    const page = await context.newPage();
    const failedRequests: string[] = [];
    const consoleErrors: string[] = [];
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    const session = await context.newCDPSession(page);
    await session.send("Network.enable");
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.network.latencyMs,
      downloadThroughput: profile.network.downloadKbps * 1024 / 8,
      uploadThroughput: profile.network.uploadKbps * 1024 / 8,
      connectionType: "cellular3g"
    });
    const durationMs = await gotoTarget(page, target, timeoutMs);
    await page.waitForTimeout(200);
    const screenshot = await capture(page, screenshotDir, `${target.id}--resilience`);
    const findings: Finding[] = [];
    if (durationMs > 5_000) findings.push(pageFinding(target, kind, { ruleId: "slow-network-load", pillar: "resilience", severity: durationMs > 10_000 ? "serious" : "moderate", selector: "document", message: `The page took ${(durationMs / 1000).toFixed(1)}s to settle on the throttled mobile profile.`, evidence: screenshot, remediation: "Reduce blocking JavaScript and media, split bundles, and render useful content before optional resources." }));
    if (failedRequests.length) findings.push(pageFinding(target, kind, { ruleId: "slow-network-request-failure", pillar: "resilience", severity: "serious", selector: "network", message: `${failedRequests.length} request(s) failed on the throttled profile.`, evidence: failedRequests.slice(0, 3).join("\n"), remediation: "Handle transient failures, add retry boundaries, and avoid making core UI depend on optional resources." }));
    if (consoleErrors.length) findings.push(pageFinding(target, kind, { ruleId: "runtime-console-error", pillar: "resilience", severity: "moderate", selector: "console", message: `${consoleErrors.length} console error(s) occurred on the localized mobile profile.`, evidence: consoleErrors.slice(0, 3).join("\n"), remediation: "Resolve the reported runtime errors and ensure fallback UI remains usable." }));
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (!lang) findings.push(pageFinding(target, kind, { ruleId: "locale-language-missing", pillar: "locale", severity: "moderate", selector: "html", message: "The document language is missing.", evidence: screenshot, remediation: "Set a valid html lang attribute so assistive technology can choose the correct pronunciation rules." }));
    return { scenario: { id: scenarioId(target, kind), kind, label: "Localized constrained mobile", pageId: target.id, pageUrl: target.url, locale: profile.locale, viewport: profile.viewport, durationMs, screenshot, status: findings.length ? "completed-with-findings" : "passed" }, findings };
  } finally { await close(context); }
}

export async function runAudit(options: AuditOptions): Promise<AuditReport> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const outDir = resolve(options.outDir);
  const screenshotDir = join(outDir, "screenshots");
  if (options.baseline) assertBaselineCompatible(options.baseline, options.config);
  await mkdir(screenshotDir, { recursive: true });
  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    throw new Error(`Chromium is unavailable. Run "everywhere setup" and retry. ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    const runs: ScenarioRun[] = [];
    for (const target of options.config.pages) {
      runs.push(await runAccessibility(browser, target, options.config.profiles.accessibility, screenshotDir, timeoutMs));
      runs.push(await runRtl(browser, target, options.config.profiles.rtl, screenshotDir, timeoutMs));
      runs.push(await runPseudo(browser, target, options.config.profiles.textExpansion, screenshotDir, timeoutMs));
      runs.push(await runResilience(browser, target, options.config.profiles.resilience, screenshotDir, timeoutMs));
    }
    const browserFindings = dedupeFindings(runs.flatMap((run) => run.findings));
    const sourceFindings = options.repo ? await scanSource(resolve(options.repo)) : [];
    const findings = browserFindings.filter((item) => item.confidence === "deterministic");
    const advisories = dedupeFindings([...browserFindings.filter((item) => item.confidence === "heuristic"), ...sourceFindings]);
    const { scores, pageScores } = calculatePageScores(findings, options.config.pages);
    const report: AuditReport = {
      schemaVersion: "1.1",
      runId: randomUUID().slice(0, 8),
      target: { url: options.url, ...(options.repo ? { repo: resolve(options.repo) } : {}), pages: options.config.pages, profileSignature: options.config.profileSignature },
      generatedAt: new Date().toISOString(),
      tools: { everywhereQa: ENGINE_VERSION, playwright: playwrightVersion, axeCore: axeVersion },
      scenarios: runs.map((run) => run.scenario),
      findings,
      advisories,
      scores,
      pageScores,
      summary: { deterministic: findings.length, advisory: advisories.length, critical: findings.filter((item) => item.severity === "critical").length },
      disclaimer: "Automated evidence is incomplete. Everywhere QA is not a WCAG certification, legal opinion, or translation-quality assessment. Human review remains required."
    };
    if (options.baseline) {
      if (!options.baselineDir) throw new Error("Verification requires the baseline report directory.");
      report.verification = compareReports(options.baseline, findings, scores.overall);
      report.verification.visualComparisons = await copyBaselineScreenshots(options.baseline, report.scenarios, options.baselineDir, outDir);
      report.verification.gate = evaluateGate(report.verification, options.gatePolicy ?? "off");
    }
    await writeReport(report, outDir);
    return report;
  } finally {
    await browser.close();
  }
}
