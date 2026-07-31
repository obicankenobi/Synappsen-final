// Favoriter – varje användare kan stjärnmärka rutiner/förrådsartiklar för snabb åtkomst.
// Sparas som en array av "typ:id"-strängar direkt på users/{uid}.
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function favoritNyckel(typ, id) {
  return `${typ}:${id}`;
}

export function useFavoriter(uid) {
  const [favoriter, setFavoriter] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setFavoriter(snap.data()?.favoriter ?? []);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "users", organisationId: undefined, fel: error });
      },
    );
    return unsubscribe;
  }, [uid]);

  async function laggTillFavorit(typ, id) {
    return updateDoc(doc(db, "users", uid), {
      favoriter: arrayUnion(favoritNyckel(typ, id)),
    });
  }

  async function taBortFavorit(typ, id) {
    return updateDoc(doc(db, "users", uid), {
      favoriter: arrayRemove(favoritNyckel(typ, id)),
    });
  }

  function arFavorit(typ, id) {
    return favoriter.includes(favoritNyckel(typ, id));
  }

  return { favoriter, fel, laggTillFavorit, taBortFavorit, arFavorit };
}
