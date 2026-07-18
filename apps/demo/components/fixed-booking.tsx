"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../app/lab/fixed.module.css";

export function FixedBooking() {
  const [locale, setLocale] = useState("en-US");
  useEffect(() => {
    const browserLocale = navigator.language || "en-US";
    const html = document.documentElement;
    const previous = { lang: html.lang, dir: html.dir };
    setLocale(browserLocale);
    html.lang = browserLocale;
    html.dir = /^(ar|fa|he|ur)(-|$)/i.test(browserLocale) ? "rtl" : "ltr";
    return () => {
      html.lang = previous.lang;
      html.dir = previous.dir;
    };
  }, []);
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date("2026-07-21T00:00:00Z")), [locale]);
  const price = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(1299), [locale]);

  return <section className={`${styles.bookingCard} booking-card`} data-testid="booking-card">
    <label><span>Destination</span><input id="destination" placeholder="Where to?" /></label>
    <label><span>Departure</span><input value={date} readOnly /></label>
    <div className="price"><small>From</small><strong>{price}</strong></div>
    <button className={`${styles.bookButton} book-button`}>See available adventures right now</button>
  </section>;
}
