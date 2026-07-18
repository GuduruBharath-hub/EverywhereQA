import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Everywhere QA — Fix once. Work everywhere.",
  description: "A Codex plugin that audits, fixes, and verifies global web readiness."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body>{children}</body></html>;
}
