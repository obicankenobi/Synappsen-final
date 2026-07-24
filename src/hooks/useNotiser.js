// In-app notisflöde – visar nytt innehåll (anslag, godkända rutiner, @omnämnanden i
// kommentarer) sedan användarens senaste besök i notispanelen. Inga externa push-notiser,
// bara ett badge-antal i appen.
import { useEffect, useMemo, useState } from "react";
import { collection, query, where, doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { useAnvandare } from "./useAnvandare";
import { useAnslag } from "./useAnslag";
import { useRutiner, RUTIN_STATUS } from "./useRutiner";
import { narmarSigGranskning } from "../utils/rutinHjalp";
import { ROLES } from "../firebase/roles";

function efterSenasteBesok(tidpunkt, senasteBesok) {
  if (!tidpunkt?.toDate) return false;
  if (!senasteBesok?.toDate) return true;
  return tidpunkt.toDate() > senasteBesok.toDate();
}

const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

export function useNotiser() {
  const { currentUser, role } = useAuth();
  const { anvandare } = useAnvandare();
  const { anslag } = useAnslag();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const [omnamnanden, setOmnamnanden] = useState([]);
  const [systemvarningar, setSystemvarningar] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    const q = query(collection(db, "kommentarer"), where("omnamnda", "array-contains", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setOmnamnanden(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  // Larm från schemalagda kontrollfunktioner (t.ex. klinikstöd-källdrift) – bara superadmin
  // har läsbehörighet enligt firestore.rules, så frågan görs bara för den rollen.
  useEffect(() => {
    if (role !== ROLES.SUPERADMIN) return undefined;
    const unsubscribe = onSnapshot(collection(db, "systemvarningar"), (snap) => {
      setSystemvarningar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [role]);

  const senasteBesok = anvandare.find((a) => a.id === currentUser?.uid)?.senasteNotisBesok;

  const notiser = useMemo(() => {
    const allaRutiner = [...klinisktRutiner, ...adminRutiner];

    const anslagsposter = anslag
      .filter((a) => efterSenasteBesok(a.skapad, senasteBesok))
      .map((a) => ({ id: `anslag-${a.id}`, text: `Nytt anslag: ${a.titel}`, sokvag: "/anslag", tid: a.skapad }));

    const rutinposter = allaRutiner
      .filter((r) => r.status === RUTIN_STATUS.GODKAND && efterSenasteBesok(r.skapad, senasteBesok))
      .map((r) => ({
        id: `rutin-${r.id}`,
        text: `Ny rutin: ${r.titel}`,
        sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
        tid: r.skapad,
      }));

    const omnamndeposter = omnamnanden
      .filter((k) => efterSenasteBesok(k.skapad, senasteBesok))
      .map((k) => {
        const rutin = allaRutiner.find((r) => r.id === k.rutinId);
        return {
          id: `omnamnd-${k.id}`,
          text: `${k.skapadAvNamn || "Någon"} nämnde dig i en kommentar${rutin ? ` på "${rutin.titel}"` : ""}`,
          sokvag: rutin ? `${OMRADE_SOKVAG[rutin.omrade] ?? "/"}#rutin-${rutin.id}` : "/",
          tid: k.skapad,
        };
      });

    // Påminnelse till redaktörer om rutiner vars granskningsfrist snart går ut. Till skillnad
    // från de andra posterna ovan är detta ett stående tillstånd (inte en engångshändelse),
    // så den styrs av rollbehörighet + faktiskt granskningsdatum, inte senasteNotisBesok –
    // den försvinner av sig själv när rutinen markeras som granskad.
    // Om en rutin har en ägare (agare-fältet) riktas påminnelsen ENDAST dit – en specifik
    // person (oavsett roll) eller alla med en viss roll – istället för till alla redaktörer
    // för hela området. Utan ägare gäller det gamla beteendet (alla redaktörer för området).
    const farGranskaKlinisktStod = [ROLES.SUPERADMIN, ROLES.VOL, ROLES.SEKTIONSLEDARE].includes(role);
    const farGranskaAdministration = [ROLES.SUPERADMIN, ROLES.VEC].includes(role);
    const granskningsposter = allaRutiner
      .filter((r) => r.status === RUTIN_STATUS.GODKAND && narmarSigGranskning(r.granskadDatum))
      .filter((r) => {
        if (r.agare?.typ === "roll") return role === r.agare.roll;
        if (r.agare?.typ === "person") return currentUser?.uid === r.agare.uid;
        return r.omrade === "kliniskt-stod" ? farGranskaKlinisktStod : farGranskaAdministration;
      })
      .map((r) => ({
        id: `granskning-${r.id}`,
        text: `Rutinen "${r.titel}" behöver granskas snart${r.agare ? " (du är ansvarig)" : ""}`,
        sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
        tid: r.granskadDatum,
      }));

    const systemvarningsposter = systemvarningar
      .filter((v) => efterSenasteBesok(v.tidpunkt, senasteBesok))
      .map((v) => ({
        id: `systemvarning-${v.id}`,
        text: `⚠️ ${v.meddelande}`,
        sokvag: "/admin",
        tid: v.tidpunkt,
      }));

    return [...anslagsposter, ...rutinposter, ...omnamndeposter, ...granskningsposter, ...systemvarningsposter].sort(
      (a, b) => (b.tid?.toMillis?.() ?? 0) - (a.tid?.toMillis?.() ?? 0)
    );
  }, [anslag, klinisktRutiner, adminRutiner, omnamnanden, systemvarningar, senasteBesok, role, currentUser?.uid]);

  async function markeraSomLast() {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { senasteNotisBesok: serverTimestamp() });
  }

  return { notiser, markeraSomLast };
}
