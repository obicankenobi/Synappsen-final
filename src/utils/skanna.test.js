// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { tolkaSkannadLank } from "./skanna";

describe("tolkaSkannadLank", () => {
  it("returnerar sökvägen för en länk från appens egen origin", () => {
    const lank = `${window.location.origin}/logistik/sterilforradet?skap=A&hylla=3#artikel-xyz`;
    expect(tolkaSkannadLank(lank)).toBe("/logistik/sterilforradet?skap=A&hylla=3#artikel-xyz");
  });

  it("avvisar en länk från en annan origin (öppen redirect-risk)", () => {
    expect(tolkaSkannadLank("https://exempel-annan-sajt.test/logistik")).toBeNull();
  });

  it("avvisar text som inte är en giltig URL (t.ex. en produktstreckkod)", () => {
    expect(tolkaSkannadLank("7350012345678")).toBeNull();
  });

  it("avvisar tom text", () => {
    expect(tolkaSkannadLank("")).toBeNull();
    expect(tolkaSkannadLank(null)).toBeNull();
  });
});
