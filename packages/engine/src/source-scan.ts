import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { finding } from "./findings.js";
import type { Finding } from "./types.js";

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss"]);
const ignored = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);

async function collectFiles(root: string, current = root, files: string[] = []): Promise<string[]> {
  if (files.length >= 500) return files;
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) await collectFiles(root, path, files);
    else if (sourceExtensions.has(extname(entry.name))) files.push(path);
    if (files.length >= 500) break;
  }
  return files;
}

export async function scanSource(repo: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  let files: string[];
  try {
    files = await collectFiles(repo);
  } catch {
    return findings;
  }

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const display = relative(repo, file).replaceAll("\\", "/");
    if (/\b(margin|padding)-(left|right)\s*:|(^|[;{\s])(left|right)\s*:/m.test(text)) {
      findings.push(finding({
        ruleId: "source-physical-direction",
        pillar: "rtl",
        severity: "minor",
        scenario: "source-review",
        selector: display,
        message: "Physical left/right CSS may not mirror in right-to-left layouts.",
        evidence: display,
        confidence: "heuristic",
        remediation: "Review this file and prefer logical properties such as margin-inline-start or inset-inline-end."
      }));
    }
    if (/(["'`])(?:US\$|\$)\s?\d|\d\/(?:\d{1,2})\/\d{2,4}/.test(text)) {
      findings.push(finding({
        ruleId: "source-locale-literal",
        pillar: "locale",
        severity: "moderate",
        scenario: "source-review",
        selector: display,
        message: "A currency or date literal may assume one locale.",
        evidence: display,
        confidence: "heuristic",
        remediation: "Confirm the value is intentional; otherwise format it with Intl.NumberFormat or Intl.DateTimeFormat."
      }));
    }
  }
  return findings.slice(0, 30);
}
