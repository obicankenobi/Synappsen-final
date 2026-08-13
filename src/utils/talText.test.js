import { describe, it, expect } from "vitest";
import { talText } from "./talText";

describe("talText", () => {
  it("tar bort rubriksyntax", () => {
    expect(talText("## Rubrik\nText")).toBe("Rubrik Text");
  });

  it("tar bort fetstil och kursiv", () => {
    expect(talText("**Viktigt:** gör *inte* så här")).toBe("Viktigt: gör inte så här");
  });

  it("ersätter en länk med bara länktexten", () => {
    expect(talText("Se [källan](https://example.com) för mer info")).toBe(
      "Se källan för mer info"
    );
  });

  it("tar bort punktlistemarkörer och citattecken", () => {
    expect(talText("- Första\n- Andra\n> Ett citat")).toBe("Första Andra Ett citat");
  });

  it("tar bort emoji", () => {
    expect(talText("Kolla akutläget 🚨 nu")).toBe("Kolla akutläget nu");
  });

  it("normaliserar whitespace och trimmar", () => {
    expect(talText("  Rad ett\n\n\nRad två  ")).toBe("Rad ett Rad två");
  });

  it("hanterar tomt/saknat innehåll utan att krascha", () => {
    expect(talText("")).toBe("");
    expect(talText(undefined)).toBe("");
    expect(talText(null)).toBe("");
  });
});
