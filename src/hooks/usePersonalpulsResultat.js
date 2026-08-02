// Etapp 39c: läser det aggregerade personalpuls-resultatet. Ägarbeslut 2026-08-02: per område,
// läses av VÖL/sektionsledare (kliniskt-stod), VEC (administration) och superadmin (alla).
// endastOmrade MÅSTE skickas för icke-superadmin – firestore.rules-villkoret
// farRedigeraOmrade(resource.data.omrade) beror på varje dokuments innehåll och går bara att
// bevisa för Firestore om frågan har ett matchande where() (samma "list-provability"-mönster
// som redan dokumenterats för rutiner/förrådsartiklar, se src/firebase/roles.js).
// Sorteras klient-sidan (inte orderBy) – ett fåtal dokument per organisation, ingen anledning
// att kräva ett sammansatt index för det.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function usePersonalpulsResultat(endastOmrade) {
  const { organisationId, role } = useAuth();
  const [resultat, setResultat] = useState([]);

  useEffect(() => {
    if (!organisationId) return undefined;
    const bas = collection(db, "organisationer", organisationId, "personalpulsResultat");
    const q = endastOmrade ? query(bas, where("omrade", "==", endastOmrade)) : query(bas);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => b.kvartal.localeCompare(a.kvartal));
        setResultat(lista);
      },
      (error) => {
        rapporteraNekadListning({ collection: "personalpulsResultat", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role, endastOmrade]);

  return { resultat };
}
