// Etapp 66b: en handledares bekräftelse att en introduktionspunkt faktiskt gåtts igenom med
// personen – skild från personens egen lasteAv-kvittering (se introduktionProgress.js).
// introduktionstilldelningar/{uid} valdes uttryckligen bort från att lagra en parallell
// "klar"-status (Etapp 19a); det här är INTE en dubblett av det beslutet, utan en oberoende
// ANDRA bekräftelse från en annan person – därför en egen subcollection, inte ett fält på
// tilldelningen.
import { useEffect, useState } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { loggaHandelse } from "./useAuditlogg";
import { rapporteraNekadListning } from "../firebase/felrapportering";

// Samma "{typ}:{id}"-konvention som innehallMap i Introduktion.jsx redan använder för att slå
// upp en posts innehåll. Ett deterministiskt dokument-id gör dubbelsignering omöjlig utan en
// egen kontroll i klienten: ett andra setDoc-försök mot samma nyckel är ur reglernas
// perspektiv en UPDATE (dokumentet finns redan), och update är stängd nedan.
export function postNyckel(postTyp, postId) {
  return `${postTyp}:${postId}`;
}

export function useIntroduktionssigneringar(uid) {
  const { organisationId, role } = useAuth();
  const [signeringar, setSigneringar] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    const unsubscribe = onSnapshot(
      collection(db, "introduktionstilldelningar", uid, "signeringar"),
      (snap) => {
        setSigneringar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({
          collection: "introduktionstilldelningar/signeringar",
          roll: role,
          organisationId,
          sokvag: uid,
          fel: error,
        });
      },
    );
    return unsubscribe;
  }, [uid, role, organisationId]);

  return { signeringar, laddar, fel };
}

export async function signeraIntroduktionspost({ uid, postTyp, postId, etappNamn, signeradAv, signeradAvNamn, organisationId }) {
  await setDoc(doc(db, "introduktionstilldelningar", uid, "signeringar", postNyckel(postTyp, postId)), {
    postTyp,
    postId,
    etappNamn,
    signeradAv,
    signeradAvNamn: signeradAvNamn ?? "",
    tidpunkt: serverTimestamp(),
  });
  loggaHandelse({
    beskrivning: `Introduktionspunkt signerad (${etappNamn})`,
    entitetTyp: "introduktionstilldelning",
    entitetId: uid,
    uid: signeradAv,
    organisationId,
  });
}

// Rättar ett misstag – en signatur ändras aldrig, den kan bara tas bort och signeras om.
// Begränsad till farHanteraAnslag() i reglerna, se firestore.rules.
export async function taBortSignering({ uid, nyckel, etappNamn, raderadAv, organisationId }) {
  await deleteDoc(doc(db, "introduktionstilldelningar", uid, "signeringar", nyckel));
  loggaHandelse({
    beskrivning: `Introduktionssignatur borttagen (${etappNamn})`,
    entitetTyp: "introduktionstilldelning",
    entitetId: uid,
    uid: raderadAv,
    organisationId,
  });
}
