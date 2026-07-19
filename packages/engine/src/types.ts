export type Pillar = "accessibility" | "rtl" | "locale" | "resilience";
export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Confidence = "deterministic" | "heuristic";
export type ScenarioKind = "accessibility" | "rtl" | "text-expansion" | "resilience";
export type GatePolicy = "off" | "regression";

export interface Viewport {
  width: number;
  height: number;
}

export interface NetworkProfile {
  latencyMs: number;
  downloadKbps: number;
  uploadKbps: number;
}

export interface AuditProfiles {
  accessibility: { locale: string; viewport: Viewport };
  rtl: { locale: string; timezoneId: string; viewport: Viewport };
  textExpansion: { locale: string; viewport: Viewport; ratio: number };
  resilience: { locale: string; timezoneId: string; viewport: Viewport; network: NetworkProfile };
}

export interface AuditPage {
  id: string;
  url: string;
}

export interface ResolvedAuditConfig {
  pages: AuditPage[];
  profiles: AuditProfiles;
  profileSignature: string;
  isDefault: boolean;
}

export interface ScenarioResult {
  id: string;
  kind: ScenarioKind;
  label: string;
  pageId: string;
  pageUrl: string;
  locale: string;
  viewport: Viewport;
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
  pageId?: string;
  pageUrl?: string;
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

export interface PageScores {
  pageId: string;
  pageUrl: string;
  scores: Scores;
}

export interface VisualComparison {
  scenarioId: string;
  kind: ScenarioKind;
  pageId: string;
  label: string;
  beforeScreenshot: string;
  afterScreenshot: string;
}

export interface GateResult {
  policy: GatePolicy;
  status: "passed" | "failed" | "not-run";
  reasons: string[];
}

export interface VerificationDelta {
  baselineRunId: string;
  fixed: Finding[];
  remaining: Finding[];
  introduced: Finding[];
  scoreChange: number;
  visualComparisons: VisualComparison[];
  gate: GateResult;
}

export interface AuditReport {
  schemaVersion: "1.1";
  runId: string;
  target: { url: string; repo?: string; pages: AuditPage[]; profileSignature: string };
  generatedAt: string;
  tools: { everywhereQa: string; playwright: string; axeCore: string };
  scenarios: ScenarioResult[];
  findings: Finding[];
  advisories: Finding[];
  scores: Scores;
  pageScores: PageScores[];
  summary: { deterministic: number; advisory: number; critical: number };
  verification?: VerificationDelta;
  disclaimer: string;
}

export interface AuditOptions {
  url: string;
  repo?: string;
  outDir: string;
  timeoutMs?: number;
  config: ResolvedAuditConfig;
  baseline?: AuditReport;
  baselineDir?: string;
  gatePolicy?: GatePolicy;
}
