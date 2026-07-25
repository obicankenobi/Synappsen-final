import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
import { useKostnadshistorik } from "../hooks/useKostnadshistorik";
import {
  useFeedback,
  FEEDBACK_TYP_LABELS,
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_LABELS,
} from "../hooks/useFeedback";
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
import { APP_VERSION } from "../version";
import { ROLES, ROLE_LABELS, REDAKTORSROLLER } from "../firebase/roles";
import InbjudanFormular from "../components/InbjudanFormular";
import "./Admin.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

// Vilket område en icke-superadmin-redaktörsroll ansvarar för, för den områdesscopade statistiken
const OMRADE_FOR_ROLL = {
  [ROLES.VOL]: "kliniskt-stod",
  [ROLES.SEKTIONSLEDARE]: "kliniskt-stod",
  [ROLES.VEC]: "administration",
  [ROLES.FORRADSANSVARIG]: "logistik",
};

const OMRADE_NAMN = {
  "kliniskt-stod": "Kliniskt stöd",
  administration: "Administration",
  logistik: "Logistik",
};

// Text skriven för en admin som inte nödvändigtvis är tekniker – "fungerar/långsamt/fungerar
// inte" istället för tekniska termer som "OK/degraderad/fel".
const STATUS_IKON = { ok: "🟢", degraderad: "🟡", fel: "🔴" };
const STATUS_TEXT = {
  ok: "Fungerar",
  degraderad: "Fungerar, men långsamt just nu",
  fel: "Fungerar inte",
};

