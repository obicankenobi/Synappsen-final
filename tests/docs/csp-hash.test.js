// Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.1). Innehållssäkerhetspolicyn i
// firebase.json tillåter det ENDA inline-skriptet i index.html via en sha256-hash i stället
// för `'unsafe-inline'`. Det är strikt bättre – men bara så länge hashen faktiskt motsvarar
// skriptet. Ändrar någon en rad i temasnutten utan att räkna om hashen slutar skriptet
// matcha, och då tystnar temat vid en enforcing-policy (eller, i dagens report-only-läge,
// börjar policyn rapportera en överträdelse på varje sidladdning och drunknar det som är
// riktiga fynd).
//
// Det här är projektets vanliga "gör regeln händelsestyrd, inte minnesstyrd"-mönster: ett
// test i stället för en kommentar som ber någon komma ihåg. Samma resonemang som
// pitch-version.test.js och src/version.js.
//
// Faller testet: kör om hashberäkningen nedan för hand och klistra in det nya värdet i
// firebase.json. Byt ALDRIG tillbaka till 'unsafe-inline' för att slippa – det var precis den
// försvagning granskningen tog bort, och den gör script-src verkningslös mot injicerad kod.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const rot = fileURLToPath(new URL("../../", import.meta.url));

function inlineSkript(html) {
  // Matchar <script>-taggar UTAN src-attribut, dvs. bara inline-kod.
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

describe("CSP:ns script-src-hash måste matcha index.html", () => {
  test("index.html innehåller exakt ett inline-skript, och dess hash står i firebase.json", () => {
    const html = readFileSync(`${rot}index.html`, "utf8");
    const skript = inlineSkript(html);

    expect(
      skript,
      "Antalet inline-skript i index.html har ändrats. Varje sådant skript behöver en egen " +
        "sha256-hash i firebase.json:s script-src, annars blockeras det av policyn."
    ).toHaveLength(1);

    const hash = createHash("sha256").update(skript[0], "utf8").digest("base64");
    const csp = readFileSync(`${rot}firebase.json`, "utf8");

    expect(
      csp,
      `Inline-skriptet i index.html hashar till 'sha256-${hash}', men det värdet finns inte i ` +
        "firebase.json:s Content-Security-Policy. Uppdatera policyn med den nya hashen."
    ).toContain(`'sha256-${hash}'`);
  });

  test("script-src har inte fallit tillbaka till 'unsafe-inline'", () => {
    const csp = readFileSync(`${rot}firebase.json`, "utf8");
    const traff = csp.match(/script-src ([^;]*);/);
    expect(traff, "Hittade ingen script-src-direktiv i firebase.json").not.toBeNull();
    expect(
      traff[1],
      "script-src innehåller 'unsafe-inline' igen. Då kan en injicerad inline-tagg köras även " +
        "med en enforcing-policy, vilket gör hela direktivet verkningslöst mot XSS."
    ).not.toContain("unsafe-inline");
  });
});
