// Kvissbanken är statisk data som hamnar i produktion och visas för vårdpersonal. Den kan
// alltså gå fel på samma sätt som ett dokument: ett påstående som var sant när det skrevs
// slutar stämma när koden ändras. Testerna nedan följer samma princip som
// tests/docs/dokumentpastaenden.test.js – binda påståendet till sin sanningskälla i koden i
// stället för att lita på att någon minns.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  KVISSBANK,
  KVISS_KATEGORIER,
  KVISS_KATEGORI_LABEL,
  MAX_KVISSFRAGOR_PER_RUTIN,
  fragorIKategori,
  tillRutinKviss,
} from "./kvissbank";

const ROT = fileURLToPath(new URL("../../", import.meta.url));

describe("Kvissbankens form", () => {
  test("varje fråga har alla fält som KvissModal.jsx läser", () => {
    for (const f of KVISSBANK) {
      expect(typeof f.id, `${f.id}: id saknas`).toBe("string");
      expect(typeof f.fraga, `${f.id}: fraga saknas`).toBe("string");
      expect(Array.isArray(f.alternativ), `${f.id}: alternativ är ingen array`).toBe(true);
      expect(typeof f.rattIndex, `${f.id}: rattIndex saknas`).toBe("number");
      expect(typeof f.hanvisning, `${f.id}: hanvisning saknas`).toBe("string");
    }
  });

  test("rattIndex pekar på ett alternativ som finns", () => {
    for (const f of KVISSBANK) {
      expect(f.rattIndex, `${f.id}: rattIndex utanför alternativ-listan`).toBeGreaterThanOrEqual(0);
      expect(f.rattIndex, `${f.id}: rattIndex utanför alternativ-listan`).toBeLessThan(
        f.alternativ.length
      );
    }
  });

  test("varje fråga har 3–4 alternativ", () => {
    // Två alternativ blir en gissning med 50 % chans; fler än fyra blir svårläst på en
    // telefon, som är där kvissen faktiskt besvaras.
    for (const f of KVISSBANK) {
      expect(f.alternativ.length, `${f.id}: fel antal alternativ`).toBeGreaterThanOrEqual(3);
      expect(f.alternativ.length, `${f.id}: fel antal alternativ`).toBeLessThanOrEqual(4);
    }
  });

  test("alla id:n är unika", () => {
    const idn = KVISSBANK.map((f) => f.id);
    expect(new Set(idn).size, "Dubblerade id:n i KVISSBANK").toBe(idn.length);
  });

  test("inga dubblerade svarsalternativ inom samma fråga", () => {
    for (const f of KVISSBANK) {
      expect(new Set(f.alternativ).size, `${f.id}: samma alternativ förekommer två gånger`).toBe(
        f.alternativ.length
      );
    }
  });

  test("varje kategori finns i etikettabellen och har minst en fråga", () => {
    for (const kategori of Object.values(KVISS_KATEGORIER)) {
      expect(KVISS_KATEGORI_LABEL[kategori], `Kategori ${kategori} saknar etikett`).toBeTruthy();
      expect(fragorIKategori(kategori).length, `Kategori ${kategori} är tom`).toBeGreaterThan(0);
    }
  });

  test("varje fråga tillhör en känd kategori", () => {
    const kanda = new Set(Object.values(KVISS_KATEGORIER));
    for (const f of KVISSBANK) {
      expect(kanda.has(f.kategori), `${f.id}: okänd kategori "${f.kategori}"`).toBe(true);
    }
  });
});

describe("tillRutinKviss() ger exakt den form en rutin sparar", () => {
  test("skalar bort bankens egna fält", () => {
    const ut = tillRutinKviss(KVISSBANK.slice(0, 3));
    for (const post of ut) {
      expect(Object.keys(post).sort()).toEqual(["alternativ", "fraga", "hanvisning", "rattIndex"]);
    }
  });

  test("behåller innehållet oförändrat", () => {
    const [forst] = tillRutinKviss([KVISSBANK[0]]);
    expect(forst.fraga).toBe(KVISSBANK[0].fraga);
    expect(forst.rattIndex).toBe(KVISSBANK[0].rattIndex);
  });
});

