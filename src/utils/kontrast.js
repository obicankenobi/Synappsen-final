// Etapp 28c: WCAG-kontrastberäkning + validering av en kunds valda accentfärg innan den
// sparas. Kontrastformeln är standard-WCAG 2.1 (relativ luminans, se W3C:s definition).
const AA_GRANS = 4.5;

export function hexTillRgb(hex) {
  const normaliserad = hex.replace("#", "");
  const full = normaliserad.length === 3 ? normaliserad.split("").map((c) => c + c).join("") : normaliserad;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbTillHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

// Blandar hex mot mal (t.ex. vitt/svart) med andel 0–1 av malet.
export function blandaFarger(hex, mal, andel) {
  const a = hexTillRgb(hex);
  const b = hexTillRgb(mal);
  return rgbTillHex({
    r: a.r + (b.r - a.r) * andel,
    g: a.g + (b.g - a.g) * andel,
    b: a.b + (b.b - a.b) * andel,
  });
}

function kanalLuminans(kanal) {
  const c = kanal / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativLuminans(hex) {
  const { r, g, b } = hexTillRgb(hex);
  return 0.2126 * kanalLuminans(r) + 0.7152 * kanalLuminans(g) + 0.0722 * kanalLuminans(b);
}

export function kontrastforhallande(hex1, hex2) {
  const l1 = relativLuminans(hex1);
  const l2 = relativLuminans(hex2);
  const [ljusast, morkast] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (ljusast + 0.05) / (morkast + 0.05);
}

// Mörkt lägets primärfärg görs automatiskt ljusare (samma princip som de fördefinierade
// accenterna i index.css, t.ex. grön #15803d i ljust läge → #4ade80 i mörkt) – annars läser
// knapptext (var(--yta), mörk i mörkt läge) dåligt mot en färg vald för en ljus bakgrund.
export function morkLagesVariant(hex) {
  return blandaFarger(hex, "#ffffff", 0.45);
}

// Valideras mot EXAKT de två ställen accentfärgen faktiskt används som bakgrund med fast
// textfärg ovanpå (knapp-text, var(--yta)): vitt i ljust läge, den mörka ytfärgen i mörkt läge.
export function valideraAccentfarg(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex ?? "")) {
    return { giltig: false, fel: "Ange en giltig hexfärg, t.ex. #2563eb." };
  }
  const ljustLage = kontrastforhallande(hex, "#ffffff");
  if (ljustLage < AA_GRANS) {
    return {
      giltig: false,
      fel: `För svag kontrast mot vit knapptext i ljust läge (${ljustLage.toFixed(1)}:1, kräver minst ${AA_GRANS}:1). Välj en mörkare eller mer mättad färg.`,
    };
  }
  const morktLage = kontrastforhallande(morkLagesVariant(hex), "#131722");
  if (morktLage < AA_GRANS) {
    return {
      giltig: false,
      fel: `Färgen går inte att göra tillgänglig i mörkt läge (${morktLage.toFixed(1)}:1, kräver minst ${AA_GRANS}:1). Prova en mer mättad färg.`,
    };
  }
  return { giltig: true };
}
