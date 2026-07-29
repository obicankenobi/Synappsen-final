// Etapp 26: medarbetaren föreslår en konkret ändring i en rutin ("min åsikt syns i rutinen"),
// istället för att bara lämna en kommentar ingen är skyldig att göra något med. Ett förslag är
// ALDRIG mer än råmaterial till en människa (26d/MDR-gränsdragning, se SAKERHETSRAPPORT.md) –
// "infört" sätts bara av redaktören själv, aldrig automatiskt.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export const FORSLAG_STATUS = {
  NY: "ny",
  INFORT: "infort",
  AVVISAT: "avvisat",
};

// Fristående funktioner (samma mönster som useLaskvittering.js) – kräver ingen reaktiv
// prenumeration, så en komponent som bara ska SKAPA/HANTERA ett förslag (t.ex. RutinKort.jsx)
// slipper öppna en egen listlyssnare den ändå inte visar något från.
export async function skapaForslag({ organisationId, rutinId, rutinTitel, omrade, markeratStycke, forslag: forslagText, motivering, uid, namn, visaNamnOffentligt }) {
  return addDoc(collection(db, "andringsforslag"), {
    rutinId,
    rutinTitel,
    omrade,
    markeratStycke: markeratStycke ?? "",
    forslag: forslagText,
    motivering: motivering ?? "",
    status: FORSLAG_STATUS.NY,
    foreslagenAv: uid,
    foreslagenAvNamn: namn ?? "",
    visaNamnOffentligt: visaNamnOffentligt !== false,
    organisationId,
    tidpunkt: serverTimestamp(),
  });
}

export async function markeraInfort(forslagId, uid, namn) {
  return updateDoc(doc(db, "andringsforslag", forslagId), {
    status: FORSLAG_STATUS.INFORT,
    hanteradAv: uid,
    hanteradAvNamn: namn ?? "",
    hanteradDatum: serverTimestamp(),
  });
}

export async function avvisaForslag(forslagId, uid, namn, avvisningsMotivering) {
  return updateDoc(doc(db, "andringsforslag", forslagId), {
    status: FORSLAG_STATUS.AVVISAT,
    hanteradAv: uid,
    hanteradAvNamn: namn ?? "",
    hanteradDatum: serverTimestamp(),
    avvisningsMotivering: avvisningsMotivering ?? "",
  });
}

// Reaktiv lista, EN organisation OCH ETT område i taget. Precis som useRutiner(omrade)
// filtrerar frågan på `omrade` redan i where-klausulen – utan det kan inte Firestores
// regelmotor bevisa att farRedigeraOmrade(resource.data.omrade) håller för en `list`-fråga
// (samma constraint som redan gäller för rutiner/{rutinId}), och HELA listningen nekas
// istället för att bara filtrera bort icke-matchande dokument.
export function useAndringsforslag(omrade) {
  const { organisationId } = useAuth();
  const [forslag, setForslag] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId || !omrade) return undefined;
    const q = query(
      collection(db, "andringsforslag"),
      where("organisationId", "==", organisationId),
      where("omrade", "==", omrade)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setForslag(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId, omrade]);

  return { forslag, laddar };
}
