// Etapp 37a: innehållshälsopanelen. Ren sammanställning av data som redan finns på
// rutin-dokumenten – ingen ny insamling, ingen ny collection (se premisskontrollen i
// ETAPPLAN6.md). Bara godkända rutiner räknas: ett utkast är väntat att vara "ofärdigt",
// det är inte samma sak som att innehåll har blivit inaktuellt.
import { borGranskas, arUtgangen } from "./rutinHjalp";

// Två fält från den ursprungliga planen byggs medvetet INTE (premisskontroll 2026-08-01):
// - "aldrig visad": `visningar`-collectionen skrivs bara när en rutin öppnas via sökresultat
//   eller kommandopaletten (se SokFalt.jsx/KommandopalettInnehall.jsx), inte vid vanlig
//   bläddring i en sektion. Den skulle flagga nästan alla rutiner som "aldrig visade" även om
//   personal läser dem dagligen genom att bläddra – en felaktig signal är värre än ingen.
// - "saknade steg trots att checklistläget är påslaget för organisationen": det finns ingen
//   sådan organisationsomfattande växel. Checklistläge är en egenskap per rutin (om `steg`
//   är ifyllt eller inte), inte ett moduläge att slå på/av.
export const HALSOFLAGGOR = [
  "passeratGranskningsdatum",
  "saknarAgare",
  "aldrigKvitterad",
  "obesvaradKallvarning",
  "utgangen",
];

export function berakningHalsa(rutin) {
  return {
    passeratGranskningsdatum: borGranskas(rutin.granskadDatum),
    saknarAgare: !rutin.agare,
    aldrigKvitterad: !Array.isArray(rutin.lasteAv) || rutin.lasteAv.length === 0,
    obesvaradKallvarning: rutin.kallVarning === true,
    utgangen: arUtgangen(rutin),
  };
}

export function antalDagarSedan(tidsstampel) {
  if (!tidsstampel?.toDate) return null;
  const ms = Date.now() - tidsstampel.toDate().getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// En rutins post i hälsopanelen: flaggorna + underlag att visa (ålder, antal flaggor).
export function rutinHalsopost(rutin) {
  const flaggor = berakningHalsa(rutin);
  const antalFlaggor = HALSOFLAGGOR.filter((f) => flaggor[f]).length;
  return {
    id: rutin.id,
    titel: rutin.titel,
    omrade: rutin.omrade,
    aldrDagar: antalDagarSedan(rutin.granskadDatum ?? rutin.skapad),
    flaggor,
    antalFlaggor,
  };
}

// Sammanvägd hälsosiffra: andel rutiner utan en enda flagga. Medvetet INTE en viktad
// poängmodell (t.ex. "varje flagga -5p") – en enkel, begriplig kvot är lättare att räkna om
// i huvudet och därmed svårare att misstro. Siffran ska ALDRIG visas utan nedbrytningen
// (se `sammanstallHalsa`s `nedbrytning`) – kravet står i ETAPPLAN6.md Etapp 37a.
export function sammanstallHalsa(rutiner) {
  // Etapp 37d: en arkiverad rutin ("gäller inte längre") räknas inte in här – den utlöser
  // inget kvitteringskrav och ska inte dra ner hälsosiffran för innehåll som faktiskt är
  // aktuellt.
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  const poster = godkanda.map(rutinHalsopost);
  const total = poster.length;
  const utanFlaggor = poster.filter((p) => p.antalFlaggor === 0).length;

  const nedbrytning = Object.fromEntries(
    HALSOFLAGGOR.map((flagga) => [flagga, poster.filter((p) => p.flaggor[flagga]).length])
  );

  return {
    total,
    utanFlaggor,
    // null (inte 0) när det inte finns någon godkänd rutin alls, så en tom organisation
    // inte visas som om den hade en perfekt hälsosiffra.
    halsosiffra: total > 0 ? Math.round((utanFlaggor / total) * 100) : null,
    nedbrytning,
    poster: poster.sort((a, b) => b.antalFlaggor - a.antalFlaggor),
  };
}
