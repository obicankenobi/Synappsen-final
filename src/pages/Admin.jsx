import { useMemo, useState } from "react";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
import { useFeedback, FEEDBACK_TYP_LABELS } from "../hooks/useFeedback";
import { useSokloggar } from "../hooks/useSokloggar";
import { useAuditlogg } from "../hooks/useAuditlogg";
import { useRutiner } from "../hooks/useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
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
  const { feedback, taBortFeedback } = useFeedback(arSuperadmin);
  const { sokloggar } = useSokloggar(arSuperadmin);
  const { auditlogg } = useAuditlogg(arSuperadmin);
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { artiklar: forradsartiklar } = useForradsartiklar();
  const [nyttTak, setNyttTak] = useState("");

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

  return (
    <div className="sida">
      <h1>Adminpanel</h1>

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
          <h2>Användare och roller</h2>
          {laddar && <p>Laddar...</p>}
          <ul className="admin-lista">
            {anvandare.map((anvandarpost) => (
              <li key={anvandarpost.id} className="admin-lista__rad">
                <div>
                  <strong>{anvandarpost.namn || "(namn saknas)"}</strong>
                  <div className="admin-lista__email">{anvandarpost.email}</div>
                </div>
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
                </div>
                <p>{f.text}</p>
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
          <ul className="admin-lista admin-lista--vertikal">
            {auditlogg.map((a) => (
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
