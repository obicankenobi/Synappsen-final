// Läser organisationer/{orgId}s namn samt en eventuellt schemalagd radering (Etapp 49a) och/
// eller aktiv supportåtkomst (Etapp 50b), i EN gemensam lyssnare – RaderaOrganisationSektion
// och SupportatkomstSektion visas alltid tillsammans i /admin, så två separata onSnapshot mot
// exakt samma dokument vore bara en extra uppkoppling utan vinst. Samma live-status kan visas
// i leverantörsvyn via listaOrganisationer (server-side), som redan har sin egen väg dit.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useOrganisationsstatus(organisationId) {
  const [namn, setNamn] = useState(null);
  const [raderingSchemalagdTill, setRaderingSchemalagdTill] = useState(null);
  const [raderingBegardAv, setRaderingBegardAv] = useState(null);
  const [raderingAnledning, setRaderingAnledning] = useState(null);
  const [supportAtkomstTill, setSupportAtkomstTill] = useState(null);
  const [supportAtkomstAnledning, setSupportAtkomstAnledning] = useState(null);
  // Etapp L1p punkt 5: en begäran leverantören gjort om referensunderlag – kunden utför
  // fortfarande exporten själv, med eget samtycke (se ReferensunderlagSektion.jsx).
  const [referensunderlagBegart, setReferensunderlagBegart] = useState(null);
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
        setSupportAtkomstTill(data.supportAtkomstTill ?? null);
        setSupportAtkomstAnledning(data.supportAtkomstAnledning ?? null);
        setReferensunderlagBegart(data.referensunderlagBegart ?? null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", organisationId, sokvag: "organisationsstatus", fel: error });
      },
    );
  }, [organisationId]);

  return {
    namn,
    raderingSchemalagdTill,
    raderingBegardAv,
    raderingAnledning,
    supportAtkomstTill,
    supportAtkomstAnledning,
    referensunderlagBegart,
    fel,
  };
}
