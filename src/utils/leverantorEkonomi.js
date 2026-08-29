// Etapp L1i (intern/ETAPPLAN-INTERN-1.md): ekonomisk överblick. Alla delar finns redan i
// listaOrganisationer-svaret (avtaladArsavgiftKr, senasteKostnad, kostnadshistorikSenaste) –
// det här är bara en sammanställning, ingen ny datakälla (krav 39).
//
// Avgränsning (redan i planen): ingen fakturering, ingen bokföringsintegration. Underlag,
// inte ekonomisystem.
const ORE_PER_KRONA = 100;
const MANADER_PER_AR = 12;

function kostnadKr(kostnadspost) {
  return kostnadspost ? kostnadspost.anvantOre / ORE_PER_KRONA : 0;
}

// "up"/"down"/"stable"/null (null = inte tillräckligt med data för en riktning).
function berakTrend(kostnadshistorikSenaste) {
  if (!kostnadshistorikSenaste || kostnadshistorikSenaste.length < 2) return null;
  const [senaste, foregaende] = kostnadshistorikSenaste;
  if (senaste.anvantOre > foregaende.anvantOre) return "up";
  if (senaste.anvantOre < foregaende.anvantOre) return "down";
  return "stable";
}

export function beraknaEkonomiOversikt(organisationer) {
  const riktiga = (organisationer ?? []).filter((o) => !o.arDemo);

  const perKund = riktiga.map((org) => {
    const arsavgiftKr = org.avtaladArsavgiftKr ?? null;
    const senasteKostnadKr = kostnadKr(org.senasteKostnad);
    // Marginal = (årsavgift / 12) - senaste månadens AI-kostnad. null om priset saknas –
    // en marginal räknad mot ett okänt pris hade varit en gissning som ser ut som en siffra.
    const marginalKr = arsavgiftKr !== null ? arsavgiftKr / MANADER_PER_AR - senasteKostnadKr : null;
    return {
      orgId: org.orgId,
      orgNamn: org.namn,
      arsavgiftKr,
      senasteKostnadKr,
      marginalKr,
      trend: berakTrend(org.kostnadshistorikSenaste),
    };
  });

  const medPris = perKund.filter((k) => k.arsavgiftKr !== null);
  const utanPris = perKund.filter((k) => k.arsavgiftKr === null);
  const arrSummaKr = medPris.reduce((s, k) => s + k.arsavgiftKr, 0);
  const snittArrKr = medPris.length > 0 ? arrSummaKr / medPris.length : 0;
  const negativMarginal = perKund.filter((k) => k.marginalKr !== null && k.marginalKr < 0);

  return {
    arrSummaKr,
    snittArrKr,
    antalMedPris: medPris.length,
    antalUtanPris: utanPris.length,
    orgUtanPris: utanPris,
    perKund: [...perKund].sort((a, b) => (b.arsavgiftKr ?? -1) - (a.arsavgiftKr ?? -1)),
    negativMarginal,
  };
}
