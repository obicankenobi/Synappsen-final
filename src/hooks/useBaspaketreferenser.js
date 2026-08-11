// Etapp 64 (ETAPPLAN13.md), scaffolding-fasen. Ren CRUD mot baspaketreferenser – hela
// säkerheten ligger i firestore.rules (plattformsadmin-bara, se den filens motivering).
// Ingen organisationsskopning: collectionen är avsiktligt inte kopplad till någon enskild
// kund än, den är leverantörens EGNA interna arbetsmaterial under juridisk granskning.
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useBaspaketreferenser() {
  const { currentUser } = useAuth();
  const [referenser, setReferenser] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "baspaketreferenser"), orderBy("tillagd", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setReferenser(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
      }
    );
    return unsubscribe;
  }, []);

  async function laggTillReferens({ titel, utgivare, kalldatum, url, kategori }) {
    return addDoc(collection(db, "baspaketreferenser"), {
      titel,
      utgivare,
      kalldatum,
      url,
      kategori,
      tillagd: serverTimestamp(),
      tillagdAv: currentUser?.uid,
    });
  }

  async function uppdateraReferens(id, { titel, utgivare, kalldatum, url, kategori }) {
    return updateDoc(doc(db, "baspaketreferenser", id), { titel, utgivare, kalldatum, url, kategori });
  }

  async function taBortReferens(id) {
    return deleteDoc(doc(db, "baspaketreferenser", id));
  }

  return { referenser, laddar, fel, laggTillReferens, uppdateraReferens, taBortReferens };
}
