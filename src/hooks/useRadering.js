// Etapp 49a: läser organisationer/{orgId}s namn (för "skriv namnet"-bekräftelsen) och en
// eventuellt schemalagd radering, så både kundens egen adminpanel och leverantörsvyn kan visa
// samma live-status. Samma mönster som useProvperiod.js.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useRadering(organisationId) {
  const [namn, setNamn] = useState(null);
  const [raderingSchemalagdTill, setRaderingSchemalagdTill] = useState(null);
  const [raderingBegardAv, setRaderingBegardAv] = useState(null);
  const [raderingAnledning, setRaderingAnledning] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => {
        const data = snap.data() ?? {};
        setNamn(data.namn ?? null);
        setRaderingSchemalagdTill(data.raderingSchemalagdTill ?? null);
        setRaderingBegardAv(data.raderingBegardAv ?? null);
        setRaderingAnledning(data.raderingAnledning ?? null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", organisationId, sokvag: "radering", fel: error });
      },
    );
  }, [organisationId]);

  return { namn, raderingSchemalagdTill, raderingBegardAv, raderingAnledning, fel };
}
