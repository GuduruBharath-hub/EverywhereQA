"use client";

import { useState } from "react";
import styles from "./install-panel.module.css";

const steps = [
  {
    title: "Add the tagged marketplace",
    command: "codex plugin marketplace add GuduruBharath-hub/EverywhereQA --ref v0.2.0"
  },
  {
    title: "Install the Codex plugin",
    command: "codex plugin add everywhere-qa@everywhere-qa"
  },
  {
    title: "Install Chromium once",
    command: "npx --yes everywhere-qa@0.2.0 setup"
  }
];

const repairPrompt = "Audit and fix this app for users everywhere: http://localhost:3000";
const cliCommand = "npx --yes everywhere-qa@0.2.0 audit --url https://everywhere-qa-demo-2ifz.vercel.app/lab-broken --out artifacts/judge-audit";

export function InstallPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied((current) => current === label ? null : current), 1600);
  }

  return <div className={styles.panel}>
    <div className={styles.head}>
      <div className={styles.dots}><span/><span/><span/></div>
      <div className={styles.headline}><strong>Codex plugin</strong><small>Recommended · run in order</small></div>
      <span className={styles.version}>v0.2.0</span>
    </div>

    <ol className={styles.steps}>
      {steps.map((step, index) => <li key={step.title}>
        <span className={styles.number}>{index + 1}</span>
        <div className={styles.command}><b>{step.title}</b><code>{step.command}</code></div>
        <button type="button" onClick={() => copy(step.title, step.command)} aria-label={`Copy: ${step.title}`}>
          {copied === step.title ? "Copied" : "Copy"}
        </button>
      </li>)}
    </ol>

    <div className={styles.prompt}>
      <div><b>Then start a fresh Codex thread</b><span>Select GPT-5.6, open the target repository, and make sure its app is running.</span></div>
      <code>{repairPrompt}</code>
      <button type="button" onClick={() => copy("prompt", repairPrompt)} aria-label="Copy repair prompt">
        {copied === "prompt" ? "Copied" : "Copy prompt"}
      </button>
    </div>

    <details className={styles.cli}>
      <summary><span>CLI-only audit</span><small>No Codex plugin or source repair</small></summary>
      <div><code>{cliCommand}</code><button type="button" onClick={() => copy("cli", cliCommand)} aria-label="Copy CLI audit command">{copied === "cli" ? "Copied" : "Copy"}</button></div>
    </details>
  </div>;
}
