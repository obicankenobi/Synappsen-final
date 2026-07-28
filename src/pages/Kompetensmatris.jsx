import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAllaGodkandaRutiner } from "../hooks/useAllaGodkandaRutiner";
import { useKompetenskrav } from "../hooks/useKompetenskrav";
import { berakraKompetensStatus, KOMPETENS_STATUS, KOMPETENS_STATUS_LABEL } from "../utils/kompetensStatus";
import { ROLES, ROLE_LABELS, KAN_HANTERA_ANSLAG } from "../firebase/roles";
import "./Admin.css";
import "./Kompetensmatris.css";

// Etapp 19c: chefer som får ÖPPNA matrisvyn (sektionsledare behöver kunna se sin egen
// personalgrupp, men bara VEC/superadmin får DEFINIERA vilka rutiner som är obligatoriska –
// se farHanteraAnslag() i firestore.rules, som styr skrivrätten till kompetenskrav).
const KAN_SE_MATRIS = [ROLES.SUPERADMIN, ROLES.VEC, ROLES.SEKTIONSLEDARE];

const STATUS_IKON = {
  [KOMPETENS_STATUS.KLAR]: "✅",
  [KOMPETENS_STATUS.FORFALLER_SNART]: "🟡",
  [KOMPETENS_STATUS.FORFALLEN]: "🔴",
  [KOMPETENS_STATUS.SAKNAS]: "⬜",
};

const STATUS_KLASS = {
  [KOMPETENS_STATUS.KLAR]: "kompetensmatris__status--klar",
  [KOMPETENS_STATUS.FORFALLEN]: "kompetensmatris__status--forfallen",
};

export default function Kompetensmatris() {
  const { role, currentUser } = useAuth();
  const farSeMatris = KAN_SE_MATRIS.includes(role);
  const farHanteraKrav = KAN_HANTERA_ANSLAG.includes(role);
  const { anvandare } = useAnvandare();
  const { rutiner } = useAllaGodkandaRutiner();
  const { krav, skapaKrav, taBortKrav } = useKompetenskrav();

  const [nyRoll, setNyRoll] = useState(ROLES.PERSONAL);
  const [nyRutinId, setNyRutinId] = useState("");
  const [nyFrekvens, setNyFrekvens] = useState(12);

  const rutinKarta = useMemo(() => new Map(rutiner.map((r) => [r.id, r])), [rutiner]);

  // Matrisen: en rad per (person, krav) där personens roll matchar kravets roll.
  const rader = useMemo(() => {
    return krav.flatMap((k) => {
      const rutin = rutinKarta.get(k.rutinId);
      return anvandare
        .filter((a) => a.role === k.roll)
        .map((person) => ({
          person,
          krav: k,
          status: rutin ? berakraKompetensStatus(rutin, k.frekvensManader, person.id) : KOMPETENS_STATUS.SAKNAS,
        }));
    });
  }, [krav, anvandare, rutinKarta]);

  const gapLista = rader.filter((r) => r.status !== KOMPETENS_STATUS.KLAR);

  const minaRader = rader.filter((r) => r.person.id === currentUser?.uid);

  function exporteraGapLista() {
    const kolumner = ["Person", "Roll", "Rutin", "Status"];
    const dataRader = gapLista.map((r) =>
      [
        (r.person.namn ?? r.person.email ?? "").replaceAll(";", ","),
        ROLE_LABELS[r.krav.roll] ?? r.krav.roll,
        r.krav.rutinTitel.replaceAll(";", ","),
        KOMPETENS_STATUS_LABEL[r.status],
      ].join(";")
    );
    const blob = new Blob(["﻿" + [kolumner.join(";"), ...dataRader].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kompetensgap-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function hanteraLaggTillKrav(e) {
    e.preventDefault();
    const rutin = rutinKarta.get(nyRutinId);
    if (!rutin) return;
    await skapaKrav({
      roll: nyRoll,
      rutinId: rutin.id,
      rutinTitel: rutin.titel,
      omrade: rutin.omrade,
      frekvensManader: Number(nyFrekvens) || 12,
    });
    setNyRutinId("");
  }

  if (!farSeMatris) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        {minaRader.length > 0 && (
          <>
            <h1>📋 Min kompetensstatus</h1>
            <ul className="admin-lista">
              {minaRader.map((r, i) => (
                <li key={i} className="admin-lista__rad">
                  {STATUS_IKON[r.status]} {r.krav.rutinTitel} –{" "}
                  <span className={STATUS_KLASS[r.status]}>{KOMPETENS_STATUS_LABEL[r.status]}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {minaRader.length === 0 && (
          <p className="sida__beskrivning">Inga obligatoriska rutiner är kopplade till din roll ännu.</p>
        )}
      </div>
    );
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>📋 Kompetensmatris</h1>
      <p className="sida__beskrivning">
        Obligatoriska rutiner per roll, med status per person. Röd/gul = behöver
        (om)kvitteras. Kvittering med väsentlig ändring nollställer status automatiskt.
      </p>

      <section className="admin-sektion">
        <h2>Gap-lista</h2>
        <button className="knapp knapp--sekundar knapp--liten" onClick={exporteraGapLista} disabled={gapLista.length === 0}>
          Exportera som CSV (APT/ledningsrapport)
        </button>
        <ul className="admin-lista">
          {gapLista.map((r, i) => (
            <li key={i} className="admin-lista__rad">
              {STATUS_IKON[r.status]} <strong>{r.person.namn ?? r.person.email}</strong> – {r.krav.rutinTitel}
              <div className="admin-lista__email">
                {ROLE_LABELS[r.krav.roll]} ·{" "}
                <span className={STATUS_KLASS[r.status]}>{KOMPETENS_STATUS_LABEL[r.status]}</span>
              </div>
            </li>
          ))}
          {gapLista.length === 0 && <li>Ingen saknar en obligatorisk rutin just nu.</li>}
        </ul>
      </section>

      <section className="admin-sektion">
        <h2>Alla krav</h2>
        <ul className="admin-lista">
          {krav.map((k) => (
            <li key={k.id} className="admin-lista__rad">
              <div>
                <strong>{k.rutinTitel}</strong>
                <div className="admin-lista__email">
                  {ROLE_LABELS[k.roll]} · omkvittering var {k.frekvensManader}:e månad
                </div>
              </div>
              {farHanteraKrav && (
                <button className="knapp knapp--liten knapp--sekundar" onClick={() => taBortKrav(k.id)}>
                  Ta bort
                </button>
              )}
            </li>
          ))}
          {krav.length === 0 && <li>Inga obligatoriska rutiner definierade ännu.</li>}
        </ul>

        {farHanteraKrav && (
          <form className="introduktion__form" onSubmit={hanteraLaggTillKrav}>
            <label>
              Roll
              <select value={nyRoll} onChange={(e) => setNyRoll(e.target.value)}>
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rutin
              <select value={nyRutinId} onChange={(e) => setNyRutinId(e.target.value)} required>
                <option value="">Välj...</option>
                {rutiner.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.titel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Omkvittering (månader)
              <input type="number" min="1" value={nyFrekvens} onChange={(e) => setNyFrekvens(e.target.value)} />
            </label>
            <button type="submit" className="knapp knapp--liten">
              + Lägg till krav
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
