// Etapp 17c: kuraterade akutlägesrutiner, över ALLA områden (inte bara ett), sorterade på
// akutlageOrdning. Ingen orderBy i själva Firestore-frågan (undviker ett sammansatt index,
// samma mönster som useOfflineCenter.js) – sorteringen görs klientsidan istället, på en
// redan liten, kuraterad mängd (max ett fåtal poster).
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useAkutlageRutiner() {
  const { organisationId, role } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    // Etapp 31b (bugfynd): frågan saknade ett status-filter och förlitade sig på klientsidig
    // filtrering – men rutiner/{rutinId}s läsregel kräver status=='godkand' ELLER redaktör
    // FÖR DET SPECIFIKA OMRÅDET, och en akutläges-fråga spänner över ALLA områden i samma
    // svep (ingen enskild roll är redaktör för alla samtidigt). Utan ett matchande where()
    // kan Firestore inte bevisa villkoret och nekade HELA listningen – appens mest
    // säkerhetskritiska funktion (akutläget, ska alltid fungera oavsett vem som är inloggad)
    // var därför osynlig för alla utom VÖL/superadmin. where("status","==","godkand") här är
    // dessutom rätt beteende i sak, inte bara en bevisbarhetsfix: den här frågan är ett
    // publicerat, kuraterat säkerhetsnät, aldrig en granskningsvy för utkast.
    const q = query(
      collection(db, "rutiner"),
      where("organisationId", "==", organisationId),
      where("akutlage", "==", true),
      where("status", "==", "godkand")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const alla = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => !r.borttagen);
        alla.sort((a, b) => (a.akutlageOrdning ?? 0) - (b.akutlageOrdning ?? 0));
        setRutiner(alla);
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "rutiner", roll: role, organisationId, sokvag: "akutlage", fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  return { rutiner, laddar, fel };
}
