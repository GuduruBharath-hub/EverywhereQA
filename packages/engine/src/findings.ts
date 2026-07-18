import { createHash } from "node:crypto";
import type { Confidence, Finding, Pillar, Severity } from "./types.js";

export interface FindingInput {
  ruleId: string;
  pillar: Pillar;
  severity: Severity;
  scenario: string;
  selector?: string;
  message: string;
  evidence: string;
  confidence?: Confidence;
  remediation: string;
  helpUrl?: string;
}

export function finding(input: FindingInput): Finding {
  const selector = input.selector ?? "document";
  const signature = [input.ruleId, input.scenario, selector, input.message].join("|");
  const id = createHash("sha1").update(signature).digest("hex").slice(0, 12);
  return {
    id,
    ruleId: input.ruleId,
    pillar: input.pillar,
    severity: input.severity,
    scenario: input.scenario,
    selector,
    message: input.message,
    evidence: input.evidence,
    confidence: input.confidence ?? "deterministic",
    remediation: input.remediation,
    ...(input.helpUrl ? { helpUrl: input.helpUrl } : {})
  };
}

export function dedupeFindings(findings: Finding[]): Finding[] {
  const byId = new Map<string, Finding>();
  for (const item of findings) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => {
    const rank: Record<Severity, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    return rank[a.severity] - rank[b.severity] || a.ruleId.localeCompare(b.ruleId);
  });
}

export function stableSignature(item: Finding): string {
  return [item.ruleId, item.scenario, item.selector].join("|");
}
