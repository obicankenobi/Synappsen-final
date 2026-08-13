// Etapp 65b: hämtar, on-demand (inte en prenumeration), innehållet som gällde en rutin VID
// användarens egen kvitteringstidpunkt, för att diffa mot dagens innehåll. Utlöses av ett
// klick i RutinKort.jsx, inte av att kortet renderas – en lista med dussintals rutinkort ska
// inte göra en versioner-fråga per kort bara för att avgöra om något ändrats.
//
// Algoritm: rutiner/{id}/versioner sparas som en ögonblicksbild TAGEN NÄR en redigering
// skrev över innehållet (se uppdateraRutin() i useRutiner.js). Den FÖRSTA versionsposten vars
// sparadVersionTidpunkt ligger EFTER min egen kvitteringstidpunkt är alltså en exakt
// ögonblicksbild av vad jag faktiskt läste – ingen redigering hann ske mellan min kvittering
// och den posten.
import { useCallback, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { diffRader } from "../utils/diff";

export function useRutinDiffSedanLast(rutinId) {
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState(null);
  const [rader, setRader] = useState(null);

  const hamtaDiff = useCallback(
    async (minTidpunkt, nuvarandeInnehall) => {
      if (!minTidpunkt) return;
      setLaddar(true);
      setFel(null);
      try {
        const q = query(
          collection(db, "rutiner", rutinId, "versioner"),
          where("sparadVersionTidpunkt", ">", minTidpunkt),
          orderBy("sparadVersionTidpunkt", "asc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          // Ingen version sparad efter min kvittering – inget har ändrats sedan dess.
          setRader([]);
        } else {
          const innehallVidLasning = snap.docs[0].data().innehall ?? "";
          setRader(diffRader(innehallVidLasning, nuvarandeInnehall ?? ""));
        }
      } catch {
        setFel("Kunde inte hämta vad som ändrats. Försök igen.");
      } finally {
        setLaddar(false);
      }
    },
    [rutinId]
  );

  return { laddar, fel, rader, hamtaDiff };
}
