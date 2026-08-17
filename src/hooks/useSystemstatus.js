// Etapp 46: senaste kända resultatet av den nattliga hashkedjekontrollen
// (functions/revisionslogg.js verifieraRevisionskedjor), skrivet VARJE körning – inte bara vid
// en avvikelse – så att "kedjan är intakt" går att skilja från "jobbet slutade köras".
//
// SÄKERHETSFIX (granskning 2026-08-17, Del 2 – fynd 2.1): läste tidigare det GLOBALA
// dokumentet systemstatus/revisionskedja. Två problem med det:
//   1. Dokumentet innehöll en lista över varje avvikande organisations ID, och var läsbart av
//      varje kunds superadmin – alltså läckte leverantörens kundlista och andra kunders
//      integritetslarm till alla.
//   2. `alletGiltigt` var en GLOBAL dom. Kund A såg "🔴 Avvikelse upptäckt" när kund B:s kedja
//      brast – vilseledande om den egna statusen, vilket är hela poängen med vyn.
// Läser nu organisationens EGEN status på organisationer/{orgId}.revisionskedja, som redan är
// läsbar bara för den egna organisationen och plattformsadmin.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useSystemstatus() {
  const { organisationId } = useAuth();
  const [revisionskedja, setRevisionskedja] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => {
        setRevisionskedja(snap.exists() ? (snap.data().revisionskedja ?? null) : null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({
          collection: "organisationer",
          organisationId,
          sokvag: "revisionskedja",
          fel: error,
        });
      },
    );
    return unsubscribe;
  }, [organisationId]);

  return { revisionskedja, fel };
}
