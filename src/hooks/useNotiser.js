// In-app notisflöde – visar nytt innehåll (anslag, godkända rutiner) sedan användarens
// senaste besök i notispanelen. Inga externa push-notiser, bara ett badge-antal i appen.
import { useMemo } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { useAnvandare } from "./useAnvandare";
import { useAnslag } from "./useAnslag";
import { useRutiner, RUTIN_STATUS } from "./useRutiner";

function efterSenasteBesok(tidpunkt, senasteBesok) {
  if (!tidpunkt?.toDate) return false;
  if (!senasteBesok?.toDate) return true;
  return tidpunkt.toDate() > senasteBesok.toDate();
}

export function useNotiser() {
  const { currentUser } = useAuth();
  const { anvandare } = useAnvandare();
  const { anslag } = useAnslag();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");

  const senasteBesok = anvandare.find((a) => a.id === currentUser?.uid)?.senasteNotisBesok;

  const notiser = useMemo(() => {
    const anslagsposter = anslag
      .filter((a) => efterSenasteBesok(a.skapad, senasteBesok))
      .map((a) => ({ id: `anslag-${a.id}`, text: `Nytt anslag: ${a.titel}`, sokvag: "/anslag", tid: a.skapad }));

    const rutinposter = [...klinisktRutiner, ...adminRutiner]
      .filter((r) => r.status === RUTIN_STATUS.GODKAND && efterSenasteBesok(r.skapad, senasteBesok))
      .map((r) => ({
        id: `rutin-${r.id}`,
        text: `Ny rutin: ${r.titel}`,
        sokvag: `${r.omrade === "kliniskt-stod" ? "/kliniskt-stod" : "/administration"}#rutin-${r.id}`,
        tid: r.skapad,
      }));

    return [...anslagsposter, ...rutinposter].sort((a, b) => (b.tid?.toMillis?.() ?? 0) - (a.tid?.toMillis?.() ?? 0));
  }, [anslag, klinisktRutiner, adminRutiner, senasteBesok]);

  async function markeraSomLast() {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { senasteNotisBesok: serverTimestamp() });
  }

  return { notiser, markeraSomLast };
}
