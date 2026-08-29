import { describe, it, expect } from "vitest";
import { fristTimmar, berakDeadline, berakAterstaende } from "./incidentklocka";

const KANNEDOM = "2026-08-29T12:00:00.000Z";

describe("fristTimmar", () => {
  it("72 timmar för en organisation som inte omfattas av NIS2", () => {
    expect(fristTimmar(false)).toBe(72);
  });
  it("24 timmar för en organisation som omfattas av NIS2 (JURIDISK-GRANSKNING.md risk 15)", () => {
    expect(fristTimmar(true)).toBe(24);
  });
});

describe("berakDeadline", () => {
  it("lägger på 72 timmar för en icke-NIS2-organisation", () => {
    expect(berakDeadline(KANNEDOM, false).toISOString()).toBe("2026-09-01T12:00:00.000Z");
  });
  it("lägger på 24 timmar för en NIS2-organisation", () => {
    expect(berakDeadline(KANNEDOM, true).toISOString()).toBe("2026-08-30T12:00:00.000Z");
  });
});

describe("berakAterstaende", () => {
  it("inte förfallen strax innan deadline", () => {
    const nu = new Date("2026-09-01T11:59:00.000Z");
    const resultat = berakAterstaende(KANNEDOM, false, nu);
    expect(resultat.forfallen).toBe(false);
    expect(resultat.timmarKvar).toBeCloseTo(1 / 60, 5);
  });

  it("förfallen exakt vid deadline och därefter", () => {
    expect(berakAterstaende(KANNEDOM, false, new Date("2026-09-01T12:00:00.000Z")).forfallen).toBe(true);
    expect(berakAterstaende(KANNEDOM, false, new Date("2026-09-01T13:00:00.000Z")).forfallen).toBe(true);
  });

  it("halvtidPasserad slår vid halva fristen, inte tidigare", () => {
    // 72h frist, halvtid = 36h efter kännedom
    const strax_fore = berakAterstaende(KANNEDOM, false, new Date("2026-08-30T23:59:00.000Z"));
    expect(strax_fore.halvtidPasserad).toBe(false);
    const vid_halvtid = berakAterstaende(KANNEDOM, false, new Date("2026-08-31T00:00:01.000Z"));
    expect(vid_halvtid.halvtidPasserad).toBe(true);
  });

  it("24-timmarsfristens halvtid är 12h efter kännedom", () => {
    const resultat = berakAterstaende(KANNEDOM, true, new Date("2026-08-30T00:00:01.000Z"));
    expect(resultat.halvtidPasserad).toBe(true);
  });
});
