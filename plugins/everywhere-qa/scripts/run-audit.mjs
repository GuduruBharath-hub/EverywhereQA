#!/usr/bin/env node
import { spawn } from "node:child_process";

const packageSpec = "everywhere-qa@0.2.0";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const args = ["exec", "--yes", `--package=${packageSpec}`, "--", "everywhere", ...process.argv.slice(2)];

const child = spawn(npm, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  windowsHide: true
});

child.on("error", (error) => {
  process.stderr.write(`Unable to start ${packageSpec}: ${error.message}\nConfirm Node.js 20+, npm, and network access are available.\n`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.stderr.write(`Everywhere QA stopped by ${signal}.\n`);
  process.exitCode = code ?? 1;
});
