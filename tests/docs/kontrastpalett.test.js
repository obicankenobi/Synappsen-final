// Etapp 68d: kontrastvakt över hela palettten.
//
// Varför den finns. Palettens värden i src/index.css är resultat av kontrastarbete, inte
// smak: filen motiverar i klartext varför --text-svag är #475569 och inte #64748b, och
// varför --success är #15803d och inte #16a34a. Båda för att nå 4,5:1. Genomgående krav 30
// säger att varje färgändring ska mätas. Det här testet gör att man inte kan låta bli.
//
// Det är samma mönster som redan löst motsvarande problem tre gånger i det här projektet.
// SAKERHETSRAPPORT.md låg 51 releaser efter verkligheten och PITCH.md 48, och båda gångerna
// var lösningen densamma: gör regeln händelsestyrd i stället för minnesstyrd. En kommentar
// som ber någon komma ihåg att mäta har bevisligen inte hållit här.
//
// Vad det INTE gör. Det ersätter inte axe-svepet i tests/e2e/tillganglighet.spec.js. Det
// testet kör mot renderade sidor och ser faktiska färgpar inklusive genomskinlighet och
// överlagring. Det här testet läser tokens och kontrollerar de par vi VET möts. De två
// fångar olika saker: axe hittar par vi inte tänkt på, det här hindrar att någon ändrar en
// token utan att mäta.
//
// Bevisat meningsfullt: körd mot paletten före 68c:s rättning failar den på mörkt läge för
// samtliga fyra accenter (vit knapptext gav 1,74 till 3,68:1).
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { kontrastforhallande } from "../../src/utils/kontrast.js";

const AA_TEXT = 4.5;
// WCAG 1.4.11: gränser och ikoner som bär betydelse räcker med 3:1.
const AA_YTA = 3.0;

const css = readFileSync(fileURLToPath(new URL("../../src/index.css", import.meta.url)), "utf8");

/**
 * Plockar ut tokenvärden ur ett block som inleds med `selektor {`.
 * Blocken i index.css är platta, så första avslutande klammer räcker som slut.
 */
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

// Ljust läge är basen; varje annat block ärver det som inte omdefinieras.
const bas = tokensUr(":root");
const morkBas = { ...bas, ...tokensUr(':root[data-tema="dark"]') };

const ACCENTER = ["gron", "lila", "orange"];

/** Alla fyra accenter i båda teman, med arv löst. */
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

/**
 * Paren som FAKTISKT möts i gränssnittet. Varje rad har en kommentar om var, så att den
 * som lägger till ett par kan avgöra om det hör hemma här eller inte.
 */
const PAR = [
  // .knapp: background var(--primar), color var(--yta)
  ["--yta", "--primar", AA_TEXT, "primärknappens text"],
  // .knapp:hover
  ["--yta", "--primar-mork", AA_TEXT, "primärknappen vid hover"],
  // .hoppa-till-innehall, AppUppdateringBanner, SokFalt-chip, Korvy-knapp m.fl.
  ["--pa-primar", "--primar", AA_TEXT, "text på färgad yta (hoppa-till-innehall m.fl.)"],
  // AkutKnappFloating: background var(--farlig)
  ["--pa-farlig", "--farlig", AA_TEXT, "text på farlig-knapp"],
  // brödtext
  ["--text", "--bg", AA_TEXT, "brödtext mot sidbakgrund"],
  ["--text", "--yta", AA_TEXT, "brödtext mot kortyta"],
  // sekundär text
  ["--text-svag", "--bg", AA_TEXT, "svag text mot sidbakgrund"],
  ["--text-svag", "--yta", AA_TEXT, "svag text mot kortyta"],
  // .knapp--sekundar: color var(--primar), transparent bakgrund
  ["--primar", "--bg", AA_TEXT, "sekundärknapp och länkar mot sidbakgrund"],
  ["--primar", "--yta", AA_TEXT, "sekundärknapp och länkar mot kortyta"],
  // statusfärger som text
  ["--farlig", "--yta", AA_TEXT, "felmeddelande mot kortyta"],
  ["--success", "--yta", AA_TEXT, "bekräftelse mot kortyta"],
  // kantlinjer bär betydelse (fältgränser), 1.4.11
  ["--kant-stark", "--yta", AA_YTA, "tydlig kantlinje mot kortyta"],
  ["--kant-stark", "--bg", AA_YTA, "tydlig kantlinje mot sidbakgrund"],
];

describe("kontrastvakt över palettten", () => {
  for (const [namn, tokens] of paletter()) {
    describe(namn, () => {
      for (const [fram, bak, krav, var_] of PAR) {
        test(`${var_} (${fram} mot ${bak}) når ${krav}:1`, () => {
          const f = tokens[fram];
          const b = tokens[bak];
          expect(f, `${fram} saknas i paletten ${namn}`).toBeTruthy();
          expect(b, `${bak} saknas i paletten ${namn}`).toBeTruthy();

          const k = kontrastforhallande(f, b);
          expect(
            k,
            `${namn}: ${var_}. ${fram} ${f} mot ${bak} ${b} ger ${k.toFixed(2)}:1, ` +
              `kravet är ${krav}:1. Ändra färgen tills den når kravet, eller ändra paret ` +
              `här om gränssnittet faktiskt inte längre sätter dem mot varandra. ` +
              `Höj ALDRIG kravet för att få testet grönt.`
          ).toBeGreaterThanOrEqual(krav);
        });
      }
    });
  }

  test("alla fyra accenter och båda teman täcks", () => {
    // Fångar att någon lägger till en femte accent i index.css utan att ta med den här.
    const iCss = new Set([...css.matchAll(/\[data-accent="([a-z]+)"\]/g)].map((m) => m[1]));
    for (const a of iCss) {
      expect(
        ACCENTER,
        `Accenten "${a}" finns i index.css men testas inte. Lägg till den i ACCENTER.`
      ).toContain(a);
    }
    expect(paletter()).toHaveLength(8);
  });
});
