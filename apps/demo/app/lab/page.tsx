import { FixedBooking } from "../../components/fixed-booking";
import styles from "./fixed.module.css";

export default function VerifiedLab() {
  return <main className="lab-page">
    <header className="lab-header"><a href="/">← Everywhere QA</a><span>Verified repair fixture</span></header>
    <section className="lab-hero"><div><span className="lab-pill">Weekend escape</span><h1>Plan less.<br/>Go farther.</h1><p>The same booking card after scoped, repository-aware repairs.</p><button className={`${styles.promo} promo-chip`}>Book now</button></div><img alt="Layered mountain landscape at sunset" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='440'%3E%3Crect width='640' height='440' fill='%23e78668'/%3E%3Ccircle cx='420' cy='120' r='70' fill='%23f5d890'/%3E%3Cpath d='M0 400L180 190L290 310L410 150L640 400Z' fill='%232b4b42'/%3E%3C/svg%3E" /></section>
    <FixedBooking />
    <section className={`${styles.notes} lab-notes`}><h2>Verified repairs</h2><div><article><b>01</b><p>Visible labels are now semantic labels for both inputs.</p></article><article><b>02</b><p>Fluid grids and logical borders adapt to mobile and RTL layouts.</p></article><article><b>03</b><p>Dates and currency use the visitor&apos;s browser locale.</p></article></div></section>
  </main>;
}
