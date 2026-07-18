#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");
const cli = resolve(repoRoot, "packages/engine/dist/cli.js");

if (!existsSync(cli)) {
  process.stderr.write(`Everywhere QA engine is not built. From ${repoRoot}, run npm install and npm run build -w @everywhere-qa/engine.\n`);
  process.exit(1);
}

const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: "inherit",
  windowsHide: true
});

child.on("error", (error) => {
  process.stderr.write(`Unable to start Everywhere QA: ${error.message}\n`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.stderr.write(`Everywhere QA stopped by ${signal}.\n`);
  process.exitCode = code ?? 1;
});
