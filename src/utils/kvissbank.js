// Etapp 71: ren, Firestore-fri sammanslagning av frågebankens tre lager.
//
// Lagren, i den ordning de vinner över varandra:
//   1. kvissfragor/{id}                            leverantörens globala fråga (basen)
//   2. organisationer/{orgId}/kvissoverlagring/{id} kundens avvikelse från just den frågan
//   3. organisationer/{orgId}/kvissegna/{id}        kundens egna, fristående frågor
//
// Överlagringen (2) är hela poängen med modellen: en fråga kunden ALDRIG rört saknar dokument
// i lager 2, och får därför automatiskt leverantörens senaste version – inklusive rättelser.
// Se granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §5.1 för varför färskheten är den
// risk modellen framför allt är byggd mot.
//
// Logiken ligger här och inte i hooken av samma skäl som ovaLage.js: den är ren funktion av
// sina indata och ska kunna testas utan emulator.

export const PAKET = {
  SYSTEMKUNSKAP: "systemkunskap",
  YRKESKUNSKAP: "yrkeskunskap",
  KLINISKT: "kliniskt",
  EGET: "eget",
};

export const PAKET_LABEL = {
  [PAKET.SYSTEMKUNSKAP]: "Så fungerar Synappsen",
  [PAKET.YRKESKUNSKAP]: "Yrkes- och regelkunskap",
  [PAKET.KLINISKT]: "Kliniska sakfrågor",
  [PAKET.EGET]: "Våra egna frågor",
};

export const PAKET_BESKRIVNING = {
  [PAKET.SYSTEMKUNSKAP]:
    "Hur appen och processen fungerar – kvittering, ansvar, granskning, patientuppgifter.",
  [PAKET.YRKESKUNSKAP]:
    "Sådant som följer av lag och gäller all vårdpersonal – sekretess, dokumentation, " +
    "delegering, avvikelser, samtycke.",
  [PAKET.KLINISKT]:
    "Kliniska sakfrågor från nationella källor. Varje fråga har en angiven källa och ett " +
    "datum. Stäng av en fråga som inte stämmer med er egen rutin.",
  [PAKET.EGET]: "Frågor ni skrivit själva, fristående från en enskild rutin.",
};

// Ordningen paketen visas i, både i adminvyn och i leverantörsvyn. "eget" ingår inte – det
// hanteras separat eftersom det aldrig har några globala frågor.
export const LEVERANTORSPAKET_ORDNING = [PAKET.YRKESKUNSKAP, PAKET.KLINISKT, PAKET.SYSTEMKUNSKAP];

// Ett paket räknas som aktivt om (a) leverantören inte nödstoppat det globalt och (b) kunden
// inte stängt av det. Saknad flagga = på, i båda leden – ett nytt paket ska synas utan att
// någon först måste slå på det, och en organisation utan `kvisspaket`-fält (alla som fanns
// före Etapp 71) ska inte plötsligt se ett tomt Öva-läge.
export function paketAktivt(paket, kundensVal, globaltStopp) {
  if (globaltStopp?.[paket]?.avstangt === true) return false;
  return kundensVal?.[paket] !== false;
}

// Slår ihop en global fråga med kundens eventuella överlagring. Returnerar null om kunden
// dolt frågan. `kalla`/`kallaDatum` behålls ALLTID från originalet, även när kunden skrivit
// om texten – annars hade en omskriven fråga sett ut att ha en källa den inte längre följer.
export function slaIhopFraga(global, overlagring) {
  if (overlagring?.dold === true) return null;
  if (!overlagring) return { ...global, overlagrad: false };

  // Bara de fält kunden faktiskt skrivit om ska vinna. `dold` är redan hanterat ovan, och
  // andradAv/andrad är bokföring som inte hör hemma på själva frågan.
  const METADATA = new Set(["dold", "andradAv", "andrad"]);
  const rensat = Object.fromEntries(
    Object.entries(overlagring).filter(
      ([nyckel, varde]) => !METADATA.has(nyckel) && varde !== undefined
    )
  );
  const harAndring = Object.keys(rensat).length > 0;

  return {
    ...global,
    ...rensat,
    kalla: global.kalla ?? null,
    kallaDatum: global.kallaDatum ?? null,
    overlagrad: harAndring,
  };
}

/**
 * Bygger den fullständiga, synliga frågebanken för en organisation.
 *
 * @param globalaFragor  [{ id, paket, fraga, alternativ, rattIndex, hanvisning, kategori, kalla, kallaDatum }]
 * @param overlagringar  { [fragaId]: { dold?, fraga?, alternativ?, rattIndex?, hanvisning? } }
 * @param egnaFragor     [{ id, fraga, alternativ, rattIndex, hanvisning, kategori }]
 * @param kundensVal     organisationer/{orgId}.kvisspaket, t.ex. { kliniskt: false }
 * @param globaltStopp   { [paket]: { avstangt: bool } }
 */
export function byggKvissbank({
  globalaFragor = [],
  overlagringar = {},
  egnaFragor = [],
  kundensVal = {},
  globaltStopp = {},
} = {}) {
  const franLeverantoren = globalaFragor
    .filter((f) => paketAktivt(f.paket, kundensVal, globaltStopp))
    .map((f) => slaIhopFraga(f, overlagringar[f.id]))
    .filter(Boolean);

  const egna = paketAktivt(PAKET.EGET, kundensVal, globaltStopp)
    ? egnaFragor.map((f) => ({ ...f, paket: PAKET.EGET, overlagrad: false }))
    : [];

  return [...franLeverantoren, ...egna];
}

// Vilka paket som faktiskt har minst en synlig fråga just nu. Används för att inte visa en
// paketknapp som ger ett tomt övningspass.
export function paketMedInnehall(bank) {
  return [...new Set(bank.map((f) => f.paket))];
}
