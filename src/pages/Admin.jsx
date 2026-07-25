import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
import { useKostnadshistorik } from "../hooks/useKostnadshistorik";
import { useFeedback } from "../hooks/useFeedback";
import { useSokloggar } from "../hooks/useSokloggar";
import { useAuditlogg } from "../hooks/useAuditlogg";
import { useRutiner } from "../hooks/useRutiner";
import { useAnslag } from "../hooks/useAnslag";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useUtloggningsinstallning } from "../hooks/useUtloggningsinstallning";
import { useKlinikfrageStatistik } from "../hooks/useKlinikfrageStatistik";
import { useHalsokontrollhistorik } from "../hooks/useHalsokontrollhistorik";
import { useSokstatistik } from "../hooks/useSokstatistik";
import {
  tvingaUtloggning,
  testaBeroenden,
  verifieraKlinikstod,
  migreraTillOrganisation,
} from "../firebase/functions";
import { ROLES } from "../firebase/roles";
import InbjudanFormular from "../components/InbjudanFormular";
import { useDialog } from "../hooks/useDialog";
import SystemstatusSektion from "../components/admin/SystemstatusSektion";
import PilotMatvardenSektion from "../components/admin/PilotMatvardenSektion";
import ModulerSektion from "../components/admin/ModulerSektion";
import SakerhetSektion from "../components/admin/SakerhetSektion";
import OrganisationMigreringSektion from "../components/admin/OrganisationMigreringSektion";
import VerifieraKlinikstodSektion from "../components/admin/VerifieraKlinikstodSektion";
import KlinikstodAnvandningSektion from "../components/admin/KlinikstodAnvandningSektion";
import KvitteringarMedDeadlineSektion from "../components/admin/KvitteringarMedDeadlineSektion";
import MittOmradeStatistikSektion from "../components/admin/MittOmradeStatistikSektion";
import BudgetSektion from "../components/admin/BudgetSektion";
import KostnadsuppfoljningSektion from "../components/admin/KostnadsuppfoljningSektion";
import AutoUtloggningSektion from "../components/admin/AutoUtloggningSektion";
import AnvandareRollerSektion from "../components/admin/AnvandareRollerSektion";
import InaktivaKontonSektion from "../components/admin/InaktivaKontonSektion";
import StatistikAllaOmradenSektion from "../components/admin/StatistikAllaOmradenSektion";
import FeedbackSektion from "../components/admin/FeedbackSektion";
import SokningarUtanTraffarSektion from "../components/admin/SokningarUtanTraffarSektion";
import AndringsloggSektion from "../components/admin/AndringsloggSektion";
import "./Admin.css";

// Vilket område en icke-superadmin-redaktörsroll ansvarar för, för den områdesscopade statistiken
const OMRADE_FOR_ROLL = {
  [ROLES.VOL]: "kliniskt-stod",
  [ROLES.SEKTIONSLEDARE]: "kliniskt-stod",
  [ROLES.VEC]: "administration",
  [ROLES.FORRADSANSVARIG]: "logistik",
};

