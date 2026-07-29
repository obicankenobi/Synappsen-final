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
import { ROLES, KAN_HANTERA_FORRAD } from "../firebase/roles";
import { useFeatures } from "./useFeatures";
import { FEATURE } from "../config/features";
import { useBristanmalningar, BRIST_STATUS } from "./useBristanmalningar";
import { useAndringsforslag, FORSLAG_STATUS } from "./useAndringsforslag";

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
  const { currentUser, role, organisationId } = useAuth();
  const { hasFeature } = useFeatures();
  const { anvandare } = useAnvandare();
  const { anslag } = useAnslag();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { bristanmalningar } = useBristanmalningar();
  // Etapp 26c: useAndringsforslag kräver ett omrade (se hookens egen kommentar – Firestores
  // regelmotor kan annars inte bevisa farRedigeraOmrade(resource.data.omrade) för en
  // list-fråga), så precis som rutiner ovan hämtas den en gång per område.
  const { forslag: klinisktForslag } = useAndringsforslag("kliniskt-stod");
  const { forslag: adminForslag } = useAndringsforslag("administration");
  const forslag = useMemo(() => [...klinisktForslag, ...adminForslag], [klinisktForslag, adminForslag]);
  const [omnamnanden, setOmnamnanden] = useState([]);
  const [systemvarningar, setSystemvarningar] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid || !organisationId) return undefined;
    const q = query(
      collection(db, "kommentarer"),
      where("organisationId", "==", organisationId),
      where("omnamnda", "array-contains", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setOmnamnanden(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [currentUser?.uid, organisationId]);

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
        omrade: r.omrade,
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
    const granskningsposter = !hasFeature(FEATURE.OWNER_REMINDERS)
      ? []
      : allaRutiner
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
        omrade: r.omrade,
      }));

    // Etapp 21c: samma ägar-filtrering som granskningsposter ovan – riktas till rutinens
    // ägare om satt, annars till alla redaktörer för området. Ett stående tillstånd (försvinner
    // av sig själv när kallVarning rensas via "Granskad, ingen ändring behövs"/redigering).
    const kallvarningposter = allaRutiner
      .filter((r) => r.kallVarning === true)
      .filter((r) => {
        if (r.agare?.typ === "roll") return role === r.agare.roll;
        if (r.agare?.typ === "person") return currentUser?.uid === r.agare.uid;
        return r.omrade === "kliniskt-stod" ? farGranskaKlinisktStod : farGranskaAdministration;
      })
      .map((r) => ({
        id: `kallvarning-${r.id}`,
        text:
          r.kallVarningTyp === "trasig_lank"
            ? `Källan till "${r.titel}" svarar inte längre (trasig länk)`
            : `Källan till "${r.titel}" har uppdaterats sedan rutinen granskades`,
        sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
        tid: r.kallVarningTidpunkt,
        omrade: r.omrade,
      }));

    // Etapp 20b: notis till förrådsansvarig/superadmin om nya bristanmälningar, och kvittens
    // till anmälaren när den egna anmälan hanteras – båda ett stående tillstånd (som
    // granskningsposter ovan), inte en engångshändelse styrd av senasteNotisBesok.
    const bristposter = KAN_HANTERA_FORRAD.includes(role)
      ? bristanmalningar
          .filter((b) => b.status === BRIST_STATUS.NY)
          .map((b) => ({
            id: `brist-${b.id}`,
            text: `Bristanmälan: ${b.artikelNamn} (${b.forrad})${(b.antalAnmalningar ?? 1) > 1 ? ` – ${b.antalAnmalningar} anmälningar` : ""}`,
            sokvag: "/logistik",
            tid: b.senastAnmald ?? b.tidpunkt,
            omrade: "logistik",
          }))
      : [];

    const hanteradeBristposter = bristanmalningar
      .filter(
        (b) =>
          b.anmaldAv === currentUser?.uid &&
          b.status === BRIST_STATUS.HANTERAD &&
          efterSenasteBesok(b.hanteradDatum, senasteBesok)
      )
      .map((b) => ({
        id: `brist-hanterad-${b.id}`,
        text: `Din bristanmälan om "${b.artikelNamn}" har hanterats`,
        sokvag: `/logistik`,
        tid: b.hanteradDatum,
      }));

    // Etapp 26c: notis till redaktörer om nya ändringsförslag för deras område (stående
    // tillstånd, samma mönster som bristposter ovan), och kvittens till den som föreslog när
    // förslaget hanterats (engångshändelse, styrd av senasteNotisBesok).
    const forslagposter = forslag
      .filter((f) => f.status === FORSLAG_STATUS.NY)
      .filter((f) => (f.omrade === "kliniskt-stod" ? farGranskaKlinisktStod : farGranskaAdministration))
      .map((f) => ({
        id: `forslag-${f.id}`,
        text: `Nytt förslag på "${f.rutinTitel}"`,
        sokvag: `${OMRADE_SOKVAG[f.omrade] ?? "/"}`,
        tid: f.tidpunkt,
        omrade: f.omrade,
      }));

    const hanteradeForslagposter = forslag
      .filter(
        (f) =>
          f.foreslagenAv === currentUser?.uid &&
          f.status !== FORSLAG_STATUS.NY &&
          efterSenasteBesok(f.hanteradDatum, senasteBesok)
      )
      .map((f) => ({
        id: `forslag-hanterat-${f.id}`,
        text:
          f.status === FORSLAG_STATUS.INFORT
            ? `Ditt förslag på "${f.rutinTitel}" är infört`
            : `Ditt förslag på "${f.rutinTitel}" avvisades${f.avvisningsMotivering ? `: ${f.avvisningsMotivering}` : ""}`,
        sokvag: `${OMRADE_SOKVAG[f.omrade] ?? "/"}`,
        tid: f.hanteradDatum,
      }));

    const systemvarningsposter = systemvarningar
      .filter((v) => efterSenasteBesok(v.tidpunkt, senasteBesok))
      .map((v) => ({
        id: `systemvarning-${v.id}`,
        text: `⚠️ ${v.meddelande}`,
        sokvag: "/admin",
        tid: v.tidpunkt,
      }));

    return [
      ...anslagsposter,
      ...rutinposter,
      ...omnamndeposter,
      ...granskningsposter,
      ...kallvarningposter,
      ...bristposter,
      ...hanteradeBristposter,
      ...forslagposter,
      ...hanteradeForslagposter,
      ...systemvarningsposter,
    ].sort((a, b) => (b.tid?.toMillis?.() ?? 0) - (a.tid?.toMillis?.() ?? 0));
  }, [
    anslag,
    klinisktRutiner,
    adminRutiner,
    omnamnanden,
    systemvarningar,
    bristanmalningar,
    forslag,
    senasteBesok,
    role,
    currentUser?.uid,
    hasFeature,
  ]);

  async function markeraSomLast() {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), { senasteNotisBesok: serverTimestamp() });
  }

  return { notiser, markeraSomLast };
}
