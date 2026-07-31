// Etapp 15b: guidad uppstart för en ny kunds superadmin. Läser/skriver samma dokument som
// Etapp 15a skapade (organisationer/{orgId}/installningar/valkomstchecklista) – rules tillåter
// redan en superadmin i egen organisation att skriva dit direkt (samma mönster som
// useGeminiBudget), så ingen Cloud Function behövs för att bocka av ett steg.
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

// Nycklarna måste matcha VALKOMSTCHECKLISTA_STEG i functions/index.js (skapaOrganisation).
export const CHECKLISTA_STEG = [
  {
    nyckel: "bjud_in_kollegor",
    titel: "Bjud in kollegor",
    beskrivning: "Skicka inbjudningar så fler i verksamheten kan logga in.",
    lank: "/admin",
  },
  {
    nyckel: "satt_roller",
    titel: "Sätt roller",
    beskrivning: "Ge varje inbjuden person rätt roll (superadmin, sektionsledare, vec m.fl.).",
    lank: "/admin",
  },
  {
    nyckel: "importera_rutiner",
    titel: "Importera de första rutinerna",
    beskrivning: "Ladda upp ett dokument eller en bild så tolkar Gemini innehållet åt er.",
    lank: "/ladda-upp",
  },
  {
    nyckel: "aktivera_2fa_policy",
    titel: "Ta ställning till tvåfaktorskrav",
    beskrivning: "Bestäm vilka roller som ska tvingas använda 2FA.",
    lank: "/admin",
  },
  {
    nyckel: "satt_gemini_budget",
    titel: "Sätt en AI-budget",
    beskrivning: "Bekräfta eller justera månadstaket för AI-tolkning.",
    lank: "/admin",
  },
];

// undefined = laddar, null = ingen checklista finns (organisationen etablerades före Etapp
// 15a, eller alla steg redan avbockade och komponenten ska inte visas), annars stegobjektet.
export function useValkomstchecklista() {
  const { organisationId, role } = useAuth();
  const [steg, setSteg] = useState(undefined);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const ref = doc(db, "organisationer", organisationId, "installningar", "valkomstchecklista");
    return onSnapshot(
      ref,
      (snap) => {
        setSteg(snap.exists() ? snap.data().steg ?? {} : null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "valkomstchecklista", fel: error });
      },
    );
  }, [organisationId, role]);

  async function markeraSteg(nyckel, klar) {
    if (!organisationId) return;
    const ref = doc(db, "organisationer", organisationId, "installningar", "valkomstchecklista");
    await updateDoc(ref, { [`steg.${nyckel}`]: klar });
  }

  const antalKlara = steg ? CHECKLISTA_STEG.filter((s) => steg[s.nyckel]).length : 0;
  const alltKlart = steg != null && antalKlara === CHECKLISTA_STEG.length;

  return { steg, markeraSteg, antalKlara, totalt: CHECKLISTA_STEG.length, alltKlart, fel };
}