export default function Admin() {
  const { role, organisationId } = useAuth();
  const arSuperadmin = role === ROLES.SUPERADMIN;
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();
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
    if (!dryRun && !confirm("Kör migreringen SKARPT? Detta skriver organisationId på alla dokument som saknar det.")) {
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
    if (!confirm(`Tvinga utloggning av ${anvandarpost.namn || anvandarpost.email}?`)) return;
    setLoggarUtAnvandare(anvandarpost.id);
    try {
      await tvingaUtloggning(anvandarpost.id);
      alert("Utloggning genomförd. Effekten kan ta upp till en timme om användaren redan har en aktiv session.");
    } catch (fel) {
      alert(fel.message ?? "Något gick fel.");
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
        <section className="admin-sektion">
          <h2>📊 Systemstatus</h2>
          <div className="admin-statistik-grid">
            <p className="sida__beskrivning">
              Version <strong>{APP_VERSION}</strong>
            </p>
            <p className="sida__beskrivning">
              {anvandare.length} användare, {klinisktRutiner.length + adminRutiner.length} rutiner,{" "}
              {forradsartiklar.length} förrådsartiklar
            </p>
            {budget && (
              <p className="sida__beskrivning">
                Gemini-budget: {(budget.anvantOre / 100).toFixed(0)} kr / {(budget.taketOre / 100).toFixed(0)} kr
                denna månad
              </p>
            )}
            <p className="sida__beskrivning">Auto-utloggning: {utloggningMinuter} min inaktivitet</p>
          </div>

          <div className="admin-beroendetest">
            <p className="sida__beskrivning">
              Kontrollerar att apps stödtjänster faktiskt fungerar just nu – bra att köra om
              något känns trögt eller om en användare rapporterar ett fel med AI-funktionerna.
            </p>
            <button
              className="knapp knapp--sekundar knapp--liten"
              onClick={hanteraTestaBeroenden}
              disabled={testarBeroenden}
            >
              {testarBeroenden ? "Testar..." : "🔌 Testa anslutningar"}
            </button>
            {beroendeStatus?.fel && <p className="klinikfraga__fel">{beroendeStatus.fel}</p>}
            {beroendeStatus && !beroendeStatus.fel && (
              <ul className="admin-beroendetest__lista">
                {[
                  ["Bildtolkning/klinikstöd-svar (Gemini)", beroendeStatus.gemini],
                  ["Klinikstöd-sökningen hittar källor", beroendeStatus.sokmotor],
                  ["Bilduppladdning (lagring)", beroendeStatus.storage],
                  ["Klinikstöd håller sig till godkända källor", beroendeStatus.klinikstod],
                ].map(([namn, status]) => (
                  <li key={namn}>
                    <span className={`admin-beroendetest__punkt--${status.status}`}>
                      {STATUS_IKON[status.status]}
                    </span>{" "}
                    {namn} – {STATUS_TEXT[status.status]}
                    {status.meddelande && <span> ({status.meddelande})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {halsokontrollhistorik.length > 0 && (
            <div className="admin-beroendetest">
              <p className="sida__beskrivning">
                Sparad historik – bygger med varje "Testa anslutningar" och den dagliga
                klinikstöd-kontrollen, så trender syns över tid.
              </p>
              <ul className="admin-beroendetest__lista">
                {halsokontrollhistorik.map((h) => (
                  <li key={h.id}>
                    {formateraTid(h.tidpunkt)}:{" "}
                    {[
                      h.gemini && `Gemini ${STATUS_IKON[h.gemini.status]}`,
                      h.sokmotor && `Sökmotor ${STATUS_IKON[h.sokmotor.status]}`,
                      h.storage && `Lagring ${STATUS_IKON[h.storage.status]}`,
                      h.klinikstod && `Klinikstöd ${STATUS_IKON[h.klinikstod.status]}`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>📈 Pilot-mätvärden</h2>
          <p className="sida__beskrivning">
            Sammanställning inför/under en pilot (Etapp 4): vilka Operations/Intelligence-
            funktioner som faktiskt värderas och hur väl information når fram.
          </p>
          <ul className="admin-beroendetest__lista">
            <li>
              <strong>Andel nollträffar:</strong>{" "}
              {sokstatistik && sokstatistik.totaltAntalSokningar > 0
                ? `${Math.round((sokstatistik.antalNollTraffar / sokstatistik.totaltAntalSokningar) * 100)}% av ${sokstatistik.totaltAntalSokningar} sökningar`
                : "Inga sökningar loggade ännu"}
            </li>
            <li>
              <strong>Kvitteringsgrad:</strong>{" "}
              {kvitteringsgrad !== null
                ? `${kvitteringsgrad}% av personalen har i snitt kvitterat läsning av varje godkänd rutin`
                : "Inga godkända rutiner/användare att räkna på ännu"}
            </li>
            <li>
              <strong>Upplevd nytta (klinikstöd):</strong>{" "}
              {klinikHjalpsamAndel !== null
                ? `${klinikHjalpsamAndel}% hjälpsamma svar av ${klinikfeedback.length} bedömda`
                : "Ingen klinikstöd-feedback ännu"}
              . Allmän feedback: {feedback.length} inskick totalt.
            </li>
            <li>
              <strong>Tid-att-hitta:</strong> inte instrumenterat ännu – skulle kräva att mäta
              tiden mellan påbörjad sökning och klick på ett resultat per session, en separat
              uppgift om piloten efterfrågar det.
            </li>
          </ul>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>🧩 Moduler</h2>
          <p className="sida__beskrivning">
            Slår av/på moduler för er organisation. Core (grundfunktionerna) är alltid
            tillgängligt. Att stänga av en modul döljer inte redan sparad data, bara
            funktionerna som kräver modulen (t.ex. AI-import kräver Intelligence).
          </p>
          <div className="admin-beroendetest">
            {!modulerLaddade && <p>Laddar...</p>}
            {modulerLaddade && (
              <ul className="admin-beroendetest__lista">
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={moduler.operations === true}
                      onChange={(e) => vaxlaModul("operations", e.target.checked)}
                    />{" "}
                    Operations
                  </label>
                  {sparadModul === "operations" && " ✓ Sparat"}
                </li>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={moduler.intelligence === true}
                      onChange={(e) => vaxlaModul("intelligence", e.target.checked)}
                    />{" "}
                    Intelligence (AI-import m.m.)
                  </label>
                  {sparadModul === "intelligence" && " ✓ Sparat"}
                </li>
              </ul>
            )}
          </div>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>🔐 Säkerhet</h2>
          <p className="sida__beskrivning">
            Kräv tvåfaktorsautentisering för valda roller. Den som inte har aktiverat det
            möts av en påminnelse i appen och blockeras från att ändra roller eller
            organisationsinställningar tills det är aktiverat (under Profil).
          </p>
          <div className="admin-beroendetest">
            <ul className="admin-beroendetest__lista">
              {REDAKTORSROLLER.map((roll) => (
                <li key={roll}>
                  <label>
                    <input
                      type="checkbox"
                      checked={kravMfaForRoller.includes(roll)}
                      onChange={(e) => vaxlaMfaKrav(roll, e.target.checked)}
                    />{" "}
                    {ROLE_LABELS[roll]}
                  </label>
                </li>
              ))}
            </ul>
            {sakerhetSparad && "✓ Sparat"}
          </div>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>🏢 Organisation (Etapp 1-migrering)</h2>
          <p className="sida__beskrivning">
            Engångsverktyg som sätter organisationId på allt befintligt innehåll (första steget
            mot att kunna hantera flera kunder). Kör alltid "Förhandsgranska" först och kolla att
            siffrorna stämmer innan du kör den skarpt – skarp körning kan köras flera gånger utan
            risk (den skriver bara på dokument som ännu saknar fältet).
          </p>
          <div className="admin-beroendetest">
            <button
              className="knapp knapp--sekundar knapp--liten"
              onClick={() => hanteraMigrering(true)}
              disabled={migrerar}
            >
              {migrerar ? "Arbetar..." : "Förhandsgranska (dry-run)"}
            </button>{" "}
            <button
              className="knapp knapp--farlig knapp--liten"
              onClick={() => hanteraMigrering(false)}
              disabled={migrerar}
            >
              Kör skarpt
            </button>
            {migreringResultat?.fel && <p className="klinikfraga__fel">{migreringResultat.fel}</p>}
            {migreringResultat?.resultat && (
              <>
                <p className="sida__beskrivning">
                  {migreringResultat.dryRun ? "Förhandsgranskning – inget skrivet ännu:" : "Skarpt kört:"}
                </p>
                <ul className="admin-beroendetest__lista">
                  {Object.entries(migreringResultat.resultat).map(([samling, r]) => (
                    <li key={samling}>
                      {samling}: {r.totalt} dokument, {r.saknarOrganisationId} saknade organisationId
                      {!migreringResultat.dryRun && r.saknarOrganisationId > 0 && " (nu åtgärdat)"}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>🔍 Verifiera klinikstöd-sökningen</h2>
          <p className="sida__beskrivning">
            Kör tre fasta testfrågor genom sökmotorn (förbi cachen) och kontrollerar att ALLA
            källor den hittar ligger inom de godkända domänerna. Kör detta om ni misstänker att
            sökningen visar fel källor, eller efter att ha ändrat sökmotorns konfiguration i
            Google-kontot – det är den delen som kan drifta utan att synas i koden.
          </p>
          <button
            className="knapp knapp--sekundar knapp--liten"
            onClick={hanteraVerifieraKlinikstod}
            disabled={verifierarKlinikstod}
          >
            {verifierarKlinikstod ? "Verifierar..." : "Kör testfrågor"}
          </button>
          {klinikstodStatus?.fel && <p className="klinikfraga__fel">{klinikstodStatus.fel}</p>}
          {Array.isArray(klinikstodStatus) && (
            <ul className="admin-beroendetest__lista">
              {klinikstodStatus.map((r) => (
                <li key={r.fraga}>
                  <span className={r.ok ? "admin-beroendetest__punkt--ok" : "admin-beroendetest__punkt--fel"}>
                    {r.ok ? "🟢" : "🔴"}
                  </span>{" "}
                  <strong>"{r.fraga}"</strong>
                  {r.fel && <span> – Fel: {r.fel}</span>}
                  {!r.fel && (
                    <span>
                      {" "}
                      – {r.antalTraffar} träff(ar)
                      {r.otillatnaKallor.length > 0 && (
                        <span className="admin-frist-varning">
                          {" "}
                          ⚠️ {r.otillatnaKallor.length} otillåten källa: {r.otillatnaKallor.join(", ")}
                        </span>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {arSuperadmin && (klinikHjalpsamAndel !== null || klinikVanligaFragor.length > 0) && (
        <section className="admin-sektion">
          <h2>💬 Klinikstöd – hur används det?</h2>
          {klinikHjalpsamAndel !== null && (
            <p className="sida__beskrivning">
              {klinikHjalpsamAndel}% av {klinikfeedback.length} besvarade "var detta
              hjälpsamt?"-frågor var positiva.
            </p>
          )}
          {klinikTrendPerVecka.length > 1 && (
            <>
              <h3>Hjälpsamhetsgrad per vecka (Etapp 5)</h3>
              <p className="sida__beskrivning">
                Så att en försämring eller förbättring över tid syns, inte bara totalvärdet
                ovan (baserat på de senaste {klinikfeedback.length} bedömningarna).
              </p>
              <ul className="admin-statistik-lista">
                {klinikTrendPerVecka.map((v) => (
                  <li key={v.vecka}>
                    Vecka från {v.vecka}: {v.andel}% hjälpsamma ({v.totalt} bedömda)
                  </li>
                ))}
              </ul>
            </>
          )}
          {klinikVanligaFragor.length > 0 && (
            <>
              <h3>Vanligaste frågorna</h3>
              <p className="sida__beskrivning">
                Loggen är anonym (inget uid sparas) – ger en bild av vilka kunskapsluckor
                personalen efterfrågar, inte vem som frågat.
              </p>
              <ul className="admin-statistik-lista">
                {klinikVanligaFragor.map((f) => (
                  <li key={f.fraga}>
                    "{f.fraga}" <span>({f.antal} gånger)</span>{" "}
                    <button
                      type="button"
                      className="knapp--lank"
                      onClick={() => navigator.clipboard?.writeText(f.fraga)}
                      title="Kopiera frågan, t.ex. för att använda som titel på en ny rutin"
                    >
                      Kopiera
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {arSuperadmin && anslagMedFrist.length > 0 && (
        <section className="admin-sektion">
          <h2>⏰ Kvitteringar med deadline</h2>
          <button
            className="knapp knapp--sekundar knapp--liten"
            onClick={() => {
              const rader = [
                "Anslag;Frist;Kvitterat;Totalt;Saknas",
                ...anslagMedFrist.map((a) =>
                  [a.titel.replaceAll(";", ","), a.frist, a.antalKvitterat, a.antalTotalt, a.ejKvitterat.join(", ").replaceAll(";", ",")].join(";")
                ),
              ];
              const blob = new Blob(["﻿" + rader.join("\n")], { type: "text/csv;charset=utf-8" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `kvitteringar-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Exportera som CSV
          </button>
          <ol className="admin-statistik-lista">
            {anslagMedFrist.map((a) => (
              <li key={a.id}>
                <strong>{a.titel}</strong> – kvittering senast {a.frist}:{" "}
                {a.antalKvitterat}/{a.antalTotalt} har kvitterat
                {a.passerad && a.ejKvitterat.length > 0 && (
                  <span className="admin-frist-varning" title={a.ejKvitterat.join(", ")}>
                    {" "}
                    (frist passerad, {a.ejKvitterat.length} saknas)
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {mittOmrade && !arSuperadmin && (
        <section className="admin-sektion">
          <h2>Statistik för mitt område ({OMRADE_NAMN[mittOmrade]})</h2>
          {mittOmrade === "logistik" ? (
            <>
              <p className="sida__beskrivning">{utkastIMittOmrade} artikelutkast väntar på granskning.</p>
              <h3>Senast tillagda artiklar</h3>
              {senasteArtiklarIMittOmrade.length === 0 && (
                <p className="sida__beskrivning">Ingen data ännu.</p>
              )}
              <ol className="admin-statistik-lista">
                {senasteArtiklarIMittOmrade.map((a) => (
                  <li key={a.id}>
                    {a.namn} <span>({a.forrad})</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="sida__beskrivning">{utkastIMittOmrade} utkast väntar på granskning.</p>
              <h3>Mest kvitterade rutiner</h3>
              {kvitteradeIMittOmrade.length === 0 && (
                <p className="sida__beskrivning">Ingen data ännu.</p>
              )}
              <ol className="admin-statistik-lista">
                {kvitteradeIMittOmrade.map((r) => (
                  <li key={r.id}>
                    {r.titel} <span>({r.antal} kvitteringar)</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Budget för bildtolkning (Gemini)</h2>
          {budget && (
            <p className="sida__beskrivning">
              Använt denna månad: <strong>{(budget.anvantOre / 100).toFixed(2)} kr</strong> av{" "}
              <strong>{(budget.taketOre / 100).toFixed(2)} kr</strong>.
              {budget.anvantOre >= budget.taketOre && (
                <span className="admin-budget__sparrad"> Taket är nått – tolkning är pausad.</span>
              )}
              <br />
              Varje enskild användare kan max använda 50 kr av detta per månad, så att ingen enskild
              person kan förbruka hela budgeten.
            </p>
          )}
          <form className="admin-budget__form" onSubmit={hanteraNyttTak}>
            <input
              type="number"
              min="0"
              step="10"
              placeholder="Nytt tak i kr"
              value={nyttTak}
              onChange={(e) => setNyttTak(e.target.value)}
            />
            <button type="submit" className="knapp">
              Uppdatera tak
            </button>
          </form>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>💰 Kostnadsuppföljning (Etapp 5)</h2>
          <p className="sida__beskrivning">
            AI-kostnad per avslutad månad, arkiverad automatiskt vid varje månadsskifte – för
            att se en trend, inte bara denna månads förbrukning ovan.
          </p>
          {kostnadshistorik.length === 0 && (
            <p className="sida__beskrivning">
              Ingen historik ännu – första posten skapas vid nästa månadsskifte.
            </p>
          )}
          {kostnadshistorik.length > 0 && (
            <ul className="admin-beroendetest__lista">
              {kostnadshistorik.map((h) => (
                <li key={h.id}>
                  {h.manad}: {(h.anvantOre / 100).toFixed(2)} kr ({h.antalAnvandare} användare)
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Auto-utloggningstid</h2>
          <p className="sida__beskrivning">
            Nuvarande: <strong>{utloggningMinuter} minuter</strong> inaktivitet innan automatisk utloggning.
          </p>
          <form className="admin-budget__form" onSubmit={hanteraNyUtloggningstid}>
            <input
              type="number"
              min="2"
              step="1"
              placeholder="Nya minuter"
              value={nyaUtloggningMinuter}
              onChange={(e) => setNyaUtloggningMinuter(e.target.value)}
            />
            <button type="submit" className="knapp">
              Uppdatera
            </button>
          </form>
        </section>
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
        <section className="admin-sektion">
          <h2>Användare och roller</h2>
          {laddar && <p>Laddar...</p>}
          <ul className="admin-lista">
            {anvandare.map((anvandarpost) => (
              <li key={anvandarpost.id} className="admin-lista__rad">
                <div>
                  <strong>{anvandarpost.namn || "(namn saknas)"}</strong>
                  <div className="admin-lista__email">{anvandarpost.email}</div>
                </div>
                <div className="admin-lista__atgarder">
                  <select
                    value={anvandarpost.role}
                    disabled={anvandarpost.id === currentUser.uid}
                    onChange={(e) => uppdateraRoll(anvandarpost.id, e.target.value)}
                  >
                    {Object.values(ROLES).map((roll) => (
                      <option key={roll} value={roll}>
                        {ROLE_LABELS[roll]}
                      </option>
                    ))}
                  </select>
                  {anvandarpost.id !== currentUser.uid && (
                    <button
                      type="button"
                      className="knapp knapp--farlig knapp--liten"
                      disabled={loggarUtAnvandare === anvandarpost.id}
                      onClick={() => hanteraTvingaUtloggning(anvandarpost)}
                    >
                      {loggarUtAnvandare === anvandarpost.id ? "..." : "Tvinga utloggning"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {arSuperadmin && inaktivaKonton.length > 0 && (
        <section className="admin-sektion">
          <h2>💤 Inaktiva konton (ingen inloggning på 90 dagar)</h2>
          <p className="sida__beskrivning">
            Gamla konton är en onödig attackyta – överväg att ta bort de som inte längre används.
            Konton skapade före v5.7.0 visas här tills de loggar in en första gång efter
            uppdateringen (inloggningstid spårades inte tidigare).
          </p>
          <ul className="admin-statistik-lista">
            {inaktivaKonton.map((a) => (
              <li key={a.id}>
                {a.namn || a.email}{" "}
                <span>
                  {a.senasteInloggning?.toDate
                    ? `senast ${a.senasteInloggning.toDate().toLocaleDateString("sv-SE")}`
                    : "aldrig registrerad inloggning"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Statistik (alla områden)</h2>
          <div className="admin-statistik-grid">
            <div>
              <h3>Mest aktiva användare</h3>
              {mestAktiva.length === 0 && <p className="sida__beskrivning">Ingen data ännu.</p>}
              <ol className="admin-statistik-lista">
                {mestAktiva.map((u) => (
                  <li key={u.uid}>
                    {u.namn} <span>({u.antal} händelser)</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3>Mest kvitterade rutiner</h3>
              {mestKvitterade.length === 0 && <p className="sida__beskrivning">Ingen data ännu.</p>}
              <ol className="admin-statistik-lista">
                {mestKvitterade.map((r) => (
                  <li key={r.id}>
                    {r.titel} <span>({r.antal} kvitteringar)</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Feedback från användare ({feedback.length})</h2>
          {feedback.length === 0 && <p className="sida__beskrivning">Ingen feedback ännu.</p>}
          <ul className="admin-lista admin-lista--vertikal">
            {feedback.map((f) => (
              <li key={f.id} className="admin-feedback-rad">
                <div className="admin-feedback-rad__meta">
                  <span className="admin-feedback-rad__typ">{FEEDBACK_TYP_LABELS[f.typ] ?? f.typ}</span>
                  <span>{f.skapadAvNamn}</span>
                  <span>{formateraTid(f.skapad)}</span>
                  <select
                    value={f.status ?? FEEDBACK_STATUS.NY}
                    onChange={(e) => uppdateraFeedbackStatus(f.id, e.target.value)}
                  >
                    {Object.values(FEEDBACK_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {FEEDBACK_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <p>{f.text}</p>
                {f.svar && (
                  <p className="admin-feedback-rad__svar">
                    <strong>Ditt svar:</strong> {f.svar}
                  </p>
                )}
                <div className="admin-feedback-rad__svarformular">
                  <input
                    type="text"
                    placeholder="Skriv ett svar till avsändaren..."
                    value={svarUtkast[f.id] ?? ""}
                    onChange={(e) => setSvarUtkast((u) => ({ ...u, [f.id]: e.target.value }))}
                  />
                  <button className="knapp knapp--liten" onClick={() => hanteraSvaraPaFeedback(f.id)}>
                    Svara
                  </button>
                </div>
                <button className="knapp knapp--farlig knapp--liten" onClick={() => taBortFeedback(f.id)}>
                  Ta bort
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Sökningar utan träffar</h2>
          {sokloggar.length === 0 && (
            <p className="sida__beskrivning">Inga nolleträffar loggade ännu.</p>
          )}
          {sokningarPerDag.length > 0 && (
            <div className="admin-statistik-trend">
              {sokningarPerDag.map(([dag, antal]) => (
                <div key={dag} className="admin-statistik-trend__rad">
                  <span className="admin-statistik-trend__dag">{dag}</span>
                  <div className="admin-statistik-trend__bar-bakgrund">
                    <div
                      className="admin-statistik-trend__bar"
                      style={{ width: `${(antal / maxPerDag) * 100}%` }}
                    />
                  </div>
                  <span className="admin-statistik-trend__antal">{antal}</span>
                </div>
              ))}
            </div>
          )}
          <ul className="admin-lista admin-lista--vertikal">
            {sokloggar.map((s) => (
              <li key={s.id} className="admin-feedback-rad">
                <div className="admin-feedback-rad__meta">
                  <span>"{s.term}"</span>
                  <span>{formateraTid(s.tidpunkt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {arSuperadmin && (
        <section className="admin-sektion">
          <h2>Ändringslogg</h2>
          {auditlogg.length === 0 && <p className="sida__beskrivning">Inga händelser loggade ännu.</p>}
          {auditlogg.length > 0 && (
            <div className="admin-audit-filter">
              <input
                type="search"
                placeholder="Sök i beskrivning..."
                value={auditSok}
                onChange={(e) => setAuditSok(e.target.value)}
              />
              <select value={auditTypFilter} onChange={(e) => setAuditTypFilter(e.target.value)}>
                <option value="">Alla typer</option>
                {auditTyper.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
          <ul className="admin-lista admin-lista--vertikal">
            {filtreradAuditlogg.map((a) => (
              <li key={a.id} className="admin-feedback-rad">
                <div className="admin-feedback-rad__meta">
                  <span>{a.beskrivning}</span>
                  <span>{formateraTid(a.tidpunkt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
