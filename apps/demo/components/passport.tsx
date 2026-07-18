"use client";

import { useState } from "react";
import { findings, scenarios } from "../lib/sample-passport";

export function Passport() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [selected, setSelected] = useState<(typeof scenarios)[number]["id"]>("rtl");
  const overall = mode === "before" ? 66 : 100;
  return <div className="passport-shell" aria-label="Interactive sample Global Passport">
    <div className="passport-topline">
      <div><span className="kicker">Global Passport · 7f2ad093</span><strong>Tripboard sample</strong></div>
      <div className="segmented" role="group" aria-label="Report state">
        <button className={mode === "before" ? "active" : ""} onClick={() => setMode("before")}>Before</button>
        <button className={mode === "after" ? "active" : ""} onClick={() => setMode("after")}>Verified</button>
      </div>
    </div>
    <div className="passport-score">
      <div className="score-orbit" style={{ "--score": `${overall * 3.6}deg` } as React.CSSProperties}><span>{overall}</span><small>/100</small></div>
      <div><p>Readiness score</p><h3>{mode === "before" ? "Barriers found in every context." : "Twelve barriers fixed and retested."}</h3><span className={mode === "before" ? "delta down" : "delta"}>{mode === "before" ? "12 deterministic findings" : "+34 verified points"}</span></div>
    </div>
    <div className="scenario-strip">
      {scenarios.map((scenario) => <button key={scenario.id} className={selected === scenario.id ? "selected" : ""} onClick={() => setSelected(scenario.id)}>
        <span>{scenario.flag}</span><div><strong>{scenario.name}</strong><small>{scenario.detail}</small></div><b>{mode === "before" ? scenario.before : scenario.after}</b>
      </button>)}
    </div>
    <div className="evidence-head"><span>Evidence ledger</span><span>{mode === "before" ? "Prioritized for repair" : "Same tests, rerun"}</span></div>
    <div className="evidence-list">
      {findings.slice(0, 3).map((item) => <article key={item.selector}>
        <i className={item.severity}>{mode === "after" ? "fixed" : item.severity}</i>
        <div><strong>{item.title}</strong><code>{item.selector}</code></div>
        <span>{item.scenario}</span>
      </article>)}
    </div>
  </div>;
}
