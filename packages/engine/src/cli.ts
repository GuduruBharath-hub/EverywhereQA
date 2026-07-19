#!/usr/bin/env node
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { readAuditConfig, resolveAuditConfig } from "./config.js";
import { runAudit } from "./runner.js";
import { readReport } from "./report.js";
import type { GatePolicy } from "./types.js";

type Command = "setup" | "audit" | "verify";

function usage(): string {
  return `Everywhere QA — Fix once. Work everywhere.

Usage:
  everywhere setup
  everywhere audit --url <url> [--config <file>] [--repo <path>] [--out <directory>] [--timeout <ms>]
  everywhere verify --baseline <report.json> --url <url> [--config <file>] [--repo <path>] [--out <directory>] [--timeout <ms>] [--gate <off|regression>]

Audit is read-only for the target repository. Output defaults to ./artifacts/everywhere-qa.`;
}

function parse(argv: string[]): { command: Command; flags: Map<string, string> } {
  const command = argv[0];
  if (command !== "setup" && command !== "audit" && command !== "verify") throw new Error(usage());
  const flags = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) throw new Error(`Unexpected argument: ${token ?? ""}\n\n${usage()}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    flags.set(token.slice(2), value);
    index += 1;
  }
  return { command, flags };
}

async function setup(): Promise<void> {
  const executable = chromium.executablePath();
  try {
    await access(executable);
    process.stdout.write(`Chromium is already installed at ${executable}\n`);
    return;
  } catch {
    process.stdout.write("Installing the Playwright Chromium browser…\n");
  }
  const require = createRequire(import.meta.url);
  const cli = join(dirname(require.resolve("playwright/package.json")), "cli.js");
  const code = await new Promise<number>((resolveCode, reject) => {
    const child = spawn(process.execPath, [cli, "install", "chromium"], { stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (exitCode) => resolveCode(exitCode ?? 1));
  });
  if (code !== 0) throw new Error(`Chromium installation exited with code ${code}.`);
  process.stdout.write("Chromium setup complete.\n");
}

async function main(): Promise<void> {
  const { command, flags } = parse(process.argv.slice(2));
  if (command === "setup") {
    if (flags.size) throw new Error(`setup does not accept flags.\n\n${usage()}`);
    await setup();
    return;
  }
  const url = flags.get("url");
  if (!url) throw new Error("--url is required.\n\n" + usage());
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { throw new Error(`--url must be an absolute http(s) URL: ${url}`); }
  if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Only http and https URLs are supported.");
  const timeout = flags.get("timeout") ? Number(flags.get("timeout")) : 30_000;
  if (!Number.isFinite(timeout) || timeout < 1_000) throw new Error("--timeout must be a number of at least 1000 milliseconds.");
  const outDir = resolve(flags.get("out") ?? "artifacts/everywhere-qa");
  const baselinePath = flags.get("baseline") ? resolve(flags.get("baseline")!) : undefined;
  if (command === "verify" && !baselinePath) throw new Error("verify requires --baseline <report.json>.");
  if (command === "audit" && baselinePath) throw new Error("--baseline is only valid with verify.");
  const gate = flags.get("gate") ?? "off";
  if (gate !== "off" && gate !== "regression") throw new Error("--gate must be off or regression.");
  if (command === "audit" && gate !== "off") throw new Error("--gate is only valid with verify.");
  const configPath = flags.get("config") ? resolve(flags.get("config")!) : undefined;
  const configFile = configPath ? await readAuditConfig(configPath) : undefined;
  const config = resolveAuditConfig(url, configFile);
  const baseline = baselinePath ? await readReport(baselinePath) : undefined;
  process.stdout.write(`\nAuditing ${config.pages.length} page${config.pages.length === 1 ? "" : "s"} from ${url}\n`);
  const report = await runAudit({
    url,
    outDir,
    timeoutMs: timeout,
    config,
    gatePolicy: gate as GatePolicy,
    ...(flags.get("repo") ? { repo: resolve(flags.get("repo")!) } : {}),
    ...(baseline ? { baseline, baselineDir: dirname(baselinePath!) } : {})
  });
  process.stdout.write(`\nGlobal Passport ${report.runId}\n`);
  process.stdout.write(`Score: ${report.scores.overall}/100 · Findings: ${report.findings.length} · Advisories: ${report.advisories.length}\n`);
  if (report.verification) {
    process.stdout.write(`Verified: ${report.verification.fixed.length} fixed, ${report.verification.introduced.length} introduced, ${report.verification.scoreChange >= 0 ? "+" : ""}${report.verification.scoreChange} points\n`);
    if (report.verification.gate.policy !== "off") process.stdout.write(`Regression gate: ${report.verification.gate.status}\n`);
  }
  process.stdout.write(`Report: ${resolve(outDir, "report.html")}\n\n`);
  if (report.verification?.gate.status === "failed") process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`\nEverywhere QA failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
