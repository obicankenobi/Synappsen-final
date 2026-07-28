import { describe, it, expect } from "vitest";
import { formateraDatum } from "./datum";

function fakeTimestamp(iso) {
  return { toDate: () => new Date(iso) };
}

describe("formateraDatum", () => {
  it("formaterar en Firestore-timestamp konsekvent (dag, förkortad månad, år)", () => {
    expect(formateraDatum(fakeTimestamp("2026-07-24T12:00:00Z"))).toBe("24 juli 2026");
  });

  it("hanterar även ett vanligt Date-objekt (samma format, oavsett källa)", () => {
    expect(formateraDatum(new Date("2026-01-05T12:00:00Z"))).toBe("5 jan. 2026");
  });

  it("returnerar tom sträng för null/undefined istället för att kasta", () => {
    expect(formateraDatum(null)).toBe("");
    expect(formateraDatum(undefined)).toBe("");
  });
});
