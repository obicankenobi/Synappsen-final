// Etapp 15e: läser organisationens provperiodSlut (organisationer/{orgId}) så en banner kan
// varna 14/7/1 dag innan – samma dokument som skrivs av satProvperiod/plattformsadmin, ingen
// egen collection. Den faktiska pausningen sker server-side (kontrolleraProvperioderSchemalagt
// i functions/index.js), det här är bara den mjuka UI-varningen innan dess.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

const DAG_MS = 24 * 60 * 60 * 1000;

export function useProvperiod() {
  const { organisationId, role } = useAuth();
  const [provperiodSlut, setProvperiodSlut] = useState(undefined);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => {
        setProvperiodSlut(snap.data()?.provperiodSlut ?? null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "provperiod", fel: error });
      },
    );
  }, [organisationId, role]);

  if (!provperiodSlut) {
    return { provperiodSlut: null, dagarKvar: null, fel };
  }
  const nu = new Date();
  const dagarKvar = Math.ceil((new Date(`${provperiodSlut}T23:59:59`).getTime() - nu.getTime()) / DAG_MS);
  return { provperiodSlut, dagarKvar, fel };
}
