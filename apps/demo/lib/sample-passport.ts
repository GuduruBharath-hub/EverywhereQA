export type SampleFinding = { severity: "serious" | "moderate" | "minor"; title: string; selector: string; scenario: string; status: "fixed" | "open" };

export const scenarios = [
  { id: "access", flag: "⌨", name: "Access", detail: "Keyboard + axe", before: 48, after: 100 },
  { id: "rtl", flag: "ع", name: "RTL + expansion", detail: "Arabic + 40%", before: 43, after: 100 },
  { id: "expand", flag: "IN", name: "Locale", detail: "hi-IN formatting", before: 100, after: 100 },
  { id: "network", flag: "3G", name: "Resilience", detail: "India mobile", before: 93, after: 100 }
] as const;

export const findings: SampleFinding[] = [
  { severity: "serious", title: "Form control has no accessible label", selector: "#destination", scenario: "Keyboard + axe", status: "fixed" },
  { severity: "serious", title: "Checkout card leaves the RTL viewport", selector: "[data-testid=booking-card]", scenario: "Arabic mobile", status: "fixed" },
  { severity: "moderate", title: "Expanded action label clips", selector: "button.primary", scenario: "+40% labels", status: "fixed" },
  { severity: "minor", title: "Document direction is not declared", selector: "html", scenario: "Arabic mobile", status: "open" }
];
