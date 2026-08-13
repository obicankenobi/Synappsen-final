// Etapp 65a: gör rå Markdown-text talbar för webbläsarens speechSynthesis. Körs på
// RÅ rutin.innehall, INTE på den renderade HTML:en från MarkdownInnehall.jsx – talsyntesen
// ska höra "punkt" mellan meningar, inte "fyrkant fyrkant" eller en uppläst länk-URL.
// Tar även bort emoji (samma brist som TILLGANGLIGHETSREDOGORELSE.md SYN-6 redan
// dokumenterar för skärmläsare – en uppläst "eldsflamma" är lika omständligt här).

// Brett Unicode-intervall för emoji/symboler/piktogram. Variationsselektorn (FE0F) och
// zero-width joiner (200D, binder ihop flertecken-emoji) tas bort i ett eget steg nedan –
// eslint (no-misleading-character-class) varnar för att blanda kombinerande tecken med
// vanliga intervall i samma teckenklass.
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;
const EMOJI_MODIFIERARE_REGEX = /[\u{FE0F}\u{200D}]/gu;

export function talText(markdown) {
  if (!markdown) return "";
  return (
    markdown
      // Länkar: [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Rubriker: ta bort inledande #-tecken
      .replace(/^#{1,6}\s+/gm, "")
      // Fetstil/kursiv: **text**/__text__/*text*/_text_ -> text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Punktlistor och citattecken i radbörjan
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(EMOJI_REGEX, "")
      .replace(EMOJI_MODIFIERARE_REGEX, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}
