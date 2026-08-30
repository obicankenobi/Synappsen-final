import { describe, it, expect } from "vitest";
import { genereraSparklinePath } from "./sparkline";

describe("genereraSparklinePath", () => {
  it("returnerar null för en tom lista", () => {
    expect(genereraSparklinePath([])).toBeNull();
  });

  it("returnerar null om alla värden saknas (null)", () => {
    expect(genereraSparklinePath([null, null, null])).toBeNull();
  });

  it("hoppar över null-punkter men ritar resten", () => {
    const path = genereraSparklinePath([1, null, 3]);
    expect(path).not.toBeNull();
    // Två giltiga punkter (index 0 och 2) ska ge en path med en "L" (två koordinater ihopkopplade)
    expect(path.split("L")).toHaveLength(2);
  });

  it("ritar en enda punkt utan att krascha", () => {
    const path = genereraSparklinePath([5]);
    expect(path).toMatch(/^M[\d.]+,[\d.]+$/);
  });

  it("en konstant serie ger en rak linje (ingen division med noll)", () => {
    const path = genereraSparklinePath([10, 10, 10]);
    expect(path).not.toBeNull();
    expect(path).not.toMatch(/NaN/);
  });

  it("stigande serie: y minskar när x ökar (SVG-y växer neråt)", () => {
    const path = genereraSparklinePath([1, 5, 10], { bredd: 100, hojd: 40 });
    const punkter = path
      .replace("M", "")
      .split(" L")
      .map((p) => p.split(",").map(Number));
    expect(punkter[0][1]).toBeGreaterThan(punkter[2][1]);
  });

  it("respekterar angiven bredd/höjd/marginal", () => {
    const path = genereraSparklinePath([0, 100], { bredd: 50, hojd: 20, marginal: 2 });
    const [, sista] = path.replace("M", "").split(" L");
    const [x] = sista.split(",").map(Number);
    expect(x).toBeCloseTo(48, 0);
  });
});
