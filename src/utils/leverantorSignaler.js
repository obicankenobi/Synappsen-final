// Etapp 67c (ETAPPLAN16.md): den delade signalberäkningen bakom "kräver åtgärd"-listan.
// Delad med NyckeltalSektion (67b), som bara visar ANTALET, för att inte duplicera samma
// sex/sju villkor på två ställen – exakt det mönster projektet redan följer för
// utils/kompetensStatus.js (delad mellan flera vyer).
//
// Alla sju signaler är verifierade mot faktisk kod i premisskontrollen (ETAPPLAN16.md fynd 6):
// fem fanns redan i listaOrganisationer-svaret, en sjätte (stillastående offert) blev byggbar
// efter Etapp 67 beslutspunkt 2 (avtalsstatusAndrad/skapad, v5.109.0).
export const SIGNAL_ALLVARLIGHET = {
  HOG: "hog",
  MEDEL: "medel",
  LAG: "lag",
};

const ALLVARLIGHET_ORDNING = {
  [SIGNAL_ALLVARLIGHET.HOG]: 0,
  [SIGNAL_ALLVARLIGHET.MEDEL]: 1,
  [SIGNAL_ALLVARLIGHET.LAG]: 2,
};

// Samma tröskel som den globala sökkvot-varningen redan använder, se Leverantor.jsx.
const SOKKVOT_VARNINGSANDEL = 0.8;
const PROVPERIOD_VARNINGSFONSTER_DAGAR = 14;
// Ingen etablerad branschnorm att luta sig mot – 30 dagar är en rimlig, redigerbar
// utgångspunkt för "har ägaren glömt bort den här offerten?". Inte hämtad ur någon plan-text,
// bara ett rimligt förstaval.
const OFFERT_STILLASTAENDE_DAGAR = 30;

function dagarMellan(fran, till) {
  return Math.floor((till.getTime() - fran.getTime()) / (24 * 60 * 60 * 1000));
}

// nu injiceras (istället för att läsas via `new Date()` inne i funktionen) så att testerna
// kan styra "idag" deterministiskt, samma mönster som utils/kompetensStatus.js.
export function berakLeverantorSignaler(organisationer, sokkvot, nu = new Date()) {
  const signaler = [];

  for (const org of organisationer ?? []) {
    // Genomgående krav 29: demo-organisationen nollställs varje natt och pausas/återupplivas
    // av ett eget flöde – dess provperioder/sökkvot/pausning är aldrig något leverantören
    // ska agera på.
    if (org.arDemo) continue;

    if (org.raderingSchemalagdTill) {
      signaler.push({
        orgId: org.orgId,
        orgNamn: org.namn,
        typ: "radering_schemalagd",
        allvarlighet: SIGNAL_ALLVARLIGHET.HOG,
        text: `Radering schemalagd till ${new Date(org.raderingSchemalagdTill).toLocaleString("sv-SE")}`,
      });
    }

    if (org.provperiodSlut) {
      const dagarKvar = dagarMellan(nu, new Date(`${org.provperiodSlut}T00:00:00`));
      if (dagarKvar < 0) {
        signaler.push({
          orgId: org.orgId,
          orgNamn: org.namn,
          typ: "provperiod_utgangen",
          allvarlighet: SIGNAL_ALLVARLIGHET.HOG,
          text: `Provperioden gick ut ${org.provperiodSlut} – pausas automatiskt av nattens jobb om det inte redan skett`,
        });
      } else if (dagarKvar <= PROVPERIOD_VARNINGSFONSTER_DAGAR) {
        signaler.push({
          orgId: org.orgId,
          orgNamn: org.namn,
          typ: "provperiod_slutar_snart",
          allvarlighet: SIGNAL_ALLVARLIGHET.MEDEL,
          text:
            dagarKvar === 0
              ? "Provperioden går ut idag"
              : `Provperioden går ut om ${dagarKvar} dag${dagarKvar === 1 ? "" : "ar"} (${org.provperiodSlut})`,
        });
      }
    }

    const egetTak = org.sokkvotTakPerDygn ?? sokkvot?.orgTakStandard;
    if (egetTak && org.sokkvotIdag >= egetTak * SOKKVOT_VARNINGSANDEL) {
      signaler.push({
        orgId: org.orgId,
        orgNamn: org.namn,
        typ: "sokkvot_nara_tak",
        allvarlighet: SIGNAL_ALLVARLIGHET.MEDEL,
        text: `Nära sökkvottaket: ${org.sokkvotIdag} / ${egetTak} sökningar idag`,
      });
    }

    if (org.supportAtkomstTill && new Date(org.supportAtkomstTill) > nu) {
      signaler.push({
        orgId: org.orgId,
        orgNamn: org.namn,
        typ: "support_aktiv",
        allvarlighet: SIGNAL_ALLVARLIGHET.LAG,
        text: `Supportfönster aktivt till ${new Date(org.supportAtkomstTill).toLocaleString("sv-SE")}`,
      });
    }

    if (org.status === "pausad" && !org.raderingSchemalagdTill) {
      signaler.push({
        orgId: org.orgId,
        orgNamn: org.namn,
        typ: "pausad_utan_radering",
        allvarlighet: SIGNAL_ALLVARLIGHET.MEDEL,
        text: "Pausad, ingen radering schemalagd – kontrollera att det är avsiktligt",
      });
    }

    // Etapp 67 beslutspunkt 2: avtalsstatusAndrad är null för en organisation vars
    // avtalsstatus aldrig ändrats sedan fältet infördes (2026-08-16) – då används skapad som
    // näst bästa referenspunkt, eftersom offert-status per definition sätts vid etablering.
    const senastAndrad = org.avtalsstatusAndrad ?? org.skapad;
    if (org.avtalsstatus === "offert" && senastAndrad) {
      const dagarSedan = dagarMellan(new Date(senastAndrad), nu);
      if (dagarSedan >= OFFERT_STILLASTAENDE_DAGAR) {
        signaler.push({
          orgId: org.orgId,
          orgNamn: org.namn,
          typ: "offert_stillastaende",
          allvarlighet: SIGNAL_ALLVARLIGHET.MEDEL,
          text: `Offert i ${dagarSedan} dagar utan ändring`,
        });
      }
    }
  }

  return signaler.sort((a, b) => ALLVARLIGHET_ORDNING[a.allvarlighet] - ALLVARLIGHET_ORDNING[b.allvarlighet]);
}
