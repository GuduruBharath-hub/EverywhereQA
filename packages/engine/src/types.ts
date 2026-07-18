export type Pillar = "accessibility" | "rtl" | "locale" | "resilience";
export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Confidence = "deterministic" | "heuristic";

export interface ScenarioResult {
  id: string;
  label: string;
  locale: string;
  viewport: { width: number; height: number };
  durationMs: number;
  screenshot: string;
  status: "passed" | "completed-with-findings";
}

export interface Finding {
  id: string;
  ruleId: string;
  pillar: Pillar;
  severity: Severity;
  scenario: string;
  selector: string;
  message: string;
  evidence: string;
  confidence: Confidence;
  remediation: string;
  helpUrl?: string;
}

export interface Scores {
  overall: number;
  accessibility: number;
  rtl: number;
  locale: number;
  resilience: number;
}

export interface VerificationDelta {
  baselineRunId: string;
  fixed: Finding[];
  remaining: Finding[];
  introduced: Finding[];
  scoreChange: number;
}

export interface AuditReport {
  schemaVersion: "1.0";
  runId: string;
  target: { url: string; repo?: string };
  generatedAt: string;
  tools: { everywhereQa: string; playwright: string; axeCore: string };
  scenarios: ScenarioResult[];
  findings: Finding[];
  advisories: Finding[];
  scores: Scores;
  summary: { deterministic: number; advisory: number; critical: number };
  verification?: VerificationDelta;
  disclaimer: string;
}

export interface AuditOptions {
  url: string;
  repo?: string;
  outDir: string;
  timeoutMs?: number;
  baseline?: AuditReport;
}
