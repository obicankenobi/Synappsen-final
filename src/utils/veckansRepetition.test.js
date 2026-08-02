import { describe, it, expect } from "vitest";
import { valjVeckansFraga, veckoNyckel } from "./veckansRepetition";

const NU = new Date("2026-08-02T12:00:00Z");
const DAG = 24 * 60 * 60 * 1000;

function tsFor(dagarSedan) {
  const ms = NU.getTime() - dagarSedan * DAG;
  return { toMillis: () => ms };
}

const KVISS = [{ fraga: "Hur mycket adrenalin?", alternativ: ["0,3 mg", "0,5 mg"], rattIndex: 1 }];

describe("valjVeckansFraga", () => {
  it("returnerar null utan uid", () => {
    expect(valjVeckansFraga([], null, NU)).toBeNull();
  });

  it("returnerar null om ingen rutin har kviss", () => {
    const rutiner = [
      { id: "r1", status: "godkand", kviss: [], lasteAv: [{ uid: "u1", tidpunkt: tsFor(200) }] },
    ];
    expect(valjVeckansFraga(rutiner, "u1", NU)).toBeNull();
  });

  it("returnerar null om kvitteringen är för färsk (under tröskeln)", () => {
    const rutiner = [
      { id: "r1", status: "godkand", kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(5) }] },
    ];
    expect(valjVeckansFraga(rutiner, "u1", NU)).toBeNull();
  });

  it("returnerar null om användaren aldrig kvitterat rutinen", () => {
    const rutiner = [
      { id: "r1", status: "godkand", kviss: KVISS, lasteAv: [{ uid: "annanAnvandare", tidpunkt: tsFor(200) }] },
    ];
    expect(valjVeckansFraga(rutiner, "u1", NU)).toBeNull();
  });

  it("returnerar null för ett utkast (fel status), även med gammal kvittering", () => {
    const rutiner = [
      { id: "r1", status: "utkast", kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(200) }] },
    ];
    expect(valjVeckansFraga(rutiner, "u1", NU)).toBeNull();
  });

  it("utesluter en arkiverad rutin, även med gammal kvittering och kviss", () => {
    const rutiner = [
      { id: "r1", status: "godkand", arkiverad: true, kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(200) }] },
    ];
    expect(valjVeckansFraga(rutiner, "u1", NU)).toBeNull();
  });

  it("väljer en kvalificerande rutin och en fråga ur den", () => {
    const rutiner = [
      { id: "r1", status: "godkand", kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(200) }] },
    ];
    const resultat = valjVeckansFraga(rutiner, "u1", NU);
    expect(resultat.rutin.id).toBe("r1");
    expect(resultat.fraga).toEqual(KVISS[0]);
  });

  it("ger samma resultat för samma användare/vecka (stabilt, inte slumpmässigt varje anrop)", () => {
    const rutiner = [
      { id: "r1", status: "godkand", kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(200) }] },
      { id: "r2", status: "godkand", kviss: KVISS, lasteAv: [{ uid: "u1", tidpunkt: tsFor(300) }] },
    ];
    const forsta = valjVeckansFraga(rutiner, "u1", NU);
    const andra = valjVeckansFraga(rutiner, "u1", NU);
    expect(andra.rutin.id).toBe(forsta.rutin.id);
  });
});

describe("veckoNyckel", () => {
  it("ger samma nyckel för två datum i samma kalendervecka", () => {
    expect(veckoNyckel(new Date("2026-08-02T08:00:00Z"))).toBe(veckoNyckel(new Date("2026-08-03T20:00:00Z")));
  });

  it("ger olika nyckel för datum en vecka isär", () => {
    expect(veckoNyckel(new Date("2026-08-02T08:00:00Z"))).not.toBe(veckoNyckel(new Date("2026-08-10T08:00:00Z")));
  });
});
