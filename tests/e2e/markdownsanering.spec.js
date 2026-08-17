// Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.2). Testar saneringen av rutinernas
// Markdown i en RIKTIG webbläsare, inte i vitest.
//
// Varför e2e och inte ett vanligt enhetstest: DOMPurify sanerar med hjälp av webbläsarens
// egen DOM-parser. Under happy-dom (projektets vitest-miljö) rapporterar den `isSupported:
// true` men beter sig ändå fel – ett första försök till enhetstest här visade `<script>` och
// `javascript:`-länkar som OSANERADE och `<h1>` som borttagen, vilket är osant i en riktig
// webbläsare. Ett test som ljuger åt båda hållen är sämre än inget test: det hade både kunnat
// larma om en sårbarhet som inte finns och tystna om en som finns. Chromium är den enda
// miljön där svaret är sant, alltså körs det här.
//
// Vad som faktiskt hittades: DOMPurifys STANDARDkonfiguration tillåter `<form>` och
// `<input>`. En redaktör kunde alltså lägga ett inloggningsliknande fält mitt i en klinisk
// rutin, som POST:ar till en extern server – nätfiske på den sida personalen lärt sig lita
// på. `saneraMarkdown()` i src/utils/sanering.js förbjuder dem numera uttryckligen.
import { test, expect } from "@playwright/test";

// Kör saneringen via appens EGEN modul, serverad av Vite-devservern, så att testet följer med
// automatiskt om konfigurationen i sanering.js ändras.
async function sanera(page, text) {
  return page.evaluate(
    (t) => import("/src/utils/sanering.js").then((m) => m.saneraMarkdown(t)),
    text
  );
}

test.describe("Markdown i rutiner saneras", () => {
  test("vanlig markdown renderas oförändrad", async ({ page }) => {
    await page.goto("/logga-in");
    const ut = await sanera(page, "# Rubrik\n\nText med **fetstil**.");
    expect(ut).toContain("<h1>Rubrik</h1>");
    expect(ut).toContain("<strong>fetstil</strong>");
  });

  test("skript, händelsehanterare och javascript:-länkar tas bort", async ({ page }) => {
    await page.goto("/logga-in");
    expect(await sanera(page, "Före<script>window.x=1</script>efter")).not.toContain("<script");
    expect(await sanera(page, '<img src="x" onerror="window.x=1">')).not.toContain("onerror");
    expect(await sanera(page, '<svg onload="window.x=1"></svg>')).not.toContain("onload");
    const lank = await sanera(page, "[Klicka](javascript:window.x=1)");
    expect(lank).not.toContain("javascript:");
    expect(lank).toContain("Klicka");
  });

  test("iframe tas bort", async ({ page }) => {
    await page.goto("/logga-in");
    expect(await sanera(page, '<iframe src="https://annan.example"></iframe>')).not.toContain("<iframe");
  });

  // Det HÄR testet failade före patchen – nyttolasten passerade helt orörd.
  test("formulärfält tas bort (nätfiske inuti en rutin)", async ({ page }) => {
    await page.goto("/logga-in");
    const ut = await sanera(
      page,
      '<form action="https://annan.example"><input name="losenord"><button>Logga in</button></form>'
    );
    expect(ut).not.toContain("<form");
    expect(ut).not.toContain("<input");
    expect(ut).not.toContain("<button");
  });

  test("formaction och ping tas bort även utan en form-tagg", async ({ page }) => {
    await page.goto("/logga-in");
    expect(await sanera(page, '<a href="/x" ping="https://annan.example">x</a>')).not.toContain("ping");
  });

  test("en vanlig https-länk behålls", async ({ page }) => {
    await page.goto("/logga-in");
    expect(await sanera(page, "[SoS](https://www.socialstyrelsen.se)")).toContain(
      'href="https://www.socialstyrelsen.se"'
    );
  });
});
