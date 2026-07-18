import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
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

function run(args) {
  execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
}

const before = await sourceDigest(repo);
run(["audit", "--url", `${baseUrl}/lab-broken`, "--repo", repo, "--out", resolve(out, "baseline"), "--timeout", "30000"]);
const after = await sourceDigest(repo);
assert.equal(after, before, "audit changed the target repository");

const baseline = JSON.parse(await readFile(resolve(out, "baseline/report.json"), "utf8"));
const ruleIds = new Set(baseline.findings.map((finding) => finding.ruleId));
for (const expected of ["axe-image-alt", "axe-label", "rtl-layout-overflow", "text-expansion-layout", "slow-network-load"]) {
  assert(ruleIds.has(expected), `baseline did not produce ${expected}`);
}
assert(baseline.scores.overall < 80, "broken fixture did not produce a meaningful baseline");
for (const scenario of baseline.scenarios) {
  await readFile(resolve(out, "baseline", scenario.screenshot));
}

run(["verify", "--baseline", resolve(out, "baseline/report.json"), "--url", `${baseUrl}/lab`, "--repo", repo, "--out", resolve(out, "verified"), "--timeout", "30000"]);
const verified = JSON.parse(await readFile(resolve(out, "verified/report.json"), "utf8"));
assert.equal(verified.scores.overall, 100);
assert(verified.verification.fixed.length >= 3, "verification did not fix three distinct findings");
assert.equal(verified.verification.remaining.length, 0);
assert.equal(verified.verification.introduced.length, 0);
assert(verified.verification.scoreChange >= 20, "verification score increase was not meaningful");

process.stdout.write(`\nIntegration gate passed: ${baseline.scores.overall} -> ${verified.scores.overall}; ${verified.verification.fixed.length} fixed; source digest unchanged during audit.\n`);
