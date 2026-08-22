// Etapp 69g (ETAPPLAN18.md): mörkt läge underhålls i TVÅ handhållna kopior i index.css - en
// `:root[data-tema="dark"]`-regel (det explicita valet) och en `@media
// (prefers-color-scheme: dark)`-regel (systemets standard), för vardera basen och de tre
// accenterna. `tests/docs/kontrastpalett.test.js` läser bara den förstnämnda av varje par.
//
// De två kopiorna är IDENTISKA idag (verifierat vid skrivande stund) - men ingenting hindrar
// att en framtida ändring bara träffar den ena, och då skulle kontrastvakten fortfarande
// rapportera grönt eftersom den aldrig tittar på den andra. Samma "händelsestyrd, inte
// minnesstyrd"-princip som resten av projektets vakter: ett test istället för en kommentar
// som ber någon komma ihåg att uppdatera båda.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("../../src/index.css", import.meta.url)), "utf8");

/** Hittar `selektor {` och returnerar tokens fram till dess MATCHANDE stängande klammer,
 * genom att räkna klamrar - till skillnad från kontrastpalett.test.js:s enklare `tokensUr`
 * behöver den här hantera block nästlade i en @media-regel. */
function tokensUr(selektor) {
  const start = css.indexOf(selektor + " {");
  if (start === -1) throw new Error(`Hittade inte blocket "${selektor}" i index.css`);
  const oppningsKlammer = css.indexOf("{", start);

  let djup = 1;
  let i = oppningsKlammer + 1;
  while (djup > 0) {
    if (css[i] === "{") djup++;
    else if (css[i] === "}") djup--;
    i++;
  }
  const kropp = css.slice(oppningsKlammer + 1, i - 1);

  const tokens = {};
  for (const m of kropp.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

// De fyra paren: attribut-selektorn (läses redan av kontrastpalett.test.js) och dess
// motsvarande @media-block (läses INTE av något annat test).
const PAR = [
  ["bas", ':root[data-tema="dark"]', ':root:not([data-tema="light"])'],
  ["grön", ':root[data-tema="dark"][data-accent="gron"]', ':root:not([data-tema="light"])[data-accent="gron"]'],
  ["lila", ':root[data-tema="dark"][data-accent="lila"]', ':root:not([data-tema="light"])[data-accent="lila"]'],
  ["orange", ':root[data-tema="dark"][data-accent="orange"]', ':root:not([data-tema="light"])[data-accent="orange"]'],
];

describe("mörkt läge: de två handhållna kopiorna får inte glida isär", () => {
  for (const [namn, attributSelektor, mediaSelektor] of PAR) {
    test(`${namn}: attribut-blocket och @media-blocket har identiska tokens`, () => {
      const attribut = tokensUr(attributSelektor);
      const media = tokensUr(mediaSelektor);

      expect(Object.keys(attribut).sort(), `${namn}: blocken har olika ANTAL tokens`).toEqual(
        Object.keys(media).sort()
      );

      for (const token of Object.keys(attribut)) {
        expect(
          media[token],
          `${namn}: ${token} är ${attribut[token]} i "${attributSelektor}" men ` +
            `${media[token] ?? "saknas"} i @media-blocket "${mediaSelektor}". De två kopiorna ` +
            `av mörkt läge har glidit isär - uppdatera BÅDA, inte bara den ena.`
        ).toBe(attribut[token]);
      }
    });
  }
});