export default function Admin() {
  const { role, organisationId } = useAuth();
  const arSuperadmin = role === ROLES.SUPERADMIN;
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();
  const { confirm, visaMeddelande } = useDialog();
  const { moduler, laddat: modulerLaddade } = useFeatures();
  const [sparadModul, setSparadModul] = useState(null);

  async function vaxlaModul(modul, paslagen) {
    if (!organisationId) return;
    await updateDoc(doc(db, "organisationer", organisationId), { [`moduler.${modul}`]: paslagen });
    setSparadModul(modul);
    setTimeout(() => setSparadModul(null), 2000);
  }

  // Etapp 3d: 2FA-policy – vilka roller organisationen kräver tvåfaktorsautentisering för.
  const [kravMfaForRoller, setKravMfaForRoller] = useState([]);
  const [sakerhetSparad, setSakerhetSparad] = useState(false);
  useEffect(() => {
    if (!organisationId) return undefined;
    const unsubscribe = onSnapshot(doc(db, "organisationer", organisationId), (snap) => {
      setKravMfaForRoller(snap.data()?.sakerhet?.kravMfaForRoller ?? []);
    });
    return unsubscribe;
  }, [organisationId]);

  async function vaxlaMfaKrav(roll, kravs) {
    if (!organisationId) return;
    const nyLista = kravs
      ? [...new Set([...kravMfaForRoller, roll])]
      : kravMfaForRoller.filter((r) => r !== roll);
    await updateDoc(doc(db, "organisationer", organisationId), {
      "sakerhet.kravMfaForRoller": nyLista,
    });
    setSakerhetSparad(true);
    setTimeout(() => setSakerhetSparad(false), 2000);
  }

  const { budget, satTakKr } = useGeminiBudget();
  const { historik: kostnadshistorik } = useKostnadshistorik(arSuperadmin);
  const { feedback, taBortFeedback, uppdateraFeedbackStatus, svaraPaFeedback } = useFeedback(arSuperadmin);
  const { sokloggar } = useSokloggar(arSuperadmin);
  const { feedback: klinikfeedback, fragor: klinikfragor } = useKlinikfrageStatistik(arSuperadmin);
  const { statistik: sokstatistik } = useSokstatistik(arSuperadmin);
  const { auditlogg } = useAuditlogg(arSuperadmin);
  const { historik: halsokontrollhistorik } = useHalsokontrollhistorik(arSuperadmin);
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { anslag } = useAnslag();
  const { artiklar: forradsartiklar } = useForradsartiklar();
  const { minuter: utloggningMinuter, satMinuter: satUtloggningMinuter } = useUtloggningsinstallning();
  const [nyttTak, setNyttTak] = useState("");
  const [nyaUtloggningMinuter, setNyaUtloggningMinuter] = useState("");
  const [loggarUtAnvandare, setLoggarUtAnvandare] = useState(null);
  const [beroendeStatus, setBeroendeStatus] = useState(null);
  const [testarBeroenden, setTestarBeroenden] = useState(false);

  async function hanteraTestaBeroenden() {
    setTestarBeroenden(true);
    setBeroendeStatus(null);
    try {
      const { data } = await testaBeroenden();
      setBeroendeStatus(data);
    } catch (fel) {
      setBeroendeStatus({ fel: fel.message ?? "Testet misslyckades." });
    } finally {
      setTestarBeroenden(false);
    }
  }

  const [klinikstodStatus, setKlinikstodStatus] = useState(null);
  const [verifierarKlinikstod, setVerifierarKlinikstod] = useState(false);

  async function hanteraVerifieraKlinikstod() {
    setVerifierarKlinikstod(true);
    setKlinikstodStatus(null);
    try {
      const { data } = await verifieraKlinikstod();
      setKlinikstodStatus(data.resultat);
    } catch (fel) {
      setKlinikstodStatus({ fel: fel.message ?? "Verifieringen misslyckades." });
    } finally {
      setVerifierarKlinikstod(false);
    }
  }
  const [migreringResultat, setMigreringResultat] = useState(null);
  const [migrerar, setMigrerar] = useState(false);

  async function hanteraMigrering(dryRun) {
    if (
      !dryRun &&
      !(await confirm("Kör migreringen SKARPT? Detta skriver organisationId på alla dokument som saknar det."))
    ) {
      return;
    }
    setMigrerar(true);
    setMigreringResultat(null);
    try {
      const { data } = await migreraTillOrganisation(dryRun);
      setMigreringResultat(data);
    } catch (fel) {
      setMigreringResultat({ fel: fel.message ?? "Migreringen misslyckades." });
    } finally {
      setMigrerar(false);
    }
  }

  const [svarUtkast, setSvarUtkast] = useState({});
  const [auditSok, setAuditSok] = useState("");
  const [auditTypFilter, setAuditTypFilter] = useState("");

  const mittOmrade = OMRADE_FOR_ROLL[role];

  // Statistik scopad till den inloggades eget område (för redaktörsroller utan superadmin)
  const rutinerIMittOmrade = useMemo(
    () => (mittOmrade === "kliniskt-stod" ? klinisktRutiner : mittOmrade === "administration" ? adminRutiner : []),
    [mittOmrade, klinisktRutiner, adminRutiner]
  );

  const utkastIMittOmrade =
    mittOmrade === "logistik"
      ? forradsartiklar.filter((a) => a.status === ARTIKEL_STATUS.UTKAST).length
      : rutinerIMittOmrade.filter((r) => r.status === "utkast").length;

  const kvitteradeIMittOmrade = useMemo(
    () =>
      rutinerIMittOmrade
        .map((r) => ({ id: r.id, titel: r.titel, antal: (r.lasteAv ?? []).length }))
        .filter((r) => r.antal > 0)
        .sort((a, b) => b.antal - a.antal)
        .slice(0, 5),
    [rutinerIMittOmrade]
  );

  const senasteArtiklarIMittOmrade = useMemo(() => forradsartiklar.slice(0, 5), [forradsartiklar]);

  // Anslag med en kvitteringsfrist – hur många av alla användare som ännu inte kvitterat.
  const anslagMedFrist = useMemo(() => {
    const totalAntal = anvandare.length;
    return anslag
      .filter((a) => a.kvitteringsfrist)
      .map((a) => {
        const lasteAv = a.lasteAv ?? [];
        const antalKvitterat = lasteAv.length;
        return {
          id: a.id,
          titel: a.titel,
          frist: a.kvitteringsfrist,
          passerad: new Date(a.kvitteringsfrist) < new Date(),
          antalKvitterat,
          antalTotalt: totalAntal,
          ejKvitterat: anvandare
            .filter((u) => !lasteAv.some((l) => l.uid === u.id))
            .map((u) => u.namn ?? u.email),
        };
      });
  }, [anslag, anvandare]);

  // Etapp 4 (pilot-mätvärden): genomsnittlig andel av personalen som kvitterat läsning av
  // varje godkänd rutin – ett grovt mått på hur väl information faktiskt når fram.
  const kvitteringsgrad = useMemo(() => {
    const godkanda = [...klinisktRutiner, ...adminRutiner].filter((r) => r.status === "godkand");
    if (godkanda.length === 0 || anvandare.length === 0) return null;
    const summaAndelar = godkanda.reduce(
      (sum, r) => sum + (r.lasteAv ?? []).length / anvandare.length,
      0
    );
    return Math.round((summaAndelar / godkanda.length) * 100);
  }, [klinisktRutiner, adminRutiner, anvandare]);

  // Klinikstöd: andel hjälpsamma svar (kvalitetsmått) och vanligaste frågorna (kunskapsluckor).
  const klinikHjalpsamAndel = useMemo(() => {
    if (klinikfeedback.length === 0) return null;
    const antalJa = klinikfeedback.filter((f) => f.hjalpsam).length;
    return Math.round((antalJa / klinikfeedback.length) * 100);
  }, [klinikfeedback]);

  const klinikVanligaFragor = useMemo(() => {
    const antalPerFraga = new Map();
    klinikfragor.forEach((f) => antalPerFraga.set(f.fraga, (antalPerFraga.get(f.fraga) ?? 0) + 1));
    return [...antalPerFraga.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fraga, antal]) => ({ fraga, antal }));
  }, [klinikfragor]);

  // Etapp 5: hjälpsamhetsgrad per vecka (istället för bara ett totalvärde), så en försämring
  // eller förbättring över tid syns – inte bara ett snapshot. Veckan räknas från söndagen
  // (samma som JS:s Date.getDay()) i den bedömningen skedde.
  const klinikTrendPerVecka = useMemo(() => {
    const perVecka = new Map();
    klinikfeedback.forEach((f) => {
      if (!f.tidpunkt?.toDate) return;
      const datum = f.tidpunkt.toDate();
      const veckoStart = new Date(datum);
      veckoStart.setDate(datum.getDate() - datum.getDay());
      const nyckel = veckoStart.toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
      const grupp = perVecka.get(nyckel) ?? { ja: 0, totalt: 0 };
      grupp.totalt += 1;
      if (f.hjalpsam) grupp.ja += 1;
      perVecka.set(nyckel, grupp);
    });
    return [...perVecka.entries()]
      .map(([vecka, g]) => ({ vecka, andel: Math.round((g.ja / g.totalt) * 100), totalt: g.totalt }))
      .reverse();
  }, [klinikfeedback]);

  // Sökningar utan träffar grupperade per dag, för att se trender över tid (senaste 50 loggade)
  const sokningarPerDag = useMemo(() => {
    const perDag = new Map();
    sokloggar.forEach((s) => {
      if (!s.tidpunkt?.toDate) return;
      const nyckel = s.tidpunkt.toDate().toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
      perDag.set(nyckel, (perDag.get(nyckel) ?? 0) + 1);
    });
    return [...perDag.entries()].reverse();
  }, [sokloggar]);
  const maxPerDag = Math.max(1, ...sokningarPerDag.map(([, antal]) => antal));

  // Mest aktiva användare, baserat på de senaste 100 loggade händelserna
  const mestAktiva = useMemo(() => {
    const antalPerUid = new Map();
    auditlogg.forEach((a) => {
      if (!a.uid) return;
      antalPerUid.set(a.uid, (antalPerUid.get(a.uid) ?? 0) + 1);
    });
    return [...antalPerUid.entries()]
      .map(([uid, antal]) => ({
        uid,
        antal,
        namn: anvandare.find((a) => a.id === uid)?.namn || anvandare.find((a) => a.id === uid)?.email || uid,
      }))
      .sort((a, b) => b.antal - a.antal)
      .slice(0, 5);
  }, [auditlogg, anvandare]);

  // Mest kvitterade rutiner (flest "jag har läst"-kvitteringar)
  const mestKvitterade = useMemo(() => {
    return [...klinisktRutiner, ...adminRutiner]
      .map((r) => ({ id: r.id, titel: r.titel, antal: (r.lasteAv ?? []).length }))
      .filter((r) => r.antal > 0)
      .sort((a, b) => b.antal - a.antal)
      .slice(0, 5);
  }, [klinisktRutiner, adminRutiner]);

  async function hanteraNyttTak(e) {
    e.preventDefault();
    if (!nyttTak) return;
    await satTakKr(Number(nyttTak));
    setNyttTak("");
  }

  async function hanteraNyUtloggningstid(e) {
    e.preventDefault();
    if (!nyaUtloggningMinuter) return;
    await satUtloggningMinuter(Number(nyaUtloggningMinuter));
    setNyaUtloggningMinuter("");
  }

  async function hanteraTvingaUtloggning(anvandarpost) {
    if (!(await confirm(`Tvinga utloggning av ${anvandarpost.namn || anvandarpost.email}?`))) return;
    setLoggarUtAnvandare(anvandarpost.id);
    try {
      await tvingaUtloggning(anvandarpost.id);
      visaMeddelande("Utloggning genomförd. Effekten kan ta upp till en timme om användaren redan har en aktiv session.");
    } catch (fel) {
      visaMeddelande(fel.message ?? "Något gick fel.");
    } finally {
      setLoggarUtAnvandare(null);
    }
  }

  async function hanteraSvaraPaFeedback(id) {
    const svar = (svarUtkast[id] ?? "").trim();
    if (!svar) return;
    await svaraPaFeedback(id, svar);
    setSvarUtkast((u) => ({ ...u, [id]: "" }));
  }

  const filtreradAuditlogg = useMemo(() => {
    const sokterm = auditSok.trim().toLowerCase();
    return auditlogg.filter((a) => {
      if (auditTypFilter && a.entitetTyp !== auditTypFilter) return false;
      if (sokterm && !(a.beskrivning ?? "").toLowerCase().includes(sokterm)) return false;
      return true;
    });
  }, [auditlogg, auditSok, auditTypFilter]);

  const auditTyper = useMemo(
    () => [...new Set(auditlogg.map((a) => a.entitetTyp).filter(Boolean))].sort(),
    [auditlogg]
  );

  // Konton utan inloggning på 90 dagar (eller där inloggning aldrig registrerats – fältet
  // började spåras först i 5.7.0, så äldre konton utan fältet listas också tills de loggar in).
  // Gränsen läses en gång vid montering (lazy useState-init är undantaget från
  // purity-regeln) – sidan behöver inte en levande klocka för en 90-dagarsgräns.
  const [inaktivGrans] = useState(() => Date.now() - 90 * 24 * 60 * 60 * 1000);
  const inaktivaKonton = anvandare.filter(
    (a) => !a.senasteInloggning?.toMillis || a.senasteInloggning.toMillis() < inaktivGrans
  );

  return (
    <div className="sida">
      <h1>Adminpanel</h1>

      {arSuperadmin && (
        <SystemstatusSektion
          anvandare={anvandare}
          antalRutiner={klinisktRutiner.length + adminRutiner.length}
          forradsartiklar={forradsartiklar}
          budget={budget}
          utloggningMinuter={utloggningMinuter}
          hanteraTestaBeroenden={hanteraTestaBeroenden}
          testarBeroenden={testarBeroenden}
          beroendeStatus={beroendeStatus}
          halsokontrollhistorik={halsokontrollhistorik}
        />
      )}

      {arSuperadmin && (
        <PilotMatvardenSektion
          sokstatistik={sokstatistik}
          kvitteringsgrad={kvitteringsgrad}
          klinikHjalpsamAndel={klinikHjalpsamAndel}
          klinikfeedback={klinikfeedback}
          feedback={feedback}
        />
      )}

      {arSuperadmin && (
        <ModulerSektion
          modulerLaddade={modulerLaddade}
          moduler={moduler}
          sparadModul={sparadModul}
          vaxlaModul={vaxlaModul}
        />
      )}

      {arSuperadmin && (
        <SakerhetSektion
          kravMfaForRoller={kravMfaForRoller}
          vaxlaMfaKrav={vaxlaMfaKrav}
          sakerhetSparad={sakerhetSparad}
        />
      )}

      {arSuperadmin && (
        <OrganisationMigreringSektion
          hanteraMigrering={hanteraMigrering}
          migrerar={migrerar}
          migreringResultat={migreringResultat}
        />
      )}

      {arSuperadmin && (
        <VerifieraKlinikstodSektion
          hanteraVerifieraKlinikstod={hanteraVerifieraKlinikstod}
          verifierarKlinikstod={verifierarKlinikstod}
          klinikstodStatus={klinikstodStatus}
        />
      )}

      {arSuperadmin && (klinikHjalpsamAndel !== null || klinikVanligaFragor.length > 0) && (
        <KlinikstodAnvandningSektion
          klinikHjalpsamAndel={klinikHjalpsamAndel}
          klinikfeedback={klinikfeedback}
          klinikTrendPerVecka={klinikTrendPerVecka}
          klinikVanligaFragor={klinikVanligaFragor}
        />
      )}

      {arSuperadmin && anslagMedFrist.length > 0 && (
        <KvitteringarMedDeadlineSektion anslagMedFrist={anslagMedFrist} />
      )}

      {mittOmrade && !arSuperadmin && (
        <MittOmradeStatistikSektion
          mittOmrade={mittOmrade}
          utkastIMittOmrade={utkastIMittOmrade}
          senasteArtiklarIMittOmrade={senasteArtiklarIMittOmrade}
          kvitteradeIMittOmrade={kvitteradeIMittOmrade}
        />
      )}

      {arSuperadmin && (
        <BudgetSektion budget={budget} nyttTak={nyttTak} setNyttTak={setNyttTak} hanteraNyttTak={hanteraNyttTak} />
      )}

      {arSuperadmin && <KostnadsuppfoljningSektion kostnadshistorik={kostnadshistorik} />}

      {arSuperadmin && (
        <AutoUtloggningSektion
          utloggningMinuter={utloggningMinuter}
          nyaUtloggningMinuter={nyaUtloggningMinuter}
          setNyaUtloggningMinuter={setNyaUtloggningMinuter}
          hanteraNyUtloggningstid={hanteraNyUtloggningstid}
        />
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>✉️ Bjud in kollega</h2>
          <p className="sida__beskrivning">
            Registrering kräver numera en inbjudan. Skapa en länk för en specifik
            e-postadress och roll – den kan bara lösas in av den adressen och slutar gälla
            efter 7 dagar.
          </p>
          <InbjudanFormular />
        </section>
      )}

      {arSuperadmin && (
        <AnvandareRollerSektion
          anvandare={anvandare}
          laddar={laddar}
          currentUser={currentUser}
          uppdateraRoll={uppdateraRoll}
          loggarUtAnvandare={loggarUtAnvandare}
          hanteraTvingaUtloggning={hanteraTvingaUtloggning}
        />
      )}

      {arSuperadmin && inaktivaKonton.length > 0 && (
        <InaktivaKontonSektion inaktivaKonton={inaktivaKonton} />
      )}

      {arSuperadmin && (
        <StatistikAllaOmradenSektion mestAktiva={mestAktiva} mestKvitterade={mestKvitterade} />
      )}

      {arSuperadmin && (
        <FeedbackSektion
          feedback={feedback}
          svarUtkast={svarUtkast}
          setSvarUtkast={setSvarUtkast}
          hanteraSvaraPaFeedback={hanteraSvaraPaFeedback}
          taBortFeedback={taBortFeedback}
          uppdateraFeedbackStatus={uppdateraFeedbackStatus}
        />
      )}

      {arSuperadmin && (
        <SokningarUtanTraffarSektion
          sokloggar={sokloggar}
          sokningarPerDag={sokningarPerDag}
          maxPerDag={maxPerDag}
        />
      )}

      {arSuperadmin && (
        <AndringsloggSektion
          auditlogg={auditlogg}
          auditSok={auditSok}
          setAuditSok={setAuditSok}
          auditTypFilter={auditTypFilter}
          setAuditTypFilter={setAuditTypFilter}
          auditTyper={auditTyper}
          filtreradAuditlogg={filtreradAuditlogg}
        />
      )}
    </div>
  );
}
