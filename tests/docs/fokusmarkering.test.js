// Etapp 69e (2026-08-22): vakt mot att fokusmarkeringen på listposter blir osynlig igen.
//
// Bakgrunden är att den redan varit det. SokFalt.css, KommandopalettInnehall.css och
// Notisklocka.css satte `outline: none` på fokus och ersatte ringen med ENDAST ett
// bakgrundsbyte (--primar-ljus mot --yta), vilket mätte 1,06-1,14:1 i samtliga åtta
// paletter - långt under WCAG 1.4.11:s krav på 3:1 för en fokusindikator. Upptäcktes bara
// för att UI-genomgången inför ETAPPLAN18.md renderade sidorna och navigerade med
// tangentbord. axe fångar inte det här: axe kan konstatera att en fokusindikator FINNS,
// inte att den räcker.
//
// Samma "händelsestyrd, inte minnesstyrd"-princip som kontrastpalett.test.js: ett test i
// stället för en kommentar som ber någon komma ihåg. Genomgående krav 35.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { kontrastforhallande } from "../../src/utils/kontrast.js";

const AA_YTA = 3.0;

const css = readFileSync(fileURLToPath(new URL("../../src/index.css", import.meta.url)), "utf8");

function tokensUr(selektor) {
  const start = css.indexOf(selektor + " {");
  if (start === -1) throw new Error(`Hittade inte blocket "${selektor}" i index.css`);
  const slut = css.indexOf("\n}", start);
  const kropp = css.slice(start, slut);
  const tokens = {};
  for (const m of kropp.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

const bas = tokensUr(":root");
const morkBas = { ...bas, ...tokensUr(':root[data-tema="dark"]') };
const ACCENTER = ["gron", "lila", "orange"];

function paletter() {
  const ut = [["blå · ljust", bas], ["blå · mörkt", morkBas]];
  for (const a of ACCENTER) {
    ut.push([`${a} · ljust`, { ...bas, ...tokensUr(`:root[data-accent="${a}"]`) }]);
    ut.push([
      `${a} · mörkt`,
      { ...morkBas, ...tokensUr(`:root[data-tema="dark"][data-accent="${a}"]`) },
    ]);
  }
  return ut;
}

// Filerna 69e rättade, och vilken sidobakgrund respektive fokusring faktiskt ligger mot
// (verifierat mot komponenternas egna panel-/listbakgrund, inte antaget).
const FILER = [
  { fil: "src/components/SokFalt.css", selektor: ".sok-falt__resultat li button:focus-visible", bak: "--yta" },
  {
    fil: "src/components/KommandopalettInnehall.css",
    selektor: ".kommandopalett__resultat li button:focus-visible",
    bak: "--yta",
  },
  { fil: "src/components/Notisklocka.css", selektor: ".notisklocka__panel li button:focus-visible", bak: "--bg" },
];

describe("fokusmarkering på listposter (Etapp 69e)", () => {
  for (const { fil, selektor, bak } of FILER) {
    const komponentCss = readFileSync(fileURLToPath(new URL(`../../${fil}`, import.meta.url)), "utf8");

    test(`${fil}: ${selektor} sätter en synlig outline, inte outline: none`, () => {
      const start = komponentCss.indexOf(selektor);
      expect(start, `Hittade inte selektorn "${selektor}" i ${fil}`).toBeGreaterThan(-1);
      const slut = komponentCss.indexOf("}", start);
      const block = komponentCss.slice(start, slut);

      expect(block, `${selektor} har fortfarande outline: none`).not.toMatch(/outline:\s*none/);
      expect(block, `${selektor} saknar en outline-deklaration`).toMatch(
        /outline:\s*\d+px\s+solid\s+var\(--primar-mork\)/
      );
    });

    for (const [namn, tokens] of paletter()) {
      test(`${fil}: outline mot ${bak} når ${AA_YTA}:1 i paletten ${namn}`, () => {
        const fg = tokens["--primar-mork"];
        const bg = tokens[bak];
        expect(fg, `--primar-mork saknas i paletten ${namn}`).toBeTruthy();
        expect(bg, `${bak} saknas i paletten ${namn}`).toBeTruthy();

        const k = kontrastforhallande(fg, bg);
        expect(
          k,
          `${namn}: --primar-mork ${fg} mot ${bak} ${bg} ger ${k.toFixed(2)}:1, kravet är ` +
            `${AA_YTA}:1 (WCAG 1.4.11). Höj ALDRIG kravet för att få testet grönt.`
        ).toBeGreaterThanOrEqual(AA_YTA);
      });
    }
  }
});
