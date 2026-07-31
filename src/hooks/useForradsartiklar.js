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
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";

export const ARTIKEL_STATUS = {
  UTKAST: "utkast",
  GODKAND: "godkand",
};

// Om forrad anges filtreras listan till det förrådet, annars hämtas alla (används av sökmotorn)
export function useForradsartiklar(forrad) {
  const { organisationId, role } = useAuth();
  const [artiklar, setArtiklar] = useState([]);
  const [laddar, setLaddar] = useState(true);
  // Etapp 31b (bugfynd, se firebase/roles.js farRedigeraOmrade): läsregeln kräver
  // status=='godkand' OM INTE den inloggade får hantera förrådet – utan ett matchande where()
  // i frågan kan Firestore inte bevisa det och nekar HELA listningen (samma buggklass som
  // rutiner/andringsforslag/bristanmalningar).
  const redaktor = KAN_HANTERA_FORRAD.includes(role);

  useEffect(() => {
    if (!organisationId) return undefined;
    const villkor = [
      where("organisationId", "==", organisationId),
      ...(forrad ? [where("forrad", "==", forrad)] : []),
      ...(redaktor ? [] : [where("status", "==", ARTIKEL_STATUS.GODKAND)]),
      orderBy("skapad", "desc"),
    ];
    const q = query(collection(db, "forradsartiklar"), ...villkor);
    const unsubscribe = onSnapshot(q, (snap) => {
      // Mjukraderade artiklar (papperskorg) filtreras bort ur den vanliga listan
      setArtiklar(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => !a.borttagen));
      setLaddar(false);
    });
    return unsubscribe;
  }, [forrad, organisationId, redaktor]);

  async function skapaArtikel({
    namn,
    skap,
    hylla,
    antal,
    utgangsdatum,
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
      utgangsdatum: utgangsdatum || null,
      sokord: [],
      bildUrl: bildUrl ?? null,
      forrad: forradFalt,
      organisationId: organisationId ?? STANDARD_ORG,
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

  // Mjuk radering – artikeln hamnar i papperskorgen istället för att raderas direkt
  async function taBortArtikel(id, uid) {
    return updateDoc(doc(db, "forradsartiklar", id), {
      borttagen: true,
      borttagenAv: uid ?? null,
      borttagenDatum: serverTimestamp(),
    });
  }

  return { artiklar, laddar, skapaArtikel, uppdateraArtikel, godkannArtikel, taBortArtikel };
}
