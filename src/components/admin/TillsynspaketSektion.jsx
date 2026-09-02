import { useState } from "react";
import { verifieraRevisionslogg } from "../../firebase/functions";
import { kvitteringsgradPerRutin } from "../../utils/kvitteringsgrad";
import { formateraDatum } from "../../utils/datum";
import { ROLE_LABELS } from "../../firebase/roles";
import { OMRADE_NAMN, formateraTid } from "./adminHjalp";

// Etapp 72d: tillsyns- och revisionspaketet. Ett exportpaket som i ETT steg producerar de
// handlingar en IVO- eller certifieringsrevisor typiskt efterfrågar, istället för att en
// administratör ska behöva leta ihop dem från flera ställen under tidspress.
//
// Premisskontroll (krav 8, gjord innan bygget, se etapplaner/ETAPPLAN19.md 72d): planen
// pekar också ut kompetens-/delegeringsläge (72c), kontrollhistorik (72a), avvikelsestatistik
// (72e) och senaste patientsäkerhetsberättelsen (72b). Ingen av dem finns i kodbasen ännu –
// de sektionerna tas därför med i exporten som EXPLICITA placeholders ("Ej tillgängligt
// ännu"), aldrig som tyst uteslutna. Att låtsas täcka dem vore värre än att inte nämna dem
// alls (samma princip som CLAUDE.md:s dokumentationsregler bygger på).
//
// Client-side-only export, samma mönster som KvitteringarMedDeadlineSektion.jsx: ingen ny
// Cloud Function. Innehållet är ett flersektions-dokument med innehållsförteckning – Markdown
// är därför lämpligare än CSV (som KvitteringarMedDeadlineSektion.jsx använder för sin
// enklare, endimensionella tabell).
function rutinbestandRader(rutiner) {
  return [...rutiner]
    .sort((a, b) => (a.titel ?? "").localeCompare(b.titel ?? "", "sv"))
    .map((r) => {
      const agareText = !r.agare
        ? "Ingen angiven"
        : r.agare.typ === "roll"
          ? ROLE_LABELS[r.agare.roll] ?? r.agare.roll
          : r.agare.namn ?? "Okänd person";
      const giltigText = r.utgangsdatum ? formateraDatum(new Date(r.utgangsdatum)) : "Ej satt";
      const granskadText = r.granskadDatum ? formateraDatum(r.granskadDatum) : "Aldrig granskad";
      return `| ${r.titel} | ${OMRADE_NAMN[r.omrade] ?? r.omrade} | ${agareText} | ${giltigText} | ${granskadText} |`;
    });
}

function kvitteringsRader(rutiner, antalAnvandare) {
  return kvitteringsgradPerRutin(rutiner, antalAnvandare).map(
    (k) => `| ${k.titel} | ${k.antalKvitterat} / ${k.antalTotalt} | ${k.andel ?? "–"} % |`
  );
}

function byggMarkdown({ organisationId, rutiner, antalAnvandare, revisionsloggResultat }) {
  const nu = new Date().toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
  const revisionsloggText = !revisionsloggResultat
    ? "Ej verifierad i samband med den här exporten."
    : revisionsloggResultat.giltig
      ? `Intakt – hashkedjan verifierades utan avvikelse (${formateraTid(revisionsloggResultat.senastKord) || nu}).`
      : `⚠️ Avvikelse upptäckt${revisionsloggResultat.orsak ? `: ${revisionsloggResultat.orsak}` : ""}.`;

  return `# Tillsyns- och revisionspaket

Organisation: ${organisationId ?? "okänd"}
Genererat: ${nu}

## Innehållsförteckning

1. Rutinbestånd – ägare, giltighet och granskningsdatum
2. Kvitteringsläge per rutin
3. Kompetens- och delegeringsläge
4. Kontrollhistorik
5. Avvikelsestatistik
6. Revisionsloggens verifierade kedja
7. Senaste patientsäkerhetsberättelsen

## 1. Rutinbestånd

| Titel | Område | Ansvarig | Giltig till | Senast granskad |
|---|---|---|---|---|
${rutinbestandRader(rutiner).join("\n")}

## 2. Kvitteringsläge per rutin

| Titel | Kvitterat | Andel |
|---|---|---|
${kvitteringsRader(rutiner, antalAnvandare).join("\n")}

## 3. Kompetens- och delegeringsläge

Ej tillgängligt ännu — kräver delmål 72c (kompetens- och delegeringsläge), som inte är byggt.

## 4. Kontrollhistorik

Ej tillgängligt ännu — kräver delmål 72a (kontrollsystem/loggbok), som inte är byggt.

## 5. Avvikelsestatistik

Ej tillgängligt ännu — kräver delmål 72e (avvikelsestatistik), som inte är byggt.

## 6. Revisionsloggens verifierade kedja

${revisionsloggText}

## 7. Senaste patientsäkerhetsberättelsen

Ej tillgängligt ännu — kräver delmål 72b (patientsäkerhetsberättelse), som inte är byggt.
`;
}

export default function TillsynspaketSektion({ rutiner, anvandare, organisationId }) {
  const [verifierar, setVerifierar] = useState(false);
  const [revisionsloggResultat, setRevisionsloggResultat] = useState(null);
  const [fel, setFel] = useState(null);

  async function hanteraExportera() {
    setVerifierar(true);
    setFel(null);
    let resultat = null;
    try {
      const { data } = await verifieraRevisionslogg(organisationId);
      resultat = data;
      setRevisionsloggResultat(data);
    } catch (e) {
      setFel(
        "Kunde inte verifiera revisionsloggens kedja just nu – paketet exporteras ändå, " +
          "men det avsnittet markeras som overifierat. (" + (e.message ?? "okänt fel") + ")"
      );
    } finally {
      setVerifierar(false);
    }

    const markdown = byggMarkdown({
      organisationId,
      rutiner,
      antalAnvandare: anvandare.length,
      revisionsloggResultat: resultat,
    });
    const blob = new Blob(["﻿" + markdown], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tillsynspaket-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>📑 Tillsyns- och revisionspaket</h2></summary>
      <p className="sida__beskrivning">
        Ett exportpaket som i ett steg producerar de handlingar en IVO- eller
        certifieringsrevisor typiskt efterfrågar: rutinbestånd med ägare, giltighet och
        granskningsdatum, kvitteringsläge per rutin och revisionsloggens verifierade kedja.
        Med innehållsförteckning och tidsstämpel. Avsnitt som kräver delmål som inte är byggda
        ännu (kompetens-/delegeringsläge, kontrollhistorik, avvikelsestatistik,
        patientsäkerhetsberättelse) markeras tydligt som "Ej tillgängligt ännu" i stället för
        att utelämnas tyst.
      </p>
      <button
        type="button"
        className="knapp knapp--sekundar"
        onClick={hanteraExportera}
        disabled={verifierar}
      >
        {verifierar ? "Verifierar revisionslogg och bygger paket..." : "📥 Exportera tillsynspaket (Markdown)"}
      </button>
      {fel && <p className="klinikfraga__fel">{fel}</p>}
      {revisionsloggResultat && (
        <p className="sida__beskrivning">
          Revisionslogg vid senaste export: {revisionsloggResultat.giltig ? "🟢 Intakt" : "🔴 Avvikelse upptäckt"}
        </p>
      )}
    </details>
  );
}
