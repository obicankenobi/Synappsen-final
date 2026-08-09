// Etapp 50b: läser organisationer/{orgId}s eventuellt aktiva supportfönster, så både kundens
// egen adminpanel och leverantörsvyn kan visa samma live-status. Samma mönster som
// useRadering.js/useProvperiod.js.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useSupportatkomst(organisationId) {
  const [namn, setNamn] = useState(null);
  const [supportAtkomstTill, setSupportAtkomstTill] = useState(null);
  const [supportAtkomstAnledning, setSupportAtkomstAnledning] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => {
        const data = snap.data() ?? {};
        setNamn(data.namn ?? null);
        setSupportAtkomstTill(data.supportAtkomstTill ?? null);
        setSupportAtkomstAnledning(data.supportAtkomstAnledning ?? null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", organisationId, sokvag: "supportatkomst", fel: error });
      },
    );
  }, [organisationId]);

  return { namn, supportAtkomstTill, supportAtkomstAnledning, fel };
}
