// Etapp L1e, punkt 4 "Åtgärdstidslinje": vad som stoppats och startats, av vem, när. Ingen ny
// logg (krav 39) – bara ett filter ovanpå de poster hamtaLeverantorsAtgardslogg redan
// returnerar, avgränsat till de händelsetyper som faktiskt rör en nödstopps- eller
// pausningsåtgärd.
export const NODSTOPP_HANDELSETYPER = [
  "epost_avstangd_globalt",
  "epost_paslagen_globalt",
  "kvisspaket_globalt_stoppat",
  "kvisspaket_globalt_aterstartat",
  "organisation_pausad",
  "organisation_atveraktiverad",
  "anvandare_utloggning_tvingad",
];

export function filtreraAtgardstidslinje(poster) {
  return (poster ?? []).filter((p) => NODSTOPP_HANDELSETYPER.includes(p.handelsetyp));
}
