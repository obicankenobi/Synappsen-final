// Etapp 71: startinnehållet i den globala frågebanken (functions/kvissfragorSeed.js) skrivs
// ut till varje kund och visas för vårdpersonal. Det kan alltså gå fel på exakt samma sätt som
// ett dokument – ett påstående som var sant när det skrevs slutar stämma. Samma princip som
// tests/docs/dokumentpastaenden.test.js och src/data/kvissbank.test.js: binda påståendet till
// sin källa i stället för att lita på att någon minns.
//
// VARFÖR DET INTE ÄR TEORETISKT: under arbetet med seeden upptäcktes att SOSFS 1997:14 om
// delegering – grunden för i stort sett varje svensk delegeringsutbildning – upphävdes
// 2026-01-01 (HSLF-FS 2025:5). En fråga skriven ur minnet hade varit fel från dag ett.
// Kravet på `kalla` per fråga nedan finns för att göra just den sortens fel upptäckbart.
import { describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import { KVISSBANK } from "./kvissbank";

const require = createRequire(import.meta.url);
const { SEED } = require("../../functions/kvissfragorSeed.js");

const MIN_ALTERNATIV = 3;
const MAX_ALTERNATIV = 4;

describe("Seedens form matchar vad Cloud Function-valideringen släpper igenom", () => {
  // Gränserna nedan speglar validera() i functions/kvissbank.js. Skulle seeden bryta mot dem
  // hade seedaKvissbank tyst skrivit in frågor som ingen sedan kan redigera utan att först
  // rätta dem – valideringen körs ju bara vid manuell redigering, inte vid seedning.
  test("varje fråga har alla fält Öva-läget läser", () => {
    for (const f of SEED) {
      expect(typeof f.id, `${f.id}: id saknas`).toBe("string");
      expect(typeof f.paket, `${f.id}: paket saknas`).toBe("string");
      expect(typeof f.fraga, `${f.id}: fraga saknas`).toBe("string");
      expect(Array.isArray(f.alternativ), `${f.id}: alternativ är ingen array`).toBe(true);
      expect(typeof f.rattIndex, `${f.id}: rattIndex saknas`).toBe("number");
    }
  });

  test("rattIndex pekar på ett alternativ som finns", () => {
    for (const f of SEED) {
      expect(f.rattIndex, `${f.id}: rattIndex utanför listan`).toBeGreaterThanOrEqual(0);
      expect(f.rattIndex, `${f.id}: rattIndex utanför listan`).toBeLessThan(f.alternativ.length);
    }
  });

  test("varje fråga har 3–4 alternativ", () => {
    for (const f of SEED) {
      expect(f.alternativ.length, `${f.id}: fel antal alternativ`).toBeGreaterThanOrEqual(
        MIN_ALTERNATIV
      );
      expect(f.alternativ.length, `${f.id}: fel antal alternativ`).toBeLessThanOrEqual(
        MAX_ALTERNATIV
      );
    }
  });

  test("inga dubblerade svarsalternativ inom samma fråga", () => {
    for (const f of SEED) {
      expect(new Set(f.alternativ).size, `${f.id}: identiska alternativ`).toBe(f.alternativ.length);
    }
  });

  test("alla id:n är unika", () => {
    // ID:t är dokument-ID i Firestore OCH nyckeln kundernas överlagringar hänger på. En
    // dubblett hade tyst skrivit över en annan fråga vid seedning.
    const idn = SEED.map((f) => f.id);
    expect(new Set(idn).size, "Dubblerade id:n i seeden").toBe(idn.length);
  });

  test("bara kända paket förekommer", () => {
    for (const f of SEED) {
      expect(["yrkeskunskap", "systemkunskap", "kliniskt"], `${f.id}: okänt paket`).toContain(
        f.paket
      );
    }
  });
});

describe("Yrkeskunskapspaketet är källbelagt", () => {
  const yrke = SEED.filter((f) => f.paket === "yrkeskunskap");

  test("paketet är inte tomt", () => {
    expect(yrke.length).toBeGreaterThan(0);
  });

  test("varje fråga anger en källa och ett datum då källan kontrollerades", () => {
    // Detta är kravet som gör ett facit granskningsbart över tid, och som
    // granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §7 ställer som villkor för att
    // leverantörskurerat sakinnehåll ska få finnas alls.
    for (const f of yrke) {
      expect(f.kalla, `${f.id}: saknar kalla`).toBeTruthy();
      expect(f.kallaDatum, `${f.id}: saknar kallaDatum`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("ingen fråga vilar på den upphävda delegeringsföreskriften SOSFS 1997:14", () => {
    // Upphävd 2026-01-01 genom HSLF-FS 2025:5. Den här assertionen finns för att det är
    // precis den referens som ligger närmast till hands att skriva av gammal vana.
    for (const f of SEED) {
      expect(f.kalla ?? "", `${f.id} hänvisar till en upphävd föreskrift`).not.toMatch(
        /SOSFS\s*1997:14/i
      );
    }
  });
});

describe("Ingenting i seeden liknar personuppgifter", () => {
  // Samma spärr som validera() i functions/kvissbank.js tillämpar vid manuell redigering.
  // Seedningen går förbi den (den skriver direkt via Admin SDK), så den behöver sin egen.
  test("ingen fråga innehåller ett personnummerliknande mönster", () => {
    const personnummer = /\b(19|20)?\d{6}[-+]?\d{4}\b/;
    for (const f of SEED) {
      const text = [f.fraga, ...f.alternativ, f.hanvisning ?? ""].join(" ");
      expect(text, `${f.id} innehåller något som liknar ett personnummer`).not.toMatch(
        personnummer
      );
    }
  });
});

describe("Systemkunskapspaketet har inte glidit från den statiska banken", () => {
  // src/data/kvissbank.js används fortfarande av RutinFormular.jsx ("lägg till från banken",
  // som fäster en fråga på en enskild rutin). Samma frågor finns nu ALLTID på två ställen –
  // exakt det duplikat-mönster som fått sex dokument i det här projektet att glida isär.
  // Assertionen nedan är billigare än en refaktorisering och fångar driften direkt.
  const systemIseed = SEED.filter((f) => f.paket === "systemkunskap");

  test("samma antal frågor i båda källorna", () => {
    expect(
      systemIseed.length,
      "functions/kvissfragorSeed.js och src/data/kvissbank.js har olika många frågor. " +
        "Lades en fråga till på ena stället utan det andra?"
    ).toBe(KVISSBANK.length);
  });

  test("varje fråga i den statiska banken finns i seeden med samma id och frågetext", () => {
    const seedPerId = new Map(systemIseed.map((f) => [f.id, f]));
    for (const f of KVISSBANK) {
      const iSeed = seedPerId.get(f.id);
      expect(iSeed, `${f.id} finns i src/data/kvissbank.js men saknas i seeden`).toBeTruthy();
      expect(iSeed.fraga, `${f.id}: frågetexten har glidit isär mellan de två källorna`).toBe(
        f.fraga
      );
      expect(iSeed.alternativ, `${f.id}: alternativen har glidit isär`).toEqual(f.alternativ);
      expect(iSeed.rattIndex, `${f.id}: rätt svar har glidit isär`).toBe(f.rattIndex);
    }
  });
});
