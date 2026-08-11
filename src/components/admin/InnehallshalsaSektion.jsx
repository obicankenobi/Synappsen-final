import { useState } from "react";
import { useRutiner } from "../../hooks/useRutiner";
import { useAnvandare } from "../../hooks/useAnvandare";
import { useAuth } from "../../hooks/useAuth";
import { useGranskningsrundor } from "../../hooks/useGranskningsrundor";
import { sammanstallHalsa } from "../../utils/innehallshalsa";
import { ROLES, ROLE_LABELS } from "../../firebase/roles";
import { OMRADE_NAMN } from "./adminHjalp";
import "./InnehallshalsaSektion.css";

const FLAGGA_TEXT = {
  passeratGranskningsdatum: "Bör granskas (över 180 dagar)",
  saknarAgare: "Saknar ägare",
  aldrigKvitterad: "Ingen har kvitterat",
  obesvaradKallvarning: "Obesvarad källvarning",
  utgangen: "Utgångsdatum har passerat",
};

// Etapp 62c: startar en granskningsrunda för exakt de rutiner som redan är flaggade
// "bör granskas" (gruppvis per område, eftersom en runda i sig alltid gäller ett enda
// område – se GranskningsrundorSektion.jsx). Deadline sätts till 14 dagar fram; ingen ny
// tröskel att ställa in, rutinerna är redan valda av flaggan.
const RUNDA_DEADLINE_DAGAR = 14;

function beraknaDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + RUNDA_DEADLINE_DAGAR);
  return d.toISOString().slice(0, 10);
}

