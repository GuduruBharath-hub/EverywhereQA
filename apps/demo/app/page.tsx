import Link from "next/link";
import { Passport } from "../components/passport";

const install = `codex plugin marketplace add <repo>\ncodex plugin add everywhere-qa@personal`;

export default function Home() {
  return <main>
    <nav className="nav wrap"><Link className="brand" href="/"><span>EQ</span>Everywhere QA</Link><div><a href="#how">How it works</a><a href="#install">Install</a><Link className="nav-cta" href="/lab-broken">Open test lab</Link></div></nav>
    <section className="hero wrap">
      <div className="hero-copy"><span className="kicker"><i /> Codex plugin · local-first</span><h1>Fix once.<br/><em>Work everywhere.</em></h1><p>Find the barriers your happy path misses. Codex tests real global conditions, repairs your React app, and proves every fix with the same deterministic checks.</p><div className="hero-actions"><a className="button primary" href="#install">Install the plugin <span>↗</span></a><Link className="button ghost" href="/lab-broken">Audit the broken demo</Link></div><div className="trust"><span>No API key</span><span>No source upload</span><span>Evidence, not guesses</span></div></div>
      <div className="hero-product"><Passport /></div>
    </section>
    <section className="problem"><div className="wrap stat-row"><div><strong>4</strong><span>global conditions,<br/>one repeatable run</span></div><p>Most QA validates one language, one direction, and one fast connection. That is not the world your product ships into.</p><blockquote>“Accessibility and localization should not be a checklist after launch. They should be a repair loop inside the developer workflow.”</blockquote></div></section>
    <section id="how" className="how wrap"><span className="section-no">01 / The loop</span><div className="section-title"><h2>Evidence in.<br/>Verified patches out.</h2><p>The scanner stays deterministic. GPT‑5.6 does what it is uniquely good at: understanding the repository, choosing the smallest safe repair, and validating the result.</p></div><div className="steps">
      <article><b>01</b><div className="step-icon">◎</div><h3>Test the world</h3><p>Run Chromium across keyboard access, Arabic RTL, expanded copy, and constrained Indian mobile.</p><code>everywhere audit --url …</code></article>
      <article><b>02</b><div className="step-icon">⌁</div><h3>Repair the source</h3><p>Codex reads the evidence ledger, locates the React source, and applies scoped, reviewable fixes.</p><code>Audit and fix this app…</code></article>
      <article><b>03</b><div className="step-icon">✓</div><h3>Prove the delta</h3><p>Rerun identical checks and separate fixed, remaining, and newly introduced barriers.</p><code>everywhere verify --baseline …</code></article>
    </div></section>
    <section className="contexts"><div className="wrap"><span className="section-no">02 / Test matrix</span><h2>Four views of the same product.</h2><div className="context-grid"><article><span>⌨</span><h3>Keyboard + assistive tech</h3><p>axe-core evidence, focus traversal, labels, semantics, and visible controls.</p></article><article className="arabic"><span>ع</span><h3>Arabic RTL mobile</h3><p>Direction, overflow, clipped interactions, and logical layout at 390px.</p></article><article><span>↔</span><h3>40% text expansion</h3><p>Pseudo-localized copy exposes fixed widths and labels that cannot breathe.</p></article><article><span>3G</span><h3>India constrained mobile</h3><p>hi-IN locale, Asia/Kolkata time, slow network, failed requests, and runtime errors.</p></article></div></div></section>
    <section id="install" className="install wrap"><div><span className="section-no">03 / Try it</span><h2>Your next users<br/>are already everywhere.</h2><p>Clone the repository, install the marketplace, then start a fresh Codex thread with GPT‑5.6 selected.</p></div><div className="terminal"><div><span/><span/><span/><b>PowerShell / shell</b></div><pre>{install}</pre><p><span>$</span> Audit and fix this app for users everywhere: http://localhost:3000</p></div></section>
    <footer><div className="wrap"><div className="brand"><span>EQ</span>Everywhere QA</div><p>Automated evidence is incomplete. Not a certification, legal opinion, or translation assessment.</p><span>Built with Codex + GPT‑5.6 · 2026</span></div></footer>
  </main>;
}
