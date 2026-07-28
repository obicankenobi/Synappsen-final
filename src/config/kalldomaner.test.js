import { describe, it, expect } from "vitest";
import { domanGodkand } from "./kalldomaner";

describe("domanGodkand", () => {
  it("är sant för en godkänd domän", () => {
    expect(domanGodkand("https://www.internetmedicin.se/artikel/123")).toBe(true);
  });

  it("är sant för en godkänd domän utan www", () => {
    expect(domanGodkand("https://1177.se/sjukdomar")).toBe(true);
  });

  it("är falskt för en icke-godkänd domän", () => {
    expect(domanGodkand("https://www.example.com")).toBe(false);
  });

  it("är falskt för en domän som bara liknar en godkänd (försöker lura suffix-kontrollen)", () => {
    expect(domanGodkand("https://notinternetmedicin.se")).toBe(false);
  });

  it("är falskt för en ogiltig URL", () => {
    expect(domanGodkand("inte-en-url")).toBe(false);
  });
});
