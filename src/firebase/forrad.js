// Definition av förråden i Logistik-sektionen
export const FORRAD = [
  "Engångsförrådet",
  "Sterilförrådet",
  "Ortopedförrådet",
  "Tvättförrådet",
  "Kontorsförrådet",
  "Läkemedelsrummet",
];

export function forradTillSlug(forrad) {
  return forrad
    .toLowerCase()
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const FORRAD_SLUGS = Object.fromEntries(FORRAD.map((f) => [forradTillSlug(f), f]));
