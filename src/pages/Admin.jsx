import { useMemo, useState } from "react";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
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
import { tvingaUtloggning, testaBeroenden } from "../firebase/functions";
import { APP_VERSION } from "../version";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
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

export default function Admin() {
  const { role } = useAuth();
  const arSuperadmin = role === ROLES.SUPERADMIN;
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();
  const { budget, satTakKr } = useGeminiBudget();
  const { feedback, taBortFeedback, uppdateraFeedbackStatus, svaraPaFeedback } = useFeedback(arSuperadmin);
  const { sokloggar } = useSokloggar(arSuperadmin);
  const { auditlogg } = useAuditlogg(arSuperadmin);
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
                  ["Gemini (AI-tolkning/klinikstöd)", beroendeStatus.gemini],
                  ["Sökmotor (klinikstöd-källor)", beroendeStatus.sokmotor],
                  ["Storage (uppladdade bilder)", beroendeStatus.storage],
                ].map(([namn, status]) => (
                  <li key={namn}>
                    <span className={status.ok ? "admin-beroendetest__punkt--ok" : "admin-beroendetest__punkt--fel"}>
                      {status.ok ? "🟢" : "🔴"}
                    </span>{" "}
                    {namn}
                    {!status.ok && status.fel && <span> – {status.fel}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
