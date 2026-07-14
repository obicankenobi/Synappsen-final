// Feedback/förslag från användare – endast superadmin kan läsa hela listan, alla inloggade
// kan skicka in och se sina egna inskick (inklusive ev. svar/status från superadmin)
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const FEEDBACK_TYPER = {
  FORSLAG: "forslag",
  BUGG: "bugg",
  ANNAT: "annat",
};

export const FEEDBACK_TYP_LABELS = {
  [FEEDBACK_TYPER.FORSLAG]: "Förslag",
  [FEEDBACK_TYPER.BUGG]: "Bugg/problem",
  [FEEDBACK_TYPER.ANNAT]: "Annat",
};

export const FEEDBACK_STATUS = {
  NY: "ny",
  UNDER_UTREDNING: "under_utredning",
  ATGARDAD: "atgardad",
  AVVISAD: "avvisad",
};

export const FEEDBACK_STATUS_LABELS = {
  [FEEDBACK_STATUS.NY]: "Ny",
  [FEEDBACK_STATUS.UNDER_UTREDNING]: "Under utredning",
  [FEEDBACK_STATUS.ATGARDAD]: "Åtgärdad",
  [FEEDBACK_STATUS.AVVISAD]: "Avvisad",
};

// laddaLista=true hämtar hela listan (endast superadmin har läsbehörighet i Firestore-reglerna)
export function useFeedback(laddaLista) {
  const [feedback, setFeedback] = useState([]);
  const [laddar, setLaddar] = useState(Boolean(laddaLista));

  useEffect(() => {
    if (!laddaLista) return;
    const q = query(collection(db, "feedback"), orderBy("skapad", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [laddaLista]);

  async function skickaFeedback({ typ, text, skapadAv, skapadAvNamn }) {
    return addDoc(collection(db, "feedback"), {
      typ,
      text,
      status: FEEDBACK_STATUS.NY,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
  }

  async function taBortFeedback(id) {
    return deleteDoc(doc(db, "feedback", id));
  }

  async function uppdateraFeedbackStatus(id, status) {
    return updateDoc(doc(db, "feedback", id), { status });
  }

  async function svaraPaFeedback(id, svar) {
    return updateDoc(doc(db, "feedback", id), {
      svar,
      svarDatum: serverTimestamp(),
      status: FEEDBACK_STATUS.ATGARDAD,
    });
  }

  return { feedback, laddar, skickaFeedback, taBortFeedback, uppdateraFeedbackStatus, svaraPaFeedback };
}

// Egna tidigare inskick, för att se status/svar på det man skickat in själv
export function useMinaFeedback(uid) {
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "feedback"), where("skapadAv", "==", uid), orderBy("skapad", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [uid]);

  return feedback;
}
