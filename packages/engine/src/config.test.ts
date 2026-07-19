import { describe, expect, it } from "vitest";
import { resolveAuditConfig } from "./config.js";

describe("audit configuration", () => {
  it("preserves the exact target URL without a config", () => {
    const config = resolveAuditConfig("https://example.com/lab?mode=broken");
    expect(config.pages).toEqual([{ id: "target", url: "https://example.com/lab?mode=broken" }]);
    expect(config.profiles.textExpansion.ratio).toBe(0.4);
    expect(config.isDefault).toBe(true);
  });

  it("resolves same-origin routes and merges profile overrides", () => {
    const config = resolveAuditConfig("https://example.com/base", {
      routes: [{ id: "home", path: "/" }, { id: "checkout", path: "/checkout?step=2" }],
      profiles: { rtl: { locale: "he-IL", viewport: { width: 412 } }, resilience: { network: { latencyMs: 500 } } }
    });
    expect(config.pages).toEqual([
      { id: "home", url: "https://example.com/" },
      { id: "checkout", url: "https://example.com/checkout?step=2" }
    ]);
    expect(config.profiles.rtl).toMatchObject({ locale: "he-IL", viewport: { width: 412, height: 844 } });
    expect(config.profiles.resilience.network).toMatchObject({ latencyMs: 500, downloadKbps: 768 });
  });

  it("rejects unsafe, duplicate, and excessive routes", () => {
    expect(() => resolveAuditConfig("https://example.com", { routes: [{ id: "other", path: "//other.example/path" }] })).toThrow("same-origin");
    expect(() => resolveAuditConfig("https://example.com", { routes: [{ id: "same", path: "/one" }, { id: "same", path: "/two" }] })).toThrow("duplicated");
    expect(() => resolveAuditConfig("https://example.com", { routes: Array.from({ length: 11 }, (_, index) => ({ id: `page-${index}`, path: `/${index}` })) })).toThrow("between 1 and 10");
  });
});
