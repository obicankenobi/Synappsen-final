import { describe, it, expect } from "vitest";
import { aktivaFeatures, FEATURE, PACKAGE_FEATURES } from "./features";

describe("aktivaFeatures", () => {
  it("ger en tom mängd utan moduler-fält (fail closed, inte fail open)", () => {
    expect(aktivaFeatures(undefined).size).toBe(0);
  });

  it("ger en tom mängd när alla moduler är avstängda", () => {
    const features = aktivaFeatures({ operations: false, intelligence: false });
    expect(features.size).toBe(0);
  });

  it("aktiverar bara Operations-funktioner när endast operations är påslagen", () => {
    const features = aktivaFeatures({ operations: true, intelligence: false });
    for (const f of PACKAGE_FEATURES.operations) {
      expect(features.has(f)).toBe(true);
    }
    for (const f of PACKAGE_FEATURES.intelligence) {
      expect(features.has(f)).toBe(false);
    }
  });

  it("aktiverar bara Intelligence-funktioner när endast intelligence är påslagen", () => {
    const features = aktivaFeatures({ intelligence: true });
    expect(features.has(FEATURE.AI_IMPORT)).toBe(true);
    expect(features.has(FEATURE.CLINICAL_SUPPORT)).toBe(true);
    expect(features.has(FEATURE.OFFLINE_CENTER)).toBe(false);
  });

  it("aktiverar båda paketens funktioner när båda är påslagna", () => {
    const features = aktivaFeatures({ operations: true, intelligence: true });
    expect(features.has(FEATURE.OFFLINE_CENTER)).toBe(true);
    expect(features.has(FEATURE.AI_IMPORT)).toBe(true);
  });

  it("ignorerar okända modulnamn istället för att krascha", () => {
    const features = aktivaFeatures({ paketSomInteFinns: true });
    expect(features.size).toBe(0);
  });
});
