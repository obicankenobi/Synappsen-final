// Hämtning och hantering av förrådsartiklar (CRUD + godkännandeflöde)
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

export const ARTIKEL_STATUS = {
  UTKAST: "utkast",
  GODKAND: "godkand",
};

// Om forrad anges filtreras listan till det förrådet, annars hämtas alla (används av sökmotorn)
export function useForradsartiklar(forrad) {
  const [artiklar, setArtiklar] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const villkor = forrad
      ? [where("forrad", "==", forrad), orderBy("skapad", "desc")]
      : [orderBy("skapad", "desc")];
    const q = query(collection(db, "forradsartiklar"), ...villkor);
    const unsubscribe = onSnapshot(q, (snap) => {
      setArtiklar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [forrad]);

  async function skapaArtikel({
    namn,
    skap,
    hylla,
    antal,
    bildUrl,
    forrad: forradFalt,
    skapadAv,
    kraverGodkannande = false,
  }) {
    return addDoc(collection(db, "forradsartiklar"), {
      namn,
      skap: skap || null,
      hylla: hylla || null,
      antal: antal || null,
      sokord: [],
      bildUrl: bildUrl ?? null,
      forrad: forradFalt,
      status: kraverGodkannande ? ARTIKEL_STATUS.UTKAST : ARTIKEL_STATUS.GODKAND,
      kalla: "manuell",
      skapadAv,
      skapad: serverTimestamp(),
    });
  }

  async function uppdateraArtikel(id, falt) {
    return updateDoc(doc(db, "forradsartiklar", id), falt);
  }

  async function godkannArtikel(id) {
    return updateDoc(doc(db, "forradsartiklar", id), { status: ARTIKEL_STATUS.GODKAND });
  }

  async function taBortArtikel(id) {
    return deleteDoc(doc(db, "forradsartiklar", id));
  }

  return { artiklar, laddar, skapaArtikel, uppdateraArtikel, godkannArtikel, taBortArtikel };
}
