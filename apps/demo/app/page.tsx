import Link from "next/link";
import { BrandMark } from "../components/brand-mark";
import { Passport } from "../components/passport";

const install = `codex plugin marketplace add GuduruBharath-hub/EverywhereQA --ref v0.2.0
codex plugin add everywhere-qa@everywhere-qa
npx --yes everywhere-qa@0.2.0 setup`;

export default function Home() {
  return <main>
    <nav className="nav wrap"><Link className="brand" href="/"><BrandMark />Everywhere QA</Link><div><a href="#how">How it works</a><a href="#install">Install</a><Link className="nav-cta" href="/lab-broken">Open test lab</Link></div></nav>
    <section className="hero wrap">
      <div className="hero-copy"><span className="kicker"><i /> Codex plugin · local-first</span><h1>Fix once.<br/><em>Work everywhere.</em></h1><p>Find the barriers your happy path misses. Codex tests explicit routes in real global conditions, repairs your React app, and proves every fix with the same deterministic checks.</p><div className="hero-actions"><a className="button primary" href="#install">Install the plugin <span>↗</span></a><Link className="button ghost" href="/lab-broken">Audit the broken demo</Link></div><div className="trust"><span>No API key</span><span>No source upload</span><span>No rebuild for judges</span></div></div>
      <div className="hero-product"><Passport /></div>
    </section>
    <section className="problem"><div className="wrap stat-row"><div><strong>4×</strong><span>global conditions<br/>across up to 10 routes</span></div><p>Most QA validates one page, one language, one direction, and one fast connection. That is not the world your product ships into.</p><blockquote>“Accessibility and localization should not be a checklist after launch. They should be a repair loop inside the developer workflow.”</blockquote></div></section>
    <section id="how" className="how wrap"><span className="section-no">01 / The loop</span><div className="section-title"><h2>Evidence in.<br/>Verified patches out.</h2><p>The scanner stays deterministic. GPT‑5.6 does what it is uniquely good at: understanding the repository, choosing the smallest safe repair, and validating the result.</p></div><div className="steps">
      <article><b>01</b><div className="step-icon">◎</div><h3>Test the world</h3><p>Run Chromium across keyboard access, RTL, expanded copy, and constrained mobile on the routes you choose.</p><code>everywhere audit --config …</code></article>
      <article><b>02</b><div className="step-icon">⌁</div><h3>Repair the source</h3><p>Codex reads the evidence ledger, locates the React source, and applies scoped, reviewable fixes.</p><code>Audit and fix this app…</code></article>
      <article><b>03</b><div className="step-icon">✓</div><h3>Prove the delta</h3><p>See matched before/after screenshots, then gate a release if the score drops or serious barriers appear.</p><code>everywhere verify --gate regression</code></article>
    </div></section>
    <section className="contexts"><div className="wrap"><span className="section-no">02 / Test matrix</span><h2>Four views of every route.</h2><div className="context-grid"><article><span>⌨</span><h3>Keyboard + assistive tech</h3><p>axe-core evidence, focus traversal, labels, semantics, and visible controls.</p></article><article className="arabic"><span>ع</span><h3>RTL mobile</h3><p>Direction, overflow, clipped interactions, and logical layout in a configurable locale.</p></article><article><span>↔</span><h3>Text expansion</h3><p>Pseudo-localized copy exposes fixed widths and labels that cannot breathe.</p></article><article><span>3G</span><h3>Constrained mobile</h3><p>Configurable locale, timezone, network latency, failed requests, and runtime errors.</p></article></div></div></section>
    <section id="install" className="install wrap"><div><span className="section-no">03 / Try it</span><h2>Your next users<br/>are already everywhere.</h2><p>Install the public Git marketplace and pinned npm runtime. No repository clone or local build is required.</p></div><div className="terminal"><div><span/><span/><span/><b>PowerShell / shell</b></div><pre>{install}</pre><p><span>$</span> Audit and fix this app for users everywhere: http://localhost:3000</p></div></section>
    <footer><div className="wrap"><div className="brand"><BrandMark />Everywhere QA</div><p>Automated evidence is incomplete. Not a certification, legal opinion, or translation assessment.</p><span>Built with Codex + GPT‑5.6 · 2026</span></div></footer>
  </main>;
}
