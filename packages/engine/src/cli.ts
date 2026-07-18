#!/usr/bin/env node
import { resolve } from "node:path";
import { runAudit } from "./runner.js";
import { readReport } from "./report.js";

type Command = "audit" | "verify";

function usage(): string {
  return `Everywhere QA — Fix once. Work everywhere.

Usage:
  everywhere audit --url <url> [--repo <path>] [--out <directory>] [--timeout <ms>]
  everywhere verify --baseline <report.json> --url <url> [--repo <path>] [--out <directory>] [--timeout <ms>]

Audit is read-only for the target repository. Output defaults to ./artifacts/everywhere-qa.`;
}

function parse(argv: string[]): { command: Command; flags: Map<string, string> } {
  const command = argv[0];
  if (command !== "audit" && command !== "verify") throw new Error(usage());
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

async function main(): Promise<void> {
  const { command, flags } = parse(process.argv.slice(2));
  const url = flags.get("url");
  if (!url) throw new Error("--url is required.\n\n" + usage());
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { throw new Error(`--url must be an absolute http(s) URL: ${url}`); }
  if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Only http and https URLs are supported.");
  const timeout = flags.get("timeout") ? Number(flags.get("timeout")) : 30_000;
  if (!Number.isFinite(timeout) || timeout < 1_000) throw new Error("--timeout must be a number of at least 1000 milliseconds.");
  const outDir = resolve(flags.get("out") ?? "artifacts/everywhere-qa");
  const baselinePath = flags.get("baseline");
  if (command === "verify" && !baselinePath) throw new Error("verify requires --baseline <report.json>.");
  const baseline = baselinePath ? await readReport(resolve(baselinePath)) : undefined;
  process.stdout.write(`\n🌍 Auditing ${url}\n`);
  const report = await runAudit({ url, outDir, timeoutMs: timeout, ...(flags.get("repo") ? { repo: resolve(flags.get("repo")!) } : {}), ...(baseline ? { baseline } : {}) });
  process.stdout.write(`\nGlobal Passport ${report.runId}\n`);
  process.stdout.write(`Score: ${report.scores.overall}/100 · Findings: ${report.findings.length} · Advisories: ${report.advisories.length}\n`);
  if (report.verification) process.stdout.write(`Verified: ${report.verification.fixed.length} fixed, ${report.verification.introduced.length} introduced, ${report.verification.scoreChange >= 0 ? "+" : ""}${report.verification.scoreChange} points\n`);
  process.stdout.write(`Report: ${resolve(outDir, "report.html")}\n\n`);
}

main().catch((error) => {
  process.stderr.write(`\nEverywhere QA failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
