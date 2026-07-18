const accented: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "đ", e: "é", f: "ƒ", g: "ğ", h: "ħ", i: "í", j: "ĵ",
  k: "ķ", l: "ľ", m: "ɱ", n: "ñ", o: "ó", p: "þ", q: "ɋ", r: "ř", s: "š", t: "ŧ",
  u: "ú", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž"
};

export function pseudoLocalize(input: string, expansion = 0.4): string {
  if (!input.trim()) return input;
  const transformed = [...input].map((char) => {
    const lower = char.toLowerCase();
    const replacement = accented[lower];
    if (!replacement) return char;
    return char === lower ? replacement : replacement.toUpperCase();
  }).join("");
  const words = input.trim().split(/\s+/).filter(Boolean);
  const padLength = Math.max(1, Math.ceil(input.length * expansion));
  const pad = "~".repeat(padLength + Math.max(0, words.length - 1));
  return `[${transformed} ${pad}]`;
}
