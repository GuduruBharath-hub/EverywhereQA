import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const repo = resolve(root, "apps/demo");
const out = resolve(root, "artifacts/integration");
const baseUrl = (process.env.EVERYWHERE_QA_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const cli = resolve(root, "packages/engine/dist/cli.js");

async function sourceDigest(directory) {
  const hash = createHash("sha256");
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if ([".next", "node_modules"].includes(entry.name)) continue;
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else {
        hash.update(full.slice(directory.length));
        hash.update(await readFile(full));
      }
    }
  }
  await visit(directory);
  return hash.digest("hex");
}

function run(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(result.status, expectedStatus, `everywhere ${args[0]} exited ${result.status}; expected ${expectedStatus}`);
}

const before = await sourceDigest(repo);
const baselineDir = resolve(out, "baseline");
run(["audit", "--url", `${baseUrl}/lab-broken`, "--repo", repo, "--out", baselineDir, "--timeout", "30000"]);
const afterAudit = await sourceDigest(repo);
assert.equal(afterAudit, before, "audit changed the target repository");

const baseline = JSON.parse(await readFile(resolve(baselineDir, "report.json"), "utf8"));
const ruleIds = new Set(baseline.findings.map((finding) => finding.ruleId));
for (const expected of ["axe-image-alt", "axe-label", "rtl-layout-overflow", "text-expansion-layout", "slow-network-load"]) {
  assert(ruleIds.has(expected), `baseline did not produce ${expected}`);
}
assert.equal(baseline.schemaVersion, "1.1");
assert.equal(baseline.scores.overall, 64, "single-route baseline changed from the recorded score");
assert.equal(baseline.scenarios.length, 4);
for (const scenario of baseline.scenarios) await readFile(resolve(baselineDir, scenario.screenshot));

const verifiedDir = resolve(out, "verified");
run(["verify", "--baseline", resolve(baselineDir, "report.json"), "--url", `${baseUrl}/lab`, "--repo", repo, "--out", verifiedDir, "--timeout", "30000", "--gate", "regression"]);
const verified = JSON.parse(await readFile(resolve(verifiedDir, "report.json"), "utf8"));
assert.equal(verified.scores.overall, 100);
assert(verified.verification.fixed.length >= 3, "verification did not fix three distinct findings");
assert.equal(verified.verification.remaining.length, 0);
assert.equal(verified.verification.introduced.length, 0);
assert.equal(verified.verification.scoreChange, 36);
assert.equal(verified.verification.gate.status, "passed");
assert.equal(verified.verification.visualComparisons.length, 4);
for (const comparison of verified.verification.visualComparisons) {
  await readFile(resolve(verifiedDir, comparison.beforeScreenshot));
  await readFile(resolve(verifiedDir, comparison.afterScreenshot));
}

const multiDir = resolve(out, "multi-route");
run(["audit", "--url", baseUrl, "--config", resolve(root, "everywhere.config.example.json"), "--repo", repo, "--out", multiDir, "--timeout", "30000"]);
const multi = JSON.parse(await readFile(resolve(multiDir, "report.json"), "utf8"));
assert.equal(multi.target.pages.length, 2);
assert.equal(multi.scenarios.length, 8);
assert.equal(multi.pageScores.length, 2);

const synthetic = {
  ...baseline,
  runId: "known-good",
  findings: [],
  scores: { overall: 100, accessibility: 100, rtl: 100, locale: 100, resilience: 100 },
  pageScores: baseline.pageScores.map((page) => ({ ...page, scores: { overall: 100, accessibility: 100, rtl: 100, locale: 100, resilience: 100 } })),
  summary: { deterministic: 0, advisory: baseline.summary.advisory, critical: 0 }
};
const syntheticPath = resolve(baselineDir, "known-good.json");
await writeFile(syntheticPath, `${JSON.stringify(synthetic, null, 2)}\n`, "utf8");
const regressedDir = resolve(out, "gate-regression");
run(["verify", "--baseline", syntheticPath, "--url", `${baseUrl}/lab-broken`, "--repo", repo, "--out", regressedDir, "--timeout", "30000", "--gate", "regression"], 2);
const regressed = JSON.parse(await readFile(resolve(regressedDir, "report.json"), "utf8"));
assert.equal(regressed.verification.gate.status, "failed");
assert(regressed.verification.gate.reasons.length >= 1);
assert.equal(await sourceDigest(repo), before, "an audit or verification command changed the target repository");

process.stdout.write(`\nIntegration gate passed: ${baseline.scores.overall} -> ${verified.scores.overall}; ${verified.verification.fixed.length} fixed; 8 multi-route scenarios; regression exit 2 verified.\n`);
