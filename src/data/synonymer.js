// Etapp 65c: en första svensk akutvårdsvokabular för sökningen – varje rad är en grupp av
// ord som betyder samma sak i kliniken, men som Fuse.js (fuzzy-matchning av STAVNING, inte
// synonymer) inte kopplar ihop på egen hand. "PVK" och "perifer venkateter" är för Fuse.js
// två helt olika ord. Utökningsbar utan kodändring – lägg bara till en ny rad.
//
// Medvetet begränsad till allmänna, generiska kliniska termer och förkortningar – INGA
// namngivna, varumärkesskyddade bedömningsinstrument (se ETAPPLAN13.md genomgående krav 27).
export const SYNONYMGRUPPER = [
  ["pvk", "venflon", "perifer venkateter", "venkateter"],
  ["kad", "kateter à demeure", "kvarliggande kateter", "foley-kateter", "foley"],
  ["cvk", "central venkateter", "centrala venkatetern"],
  ["ekg", "elektrokardiogram"],
  ["bt", "blodtryck"],
  ["puls", "hjärtfrekvens", "hf"],
  ["saturation", "sat", "syremättnad", "spo2"],
  ["af", "andningsfrekvens"],
  ["nrs", "smärtskattning", "numerisk smärtskala"],
  ["iva", "intensivvårdsavdelning", "ivö"],
  ["hlr", "hjärt-lungräddning", "hjärtlungräddning"],
  ["defib", "defibrillator", "hjärtstartare"],
  ["intubation", "trakealtub", "endotrakealtub", "et-tub"],
  ["antibiotika", "abx"],
  ["dropp", "infusion", "intravenös vätska", "iv-dropp"],
  ["ssk", "sjuksköterska"],
  ["usk", "undersköterska"],
];
