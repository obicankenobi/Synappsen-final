// Etapp L1h (intern/ETAPPLAN-INTERN-1.md): onboarding-pipelinen. avtalsstatus och
// avtalsstatusAndrad finns redan i listaOrganisationer-svaret (Etapp 67 beslutspunkt 2) –
// det här är bara en gruppering och en åldersberäkning ovanpå, ingen ny datakälla.
//
// Samma "ålder"-mönster som signalen offert_stillastaende i leverantorSignaler.js redan
// använder: avtalsstatusAndrad ?? skapad, eftersom fältet är null för organisationer vars
// avtalsstatus aldrig ändrats sedan det infördes (2026-08-16) – skapad är näst bästa
// referenspunkt då, eftersom offert-status per definition sätts vid etablering.
export const PIPELINE_ORDNING = ["offert", "signerat", "aktiv", "pausad", "avslutad"];

function dagarMellan(fran, till) {
  return Math.floor((till.getTime() - fran.getTime()) / (24 * 60 * 60 * 1000));
}

// Grupperar organisationer efter avtalsstatus, med ålder i nuvarande steg. Demo-organisationen
// utesluts av samma skäl som i leverantorSignaler.js (genomgående krav 29) – dess status styrs
// av ett eget nollställningsflöde, inte av en människas beslut om en riktig kund.
export function grupperaPipeline(organisationer, nu = new Date()) {
  const grupper = new Map(PIPELINE_ORDNING.map((status) => [status, []]));

  for (const org of organisationer ?? []) {
    if (org.arDemo) continue;
    const lista = grupper.get(org.avtalsstatus);
    if (!lista) continue; // okänd/saknad avtalsstatus – visas inte i pipelinen, syns ändå i listan

    const referens = org.avtalsstatusAndrad ?? org.skapad;
    const dagarISteg = referens ? dagarMellan(new Date(referens), nu) : null;
    lista.push({ orgId: org.orgId, orgNamn: org.namn, dagarISteg });
  }

  for (const lista of grupper.values()) {
    // Äldst i steget överst – det är den som mest sannolikt glömts bort.
    lista.sort((a, b) => (b.dagarISteg ?? -1) - (a.dagarISteg ?? -1));
  }

  return PIPELINE_ORDNING.map((status) => ({ status, organisationer: grupper.get(status) }));
}
