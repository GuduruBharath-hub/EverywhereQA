import { describe, expect, it } from "vitest";
import { pseudoLocalize } from "./pseudo.js";

describe("pseudoLocalize", () => {
  it("accents and expands visible text", () => {
    const result = pseudoLocalize("Hello world");
    expect(result).toContain("[Ħéľľó ŵóřľđ");
    expect(result.length).toBeGreaterThan("Hello world".length * 1.3);
  });

  it("preserves empty whitespace", () => {
    expect(pseudoLocalize("   ")).toBe("   ");
  });
});
