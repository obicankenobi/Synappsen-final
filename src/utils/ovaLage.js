// Etapp 65d: rent klientberäknade hjälpfunktioner för öva-läget – slumpar frågor ur flera
// rutiners kviss-banker för ett sammanhängande övningspass. Delar filtreringsprincipen med
// valjVeckansFraga() (godkänd, ej arkiverad, kviss.length > 0), men utan det veckostabila
// hash-urvalet – ett pass ska slumpa ett NYTT urval varje gång, inte samma fråga hela veckan.
//
// Krav 14 gäller även här: ingen av dessa funktioner sparar eller läser något svar – de
// bygger bara upp och slumpar en lista av frågor som redan finns i rutinernas kviss-fält.

// Bygger poolen av ALLA kvalificerande frågor, en post per fråga (inte per rutin) – en rutin
// med tre kvissfrågor bidrar med tre poster till poolen.
//
// kategori: valfri, filtrerar på fraga.kategori (se src/data/kvissbank.js). Fältet finns bara
// på frågor som lagts till via frågebanken (RutinFormular.jsx) – AI-föreslagna och
// handskrivna frågor saknar det och exkluderas alltså av ett kategorifilter, men syns som
// vanligt när kategori är null/"blandat".
export function byggFragepool(rutiner, omrade, kategori = null) {
  return rutiner
    .filter(
      (r) =>
        r.status === "godkand" &&
        r.arkiverad !== true &&
        Array.isArray(r.kviss) &&
        r.kviss.length > 0 &&
        (omrade === "blandat" || r.omrade === omrade)
    )
    .flatMap((r) =>
      r.kviss.map((fraga, frageIndex) => ({
        rutinId: r.id,
        rutinTitel: r.titel,
        omrade: r.omrade,
        frageIndex,
        fraga,
      }))
    )
    .filter((post) => !kategori || post.fraga.kategori === kategori);
}

// Vilka kategorier (ur kvissbank.js) som faktiskt förekommer i den aktuella poolen, i den
// ordning de definieras där. Används för att bara visa kategoriknappar som ger träffar –
// annars vore de flesta knapparna tomma i en organisation utan bankfrågor.
export function tillgangligaKategorier(rutiner, omrade) {
  const poolUtanKategorifilter = byggFragepool(rutiner, omrade);
  const forekommer = new Set(
    poolUtanKategorifilter.map((post) => post.fraga.kategori).filter(Boolean)
  );
  return [...forekommer];
}

// Fisher-Yates – slumpar ordningen och plockar de första `antal` posterna. Ren
// icke-kryptografisk slump (Math.random) är fullt tillräckligt för ordningen på ett
// övningspass, samma bedömning som gäller offlineKo.js:s tillfälliga id-generering.
export function slumpaFragor(pool, antal) {
  const kopia = [...pool];
  for (let i = kopia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopia[i], kopia[j]] = [kopia[j], kopia[i]];
  }
  return kopia.slice(0, antal);
}
