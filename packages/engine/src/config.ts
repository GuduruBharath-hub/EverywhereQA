import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { AuditProfiles, ResolvedAuditConfig, Viewport } from "./types.js";

type UnknownRecord = Record<string, unknown>;

export interface AuditConfigFile {
  routes?: Array<{ id: string; path: string }>;
  profiles?: {
    accessibility?: { locale?: string; viewport?: Partial<Viewport> };
    rtl?: { locale?: string; timezoneId?: string; viewport?: Partial<Viewport> };
    textExpansion?: { locale?: string; viewport?: Partial<Viewport>; ratio?: number };
    resilience?: {
      locale?: string;
      timezoneId?: string;
      viewport?: Partial<Viewport>;
      network?: { latencyMs?: number; downloadKbps?: number; uploadKbps?: number };
    };
  };
}

export const DEFAULT_PROFILES: AuditProfiles = {
  accessibility: { locale: "en-US", viewport: { width: 1440, height: 900 } },
  rtl: { locale: "ar-SA", timezoneId: "Asia/Riyadh", viewport: { width: 390, height: 844 } },
  textExpansion: { locale: "en-XA", viewport: { width: 390, height: 844 }, ratio: 0.4 },
  resilience: {
    locale: "hi-IN",
    timezoneId: "Asia/Kolkata",
    viewport: { width: 390, height: 844 },
    network: { latencyMs: 250, downloadKbps: 768, uploadKbps: 384 }
  }
};

function object(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as UnknownRecord;
}

function optionalString(value: unknown, fallback: string, label: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function boundedNumber(value: unknown, fallback: number, label: string, minimum: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function viewport(value: unknown, fallback: Viewport, label: string): Viewport {
  if (value === undefined) return { ...fallback };
  const parsed = object(value, label);
  return {
    width: boundedNumber(parsed.width, fallback.width, `${label}.width`, 240, 3840),
    height: boundedNumber(parsed.height, fallback.height, `${label}.height`, 240, 3840)
  };
}

function resolveProfiles(value: unknown): AuditProfiles {
  if (value === undefined) return structuredClone(DEFAULT_PROFILES);
  const profiles = object(value, "profiles");
  const access = profiles.accessibility === undefined ? {} : object(profiles.accessibility, "profiles.accessibility");
  const rtl = profiles.rtl === undefined ? {} : object(profiles.rtl, "profiles.rtl");
  const expansion = profiles.textExpansion === undefined ? {} : object(profiles.textExpansion, "profiles.textExpansion");
  const resilience = profiles.resilience === undefined ? {} : object(profiles.resilience, "profiles.resilience");
  const network = resilience.network === undefined ? {} : object(resilience.network, "profiles.resilience.network");
  return {
    accessibility: {
      locale: optionalString(access.locale, DEFAULT_PROFILES.accessibility.locale, "profiles.accessibility.locale"),
      viewport: viewport(access.viewport, DEFAULT_PROFILES.accessibility.viewport, "profiles.accessibility.viewport")
    },
    rtl: {
      locale: optionalString(rtl.locale, DEFAULT_PROFILES.rtl.locale, "profiles.rtl.locale"),
      timezoneId: optionalString(rtl.timezoneId, DEFAULT_PROFILES.rtl.timezoneId, "profiles.rtl.timezoneId"),
      viewport: viewport(rtl.viewport, DEFAULT_PROFILES.rtl.viewport, "profiles.rtl.viewport")
    },
    textExpansion: {
      locale: optionalString(expansion.locale, DEFAULT_PROFILES.textExpansion.locale, "profiles.textExpansion.locale"),
      viewport: viewport(expansion.viewport, DEFAULT_PROFILES.textExpansion.viewport, "profiles.textExpansion.viewport"),
      ratio: boundedNumber(expansion.ratio, DEFAULT_PROFILES.textExpansion.ratio, "profiles.textExpansion.ratio", 0.1, 1)
    },
    resilience: {
      locale: optionalString(resilience.locale, DEFAULT_PROFILES.resilience.locale, "profiles.resilience.locale"),
      timezoneId: optionalString(resilience.timezoneId, DEFAULT_PROFILES.resilience.timezoneId, "profiles.resilience.timezoneId"),
      viewport: viewport(resilience.viewport, DEFAULT_PROFILES.resilience.viewport, "profiles.resilience.viewport"),
      network: {
        latencyMs: boundedNumber(network.latencyMs, DEFAULT_PROFILES.resilience.network.latencyMs, "profiles.resilience.network.latencyMs", 0, 60_000),
        downloadKbps: boundedNumber(network.downloadKbps, DEFAULT_PROFILES.resilience.network.downloadKbps, "profiles.resilience.network.downloadKbps", 1, 1_000_000),
        uploadKbps: boundedNumber(network.uploadKbps, DEFAULT_PROFILES.resilience.network.uploadKbps, "profiles.resilience.network.uploadKbps", 1, 1_000_000)
      }
    }
  };
}

export async function readAuditConfig(path: string): Promise<AuditConfigFile> {
  try {
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    return object(value, "Everywhere QA config") as AuditConfigFile;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Config at ${path} is not valid JSON: ${error.message}`);
    if (error instanceof Error && error.message.startsWith("Everywhere QA config")) throw error;
    throw new Error(`Unable to read config at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function resolveAuditConfig(baseUrl: string, raw?: AuditConfigFile): ResolvedAuditConfig {
  const base = new URL(baseUrl);
  const configuredRoutes = raw?.routes;
  if (configuredRoutes !== undefined && !Array.isArray(configuredRoutes)) throw new Error("routes must be an array.");
  if (configuredRoutes && (configuredRoutes.length < 1 || configuredRoutes.length > 10)) throw new Error("routes must contain between 1 and 10 entries.");
  const seen = new Set<string>();
  const pages = configuredRoutes?.map((route, index) => {
    const value = object(route, `routes[${index}]`);
    const id = optionalString(value.id, "", `routes[${index}].id`);
    const path = optionalString(value.path, "", `routes[${index}].path`);
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) throw new Error(`routes[${index}].id must use lowercase letters, numbers, and hyphens.`);
    if (seen.has(id)) throw new Error(`Route id "${id}" is duplicated.`);
    seen.add(id);
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error(`routes[${index}].path must be a same-origin path beginning with one slash.`);
    const url = new URL(path, base);
    if (url.origin !== base.origin) throw new Error(`routes[${index}].path must stay on ${base.origin}.`);
    return { id, url: url.href };
  }) ?? [{ id: "target", url: base.href }];
  const profiles = resolveProfiles(raw?.profiles);
  const profileSignature = createHash("sha256").update(JSON.stringify(profiles)).digest("hex").slice(0, 16);
  return { pages, profiles, profileSignature, isDefault: raw === undefined };
}
