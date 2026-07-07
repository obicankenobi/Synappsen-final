// Feedback/förslag från användare – endast superadmin kan läsa listan, alla inloggade kan skicka in
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
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
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
  }

  async function taBortFeedback(id) {
    return deleteDoc(doc(db, "feedback", id));
  }

  return { feedback, laddar, skickaFeedback, taBortFeedback };
}
