// Etapp 17b: "senast besökta" lokalt OCH synkat mellan enheter. Skriver alltid till den
// lokala localStorage-kopian direkt (fungerar offline, inget väntetid), och synkar samma
// lista till users/{uid}.senastBesokta i bakgrunden när nätet finns (se firestore.rules –
// ägaren får redan ändra sina egna favoriter/snabblänkar på samma sätt).
import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { lasSenastBesokta, registreraBesok as registreraLokalt } from "../utils/senastBesokta";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useSenastBesokta(uid) {
  const [synkat, setSynkat] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setSynkat(snap.data()?.senastBesokta ?? null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "users", organisationId: undefined, fel: error });
      },
    );
  }, [uid]);

  // useCallback med [uid] som enda beroende ger en stabil referens så länge användaren är
  // densamma – annars skulle varje konsuments useEffect-deps-lista (se Sektionssida.jsx)
  // tvingas köra om vid varje rendering istället för bara vid faktiska hash-ändringar.
  const registrera = useCallback(
    async (post) => {
      registreraLokalt(post);
      if (!uid) return;
      try {
        await updateDoc(doc(db, "users", uid), { senastBesokta: lasSenastBesokta() });
      } catch {
        // Offline eller nätverksfel – den lokala kopian räcker för den här enheten, synkas
        // nästa gång ett besök registreras med fungerande nät.
      }
    },
    [uid]
  );

  // Synkad lista om kontot har en (även tom, om användaren aldrig besökt något på ett synkat
  // konto), annars den lokala – t.ex. innan Firestore hunnit svara, eller utan inloggning.
  const senastBesokta = synkat ?? lasSenastBesokta();

  return { senastBesokta, registrera, fel };
}