function Nedbrytning({ nedbrytning, total, borGranskasIds, hanteraStartaGranskning, startarGranskning, visaGranskningsknapp }) {
  return (
    <ul className="innehallshalsa__nedbrytning">
      {Object.entries(nedbrytning).map(([flagga, antal]) => (
        <li key={flagga}>
          <span>{FLAGGA_TEXT[flagga]}</span>
          <span>
            {antal} av {total}
            {visaGranskningsknapp && flagga === "passeratGranskningsdatum" && antal > 0 && (
              <button
                type="button"
                className="knapp knapp--liten knapp--sekundar"
                onClick={hanteraStartaGranskning}
                disabled={startarGranskning || borGranskasIds.length === 0}
              >
                {startarGranskning ? "Startar..." : "Starta granskningsrunda"}
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Etapp 62c: en liten inline-väljare för att tilldela ägare direkt i "behöver
// uppmärksamhet"-listan, istället för att behöva öppna rutinformuläret. Samma två ägartyper
// (roll/person) som RutinFormular.jsx, men utan resten av formuläret.
function AgareValjare({ anvandare, onTilldela }) {
  const [typ, setTyp] = useState("roll");
  const [roll, setRoll] = useState("");
  const [uid, setUid] = useState("");
  const [sparar, setSparar] = useState(false);

  async function hanteraTilldela() {
    let agare = null;
    if (typ === "roll" && roll) {
      agare = { typ: "roll", roll };
    } else if (typ === "person" && uid) {
      const person = anvandare.find((a) => a.id === uid);
      agare = { typ: "person", uid, namn: person?.namn ?? person?.email ?? "" };
    }
    if (!agare) return;
    setSparar(true);
    try {
      await onTilldela(agare);
    } finally {
      setSparar(false);
    }
  }

  return (
    <div className="innehallshalsa__agare-valjare">
      <select value={typ} onChange={(e) => setTyp(e.target.value)} aria-label="Ägartyp">
        <option value="roll">Roll</option>
        <option value="person">Person</option>
      </select>
      {typ === "roll" ? (
        <select value={roll} onChange={(e) => setRoll(e.target.value)} aria-label="Välj roll">
          <option value="">Välj roll...</option>
          {Object.values(ROLES)
            .filter((r) => r !== ROLES.KIOSK)
            .map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
        </select>
      ) : (
        <select value={uid} onChange={(e) => setUid(e.target.value)} aria-label="Välj person">
          <option value="">Välj person...</option>
          {anvandare.map((a) => (
            <option key={a.id} value={a.id}>
              {a.namn || a.email}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="knapp knapp--liten"
        onClick={hanteraTilldela}
        disabled={sparar || (typ === "roll" ? !roll : !uid)}
      >
        {sparar ? "Sparar..." : "Tilldela"}
      </button>
    </div>
  );
}

// Etapp 37a: innehållshälsopanelen. Sammanställer redan befintlig data (granskadDatum, agare,
// lasteAv, kallVarning, utgångsdatum) – ingen ny insamling. Hälsosiffran visas ALDRIG utan sin
// nedbrytning i samma vy (se ETAPPLAN6.md Etapp 37a) – annars blir den ett mål i sig i stället
// för ett diagnosverktyg.
// Etapp 59a (ETAPPLAN12.md, bugfynd): "logistik" är INTE ett rutinområde – /logistik visar
// bara förråd, ingen Sektionssida finns för att läsa en rutin där. Att ändå räkna in
// omrade:"logistik"-rutiner här (kvarlevor från Etapp 56a:s seedning, sedan borttagen) gav en
// hälsosiffra som räknade rutiner ingen användare någonsin kunde nå. Se genomgående krav 23.
export default function InnehallshalsaSektion({ endastOmrade }) {
  const { currentUser, namn } = useAuth();
  const { rutiner: klinisktRutiner, uppdateraRutin: uppdateraKlinisktRutin } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner, uppdateraRutin: uppdateraAdminRutin } = useRutiner("administration");
  const { anvandare } = useAnvandare();
  // Etapp 62c: bara superadmin-vyn (ingen endastOmrade) har läsrättighet till
  // granskningsrundor, se firestore.rules – se motiveringen i useGranskningsrundor.js.
  const { startaRunda } = useGranskningsrundor(!endastOmrade);
  const [startarGranskning, setStartarGranskning] = useState(false);
  const [granskningMeddelande, setGranskningMeddelande] = useState(null);

  const allaRutiner = endastOmrade
    ? { "kliniskt-stod": klinisktRutiner, administration: adminRutiner }[endastOmrade] ?? []
    : [...klinisktRutiner, ...adminRutiner];

  const uppdateraFunktioner = {
    "kliniskt-stod": uppdateraKlinisktRutin,
    administration: uppdateraAdminRutin,
  };

  const { total, halsosiffra, nedbrytning, poster } = sammanstallHalsa(allaRutiner);
  const sjukaPoster = poster.filter((p) => p.antalFlaggor > 0).slice(0, 20);
  const borGranskasIds = poster.filter((p) => p.flaggor.passeratGranskningsdatum).map((p) => p.id);

  async function hanteraStartaGranskning() {
    const grupperat = poster
      .filter((p) => p.flaggor.passeratGranskningsdatum)
      .reduce((acc, p) => {
        (acc[p.omrade] ??= []).push(p.id);
        return acc;
      }, {});
    setStartarGranskning(true);
    try {
      const deadline = beraknaDeadline();
      await Promise.all(
        Object.entries(grupperat).map(([omrade, rutinIds]) =>
          startaRunda({ omrade, trosallDagar: null, deadline, rutinIds, uid: currentUser?.uid, namn })
        )
      );
      setGranskningMeddelande(`Granskningsrunda startad för ${borGranskasIds.length} rutiner, deadline ${deadline}.`);
      setTimeout(() => setGranskningMeddelande(null), 5000);
    } finally {
      setStartarGranskning(false);
    }
  }

  async function hanteraTilldelaAgare(post, agare) {
    const uppdatera = uppdateraFunktioner[post.omrade];
    if (!uppdatera) return;
    await uppdatera(post.id, { agare }, currentUser?.uid);
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>🩺 Innehållshälsa{endastOmrade ? ` – ${OMRADE_NAMN[endastOmrade]}` : ""}</h2></summary>
      <p className="sida__beskrivning">
        Hur aktuella de godkända rutinerna är – sammanställt av data som redan finns, ingen ny
        insamling.
      </p>
      {total === 0 ? (
        <p className="sida__beskrivning">Inga godkända rutiner ännu.</p>
      ) : (
        <>
          <p className="innehallshalsa__siffra">
            <strong>{halsosiffra}%</strong> av {total} godkända rutiner har ingen flagga
          </p>
          <Nedbrytning
            nedbrytning={nedbrytning}
            total={total}
            borGranskasIds={borGranskasIds}
            hanteraStartaGranskning={hanteraStartaGranskning}
            startarGranskning={startarGranskning}
            visaGranskningsknapp={!endastOmrade}
          />
          {granskningMeddelande && <p role="status">{granskningMeddelande}</p>}
          {sjukaPoster.length > 0 && (
            <>
              <h3>Rutiner som behöver uppmärksamhet</h3>
              <div className="innehallshalsa__tabell-wrapper">
                <table className="innehallshalsa__tabell">
                  <thead>
                    <tr>
                      <th>Rutin</th>
                      <th>Område</th>
                      <th>Ålder (dagar)</th>
                      <th>Flaggor</th>
                      <th>Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sjukaPoster.map((p) => (
                      <tr key={p.id}>
                        <td>{p.titel}</td>
                        <td>{OMRADE_NAMN[p.omrade] ?? p.omrade}</td>
                        <td>{p.aldrDagar ?? "-"}</td>
                        <td>
                          {Object.entries(p.flaggor)
                            .filter(([, sant]) => sant)
                            .map(([flagga]) => FLAGGA_TEXT[flagga])
                            .join(", ")}
                        </td>
                        <td>
                          {p.flaggor.saknarAgare && (
                            <AgareValjare anvandare={anvandare} onTilldela={(agare) => hanteraTilldelaAgare(p, agare)} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {poster.length > sjukaPoster.length && (
                <p className="sida__beskrivning">
                  Visar de {sjukaPoster.length} mest flaggade av {poster.filter((p) => p.antalFlaggor > 0).length} rutiner med minst en flagga.
                </p>
              )}
            </>
          )}
        </>
      )}
    </details>
  );
}
