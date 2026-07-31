// Feedback/förslag från användare – endast superadmin kan läsa hela listan, alla inloggade
// kan skicka in och se sina egna inskick (inklusive ev. svar/status från superadmin)
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { skickaFeedback as skickaFeedbackAnrop } from "../firebase/functions";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

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
  const { organisationId, role } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [laddar, setLaddar] = useState(Boolean(laddaLista));
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "feedback"),
      where("organisationId", "==", organisationId),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "feedback", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  // Skickas via en Cloud Function (inte en direkt Firestore-skrivning) så att personnummer-
  // spärren och hastighetsbegränsningen körs server-side.
  async function skickaFeedback({ typ, text }) {
    return skickaFeedbackAnrop({ typ, text });
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

  return { feedback, laddar, fel, skickaFeedback, taBortFeedback, uppdateraFeedbackStatus, svaraPaFeedback };
}

// Egna tidigare inskick, för att se status/svar på det man skickat in själv
export function useMinaFeedback(uid) {
  const { organisationId, role } = useAuth();
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (!uid || !organisationId) return undefined;
    const q = query(
      collection(db, "feedback"),
      where("organisationId", "==", organisationId),
      where("skapadAv", "==", uid),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        rapporteraNekadListning({ collection: "feedback", roll: role, organisationId, sokvag: "mina-feedback", fel: error });
      },
    );
    return unsubscribe;
  }, [uid, organisationId, role]);

  return feedback;
}
