// Etapp 67d (ETAPPLAN16.md): sortering/filtrering/sök som ren klientlogik på redan hämtad
// data (premisskontrollen bekräftade att ingen ny läsväg krävs). Separerad från
// Leverantor.jsx av samma skäl som leverantorSignaler.js (67b/67c) – logik i utils, rena
// komponenter för rendering, och testbart utan att montera React.

export const SORT_FALT = {
  NAMN: "namn",
  ANVANDARE: "anvandare",
  PRIS: "pris",
  KOSTNAD: "kostnad",
  PROVPERIOD: "provperiod",
};

const SORT_VARDE = {
  [SORT_FALT.NAMN]: (o) => o.namn ?? "",
  [SORT_FALT.ANVANDARE]: (o) => o.antalAnvandare ?? null,
  [SORT_FALT.PRIS]: (o) => o.avtaladArsavgiftKr ?? null,
  [SORT_FALT.KOSTNAD]: (o) => o.senasteKostnad?.anvantOre ?? null,
  [SORT_FALT.PROVPERIOD]: (o) => o.provperiodSlut ?? null,
};

// Snabbfiltren (67b:s nyckeltalsrutor) är en ANNAN dimension än de detaljerade filtren nedan
// och kombineras med AND, inte ersätts av dem – se 67b:s "Genomfört" för varför snabbfilter
// byggdes som en bestående variabel.
function matcharSnabbfilter(org, snabbfilter, idagIso, orgIdMedSignal) {
  if (!snabbfilter) return true;
  if (org.arDemo) return false;
  if (snabbfilter === "aktiva") return org.status === "aktiv";
  if (snabbfilter === "provperiod") return Boolean(org.provperiodSlut) && org.provperiodSlut >= idagIso;
  if (snabbfilter === "atgard") return orgIdMedSignal.has(org.orgId);
  return true;
}

export function filtreraOchSorteraOrganisationer(organisationer, filter, orgIdMedSignal = new Set()) {
  const {
    snabbfilter = null,
    status = "",
    avtalsstatus = "",
    modul = "",
    visaDemo = true,
    sok = "",
    sortField = SORT_FALT.NAMN,
    sortRiktning = "asc",
  } = filter ?? {};

  const idagIso = new Date().toISOString().slice(0, 10);
  const sokLc = sok.trim().toLowerCase();

  const filtrerade = (organisationer ?? []).filter((org) => {
    if (!visaDemo && org.arDemo) return false;
    if (!matcharSnabbfilter(org, snabbfilter, idagIso, orgIdMedSignal)) return false;
    if (status && org.status !== status) return false;
    if (avtalsstatus && org.avtalsstatus !== avtalsstatus) return false;
    if (modul && !org.moduler?.[modul]) return false;
    if (sokLc) {
      const traff = org.namn?.toLowerCase().includes(sokLc) || org.huvudman?.toLowerCase().includes(sokLc);
      if (!traff) return false;
    }
    return true;
  });

  const varde = SORT_VARDE[sortField] ?? SORT_VARDE[SORT_FALT.NAMN];
  const riktning = sortRiktning === "desc" ? -1 : 1;
  return [...filtrerade].sort((a, b) => {
    const va = varde(a);
    const vb = varde(b);
    // Saknade värden sist, oavsett sorteringsriktning – annars hoppar "avtalat pris fallande"
    // förvirrande mellan "högst pris" och "inget pris ifyllt" beroende på riktning.
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va < vb) return -1 * riktning;
    if (va > vb) return 1 * riktning;
    return 0;
  });
}
