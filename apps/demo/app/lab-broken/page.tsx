import navStyles from "../fixture-nav.module.css";

export default function BrokenLab() {
  const rawPrice = "$1,299";
  const rawDate = "07/21/2026";
  return <main className="lab-page">
    <header className={`${navStyles.header} lab-header`}><a href="/">← Everywhere QA</a><span>Intentionally broken fixture</span><a className={navStyles.switch} href="/lab">View repaired →</a></header>
    <section className="lab-hero"><div><span className="lab-pill">Weekend escape</span><h1>Plan less.<br/>Go farther.</h1><p>A deliberately flawed booking card for the audit-and-fix demo.</p><button className="promo-chip">Book now</button></div><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='440'%3E%3Crect width='640' height='440' fill='%23e78668'/%3E%3Ccircle cx='420' cy='120' r='70' fill='%23f5d890'/%3E%3Cpath d='M0 400L180 190L290 310L410 150L640 400Z' fill='%232b4b42'/%3E%3C/svg%3E" /></section>
    <img className="slow-probe" src="/api/slow-asset" alt="" />
    <section className="booking-card" data-testid="booking-card"><div><span>Destination</span><input id="destination" placeholder="Where to?" /></div><div><span>Departure</span><input value={rawDate} readOnly /></div><div className="price"><small>From</small><strong>{rawPrice}</strong></div><button className="book-button">See available adventures right now</button></section>
    <section className="lab-notes"><h2>Known barriers</h2><div><article><b>01</b><p>Inputs use visual text instead of programmatic labels.</p></article><article><b>02</b><p>The booking card is fixed-width and overflows mobile and RTL layouts.</p></article><article><b>03</b><p>Date and currency values assume a single locale.</p></article></div></section>
  </main>;
}
