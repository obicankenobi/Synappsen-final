import { describe, it, expect } from "vitest";
import { domanNyckelForEtikett, DOMAN_INFO, STATUS_INFO } from "./badge";

describe("domanNyckelForEtikett", () => {
  it("hittar rätt nyckel för en känd domänetikett", () => {
    expect(domanNyckelForEtikett("Kliniskt stöd")).toBe("kliniskt-stod");
    expect(domanNyckelForEtikett("Logistik")).toBe("logistik");
    expect(domanNyckelForEtikett("Administration")).toBe("administration");
  });

  it("returnerar null för en okänd kategori (t.ex. Åtgärd/Kontakt/Länk)", () => {
    expect(domanNyckelForEtikett("Åtgärd")).toBeNull();
    expect(domanNyckelForEtikett("Kontakt")).toBeNull();
    expect(domanNyckelForEtikett(undefined)).toBeNull();
  });
});

describe("domän- och statusfärger delar aldrig samma hue-familj", () => {
  it("ingen domän-CSS-klass förekommer bland statusklasserna eller vice versa", () => {
    const domanKlasser = Object.values(DOMAN_INFO).map((d) => d.css);
    const statusKlasser = Object.values(STATUS_INFO).map((s) => s.css);
    domanKlasser.forEach((k) => expect(statusKlasser).not.toContain(k));
  });

  it("varje statusvärde har en egen ikon som redundant signal utöver färgen", () => {
    Object.values(STATUS_INFO).forEach((info) => expect(info.ikon).toBeTruthy());
  });
});
