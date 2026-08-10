import { describe, it, expect } from "vitest";
import { harledStegStatus, STANDARD_TAK_ORE } from "./valkomstchecklista";

const TOM = { anvandare: [], egetUid: "mig", rutiner: [], orgData: {}, budgetData: null };

describe("harledStegStatus", () => {
  it("allt av som förval för en helt tom, nyetablerad organisation", () => {
    const steg = harledStegStatus(TOM);
    expect(steg).toEqual({
      bjud_in_kollegor: false,
      satt_roller: false,
      importera_rutiner: false,
      aktivera_2fa_policy: false,
      satt_gemini_budget: false,
    });
  });

  it("bjud_in_kollegor kräver FLER än en själv, inte bara ett skickat inbjudan", () => {
    expect(harledStegStatus({ ...TOM, anvandare: [{ id: "mig", role: "superadmin" }] }).bjud_in_kollegor).toBe(false);
    expect(
      harledStegStatus({ ...TOM, anvandare: [{ id: "mig", role: "superadmin" }, { id: "kollega", role: "personal" }] })
        .bjud_in_kollegor
    ).toBe(true);
  });

  it("satt_roller kräver att NÅGON ANNAN än en själv har en roll skild från 'personal'", () => {
    const migSjalvSuperadmin = [{ id: "mig", role: "superadmin" }, { id: "kollega", role: "personal" }];
    expect(harledStegStatus({ ...TOM, anvandare: migSjalvSuperadmin }).satt_roller).toBe(false);

    const kollegaMedRoll = [{ id: "mig", role: "superadmin" }, { id: "kollega", role: "vec" }];
    expect(harledStegStatus({ ...TOM, anvandare: kollegaMedRoll }).satt_roller).toBe(true);
  });

  it("importera_rutiner ignorerar startbibliotekets seedade mallar (kalla: 'verksamhetsmall')", () => {
    const baraMallar = [{ kalla: "verksamhetsmall" }, { kalla: "verksamhetsmall" }];
    expect(harledStegStatus({ ...TOM, rutiner: baraMallar }).importera_rutiner).toBe(false);

    const enRiktigImport = [{ kalla: "verksamhetsmall" }, { titel: "En riktig rutin" }];
    expect(harledStegStatus({ ...TOM, rutiner: enRiktigImport }).importera_rutiner).toBe(true);
  });

  it("aktivera_2fa_policy avgörs av att fältet sakerhet EXISTERAR, oavsett innehåll", () => {
    expect(harledStegStatus({ ...TOM, orgData: {} }).aktivera_2fa_policy).toBe(false);
    expect(harledStegStatus({ ...TOM, orgData: { sakerhet: { kravMfaForRoller: [] } } }).aktivera_2fa_policy).toBe(
      true
    );
    // Ett medvetet beslut att INTE kräva 2FA för någon roll räknas ändå som en tagen ställning.
    expect(harledStegStatus({ ...TOM, orgData: { sakerhet: { kravMfaForRoller: [] } } }).aktivera_2fa_policy).toBe(
      true
    );
  });

  it("satt_gemini_budget kräver en avvikelse FRÅN standardvärdet, inte bara att dokumentet finns", () => {
    expect(harledStegStatus({ ...TOM, budgetData: { taketOre: STANDARD_TAK_ORE } }).satt_gemini_budget).toBe(false);
    expect(harledStegStatus({ ...TOM, budgetData: { taketOre: STANDARD_TAK_ORE + 5000 } }).satt_gemini_budget).toBe(
      true
    );
    expect(harledStegStatus({ ...TOM, budgetData: null }).satt_gemini_budget).toBe(false);
  });
});
