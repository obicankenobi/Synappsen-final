// Etapp 37b: beräknar framsteg för en riktad granskningsrunda. Redovisas per RUTIN och
// OMRÅDE, aldrig som en rankning per person (krav 14 i ETAPPLAN6.md) – skillnaden är liten i
// kod men avgörande i praktiken: en lista över eftersläpande rutiner är ett arbetsverktyg, en
// lista över eftersläpande kollegor är ett övervakningsverktyg.
export function berakningRundaFramsteg(runda, rutinerIOmradet) {
  const rundaSkapadMs = runda.skapad?.toMillis ? runda.skapad.toMillis() : null;
  const poster = [];
  for (const id of runda.rutinIds ?? []) {
    const rutin = rutinerIOmradet.find((r) => r.id === id);
    // Rutinen finns inte längre (borttagen sedan rundan startade) – utanför rundans scope,
    // räknas varken som granskad eller kvarstående.
    if (!rutin) continue;
    const granskadMs = rutin.granskadDatum?.toMillis ? rutin.granskadDatum.toMillis() : null;
    const granskad = rundaSkapadMs != null && granskadMs != null && granskadMs > rundaSkapadMs;
    poster.push({ id, titel: rutin.titel, omrade: rutin.omrade, granskad });
  }
  return {
    total: poster.length,
    granskade: poster.filter((p) => p.granskad).length,
    kvarstar: poster.filter((p) => !p.granskad),
  };
}
