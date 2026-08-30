// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): EN EGEN kanal till leverantören, skild från
// useFeedback.js (som går till organisationens egen superadmin). Bara "mina inskick" här –
// den fulla, tvärorganisatoriska inkorgen läses av leverantören via hamtaLeverantorsfeedback
// (Cloud Function), inte via en direkt Firestore-lyssnare.
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { skickaLeverantorsfeedback as skickaLeverantorsfeedbackAnrop } from "../firebase/functions";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useMinaLeverantorsfeedback(uid) {
  const [poster, setPoster] = useState([]);

  useEffect(() => {
    if (!uid) return undefined;
    const q = query(
      collection(db, "leverantorsfeedback"),
      where("skapadAv", "==", uid),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => setPoster(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => {
        rapporteraNekadListning({ collection: "leverantorsfeedback", sokvag: "mina-leverantorsfeedback", fel: error });
      }
    );
    return unsubscribe;
  }, [uid]);

  async function skickaLeverantorsfeedback(text) {
    return skickaLeverantorsfeedbackAnrop(text);
  }

  return { poster, skickaLeverantorsfeedback };
}