describe("Katalogen respekterar gränserna i koden", () => {
  test("MAX_KVISSFRAGOR_PER_RUTIN matchar taket i RutinFormular.jsx", () => {
    const formular = readFileSync(`${ROT}src/components/RutinFormular.jsx`, "utf8");
    expect(
      formular,
      "RutinFormular.jsx begränsar inte längre antalet kvissfrågor till " +
        `${MAX_KVISSFRAGOR_PER_RUTIN} – uppdatera MAX_KVISSFRAGOR_PER_RUTIN i kvissbank.js.`
    ).toMatch(new RegExp(`kviss\\.length\\s*[<>=]+\\s*${MAX_KVISSFRAGOR_PER_RUTIN}`));
  });

  test("firestore.rules PII-kontroll täcker lika många frågor som taket", () => {
    // harTroligtPersonnummerIKvissN radar upp ett get()-anrop per index eftersom regelspråket
    // saknar loopar. Höjs taket utan att den funktionen utökas slutar PII-spärren gälla för
    // frågorna över gränsen – tyst, utan att något annat test märker det.
    const rules = readFileSync(`${ROT}firestore.rules`, "utf8");
    const funktion = rules.match(/function harTroligtPersonnummerIKvissN[\s\S]*?\n\s{4}\}/);
    expect(funktion, "Hittade inte harTroligtPersonnummerIKvissN i firestore.rules").not.toBeNull();

    const tackataIndex = [...funktion[0].matchAll(/kviss\[(\d+)\]/g)].map((m) => Number(m[1]));
    const hogsta = Math.max(...tackataIndex);
    expect(
      hogsta + 1,
      "PII-kontrollen i firestore.rules täcker inte lika många kvissfrågor som taket " +
        "tillåter. Varje fråga över gränsen skulle kunna spara ett personnummer utan att " +
        "regeln stoppar det."
    ).toBe(MAX_KVISSFRAGOR_PER_RUTIN);
  });
});

describe("Katalogen innehåller inga kliniska påståenden", () => {
  // Den avgörande avgränsningen: en kvissfråga har ett rätt svar och är därför ett
  // faktapåstående. Kliniska påståenden skulle passera MDR-gränsdragningen och projektets
  // regel om att aldrig påstå overifierat sakinnehåll. Katalogen får bara handla om hur
  // systemet och processen fungerar.
  const KLINISKA_ORD = [
    /\bdos(er|ering)?\b/i,
    /\bmg\b/,
    /\bml\b/,
    /\bmmol\b/,
    /\bkompressioner\b/i,
    /\bandningsfrekvens\b/i,
    /\bblodtryck\b/i,
    /\bsyrgas\b/i,
    /\badrenalin\b/i,
    /\bdiagnos(tisera|en)?\b/i,
    /\bbehandl(a|ing|as)\b/i,
    /\bordinera\b/i,
  ];

  test.each(KVISSBANK.map((f) => [f.id, f]))("%s innehåller inga kliniska termer", (id, f) => {
    const text = [f.fraga, ...f.alternativ, f.hanvisning].join(" ");
    for (const monster of KLINISKA_ORD) {
      expect(
        text,
        `${id} innehåller en klinisk term (${monster}). Kvissbanken får bara pröva kunskap ` +
          "om systemet och processen – kliniska frågor skrivs av verksamheten själv, om den " +
          "egna godkända rutintexten."
      ).not.toMatch(monster);
    }
  });
});

describe("Katalogen innehåller inget som liknar personuppgifter", () => {
  // Samma spärr som firestore.rules tillämpar på rutininnehåll. Banken sparas inte via de
  // reglerna (den är statisk kod), så den behöver sin egen kontroll.
  test("ingen fråga innehåller ett personnummerliknande mönster", () => {
    const personnummer = /\b(19|20)?\d{6}[-+]?\d{4}\b/;
    for (const f of KVISSBANK) {
      const text = [f.fraga, ...f.alternativ, f.hanvisning].join(" ");
      expect(text, `${f.id} innehåller något som liknar ett personnummer`).not.toMatch(
        personnummer
      );
    }
  });
});
