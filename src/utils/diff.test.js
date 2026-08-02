import { describe, it, expect } from "vitest";
import { diffRader } from "./diff";

describe("diffRader", () => {
  it("markerar identiska rader som 'lika'", () => {
    const rader = diffRader("a\nb\nc", "a\nb\nc");
    expect(rader.every((r) => r.typ === "lika")).toBe(true);
  });

  it("markerar en tillagd rad", () => {
    const rader = diffRader("a\nb", "a\nb\nc");
    expect(rader[rader.length - 1]).toEqual({ typ: "tillagd", text: "c" });
  });

  it("markerar en borttagen rad", () => {
    const rader = diffRader("a\nb\nc", "a\nc");
    const borttagna = rader.filter((r) => r.typ === "borttagen");
    expect(borttagna).toEqual([{ typ: "borttagen", text: "b" }]);
  });

  it("hanterar tomma strängar utan att kasta", () => {
    expect(diffRader("", "")).toEqual([{ typ: "lika", text: "" }]);
    expect(diffRader(undefined, undefined)).toEqual([{ typ: "lika", text: "" }]);
  });
});
