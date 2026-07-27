import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAnvandare } from "../hooks/useAnvandare";
import { useRutiner } from "../hooks/useRutiner";
import { useAnslag } from "../hooks/useAnslag";
import { useIntroduktionsspar } from "../hooks/useIntroduktionsspar";
import {
  useMinIntroduktionstilldelning,
  useAllaIntroduktionstilldelningar,
  tilldelaIntroduktionsspar,
  taBortIntroduktionstilldelning,
} from "../hooks/useIntroduktionstilldelningar";
import { berakraIntroduktionsProgress, dagarSedan, liggerEfter } from "../utils/introduktionProgress";
import { ROLES, ROLE_LABELS, KAN_HANTERA_ANSLAG } from "../firebase/roles";
import "./Introduktion.css";

const ETAPPNAMN = ["Dag 1", "Vecka 1", "Månad 1"];

function tomEtapp(namn) {
  return { namn, poster: [] };
}

// Etapp 19a: introduktionsspår. Progress beräknas alltid live utifrån befintliga
// lasteAv-listor (se utils/introduktionProgress.js) – ingen egen "klar"-status lagras.
export default function Introduktion() {
  const { currentUser, role, organisationId } = useAuth();
  const farHantera = KAN_HANTERA_ANSLAG.includes(role);
  const { anvandare } = useAnvandare();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: logistikRutiner } = useRutiner("logistik");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { anslag } = useAnslag();
  const { spar, skapaSpar, taBortSpar } = useIntroduktionsspar();
  const { tilldelning: minTilldelning } = useMinIntroduktionstilldelning();
  const { tilldelningar: allaTilldelningar } = useAllaIntroduktionstilldelningar();

  const [visaSparFormular, setVisaSparFormular] = useState(false);
  const [nyttNamn, setNyttNamn] = useState("");
  const [nyMalRoll, setNyMalRoll] = useState(ROLES.PERSONAL);
  const [nyaEtapper, setNyaEtapper] = useState(ETAPPNAMN.map(tomEtapp));
  const [valdUid, setValdUid] = useState("");
  const [valdSparId, setValdSparId] = useState("");

  const allaRutiner = useMemo(
    () => [...klinisktRutiner, ...logistikRutiner, ...adminRutiner],
    [klinisktRutiner, logistikRutiner, adminRutiner]
  );

  const innehallMap = useMemo(() => {
    const karta = new Map();
    allaRutiner.forEach((r) => {
      const sokvag = r.omrade === "kliniskt-stod" ? "/kliniskt-stod" : r.omrade === "logistik" ? "/logistik" : "/administration";
      karta.set(`rutin:${r.id}`, { titel: r.titel, sokvag, lasteAv: r.lasteAv });
    });
    anslag.forEach((a) => {
      karta.set(`anslag:${a.id}`, { titel: a.titel, sokvag: "/anslag", lasteAv: a.lasteAv });
    });
    return karta;
  }, [allaRutiner, anslag]);

  const mittSpar = spar.find((s) => s.id === minTilldelning?.sparId);
  const minProgress = mittSpar ? berakraIntroduktionsProgress(mittSpar.etapper, currentUser?.uid, innehallMap) : null;

  function laggTillEtapp() {
    setNyaEtapper((e) => [...e, tomEtapp(`Etapp ${e.length + 1}`)]);
  }

  function laggTillPost(etappIndex) {
    setNyaEtapper((e) =>
      e.map((etapp, i) =>
        i === etappIndex ? { ...etapp, poster: [...etapp.poster, { typ: "rutin", id: "", rekommenderadDag: 1 }] } : etapp
      )
    );
  }

  function uppdateraPost(etappIndex, postIndex, falt, varde) {
    setNyaEtapper((e) =>
      e.map((etapp, i) =>
        i === etappIndex
          ? { ...etapp, poster: etapp.poster.map((p, j) => (j === postIndex ? { ...p, [falt]: varde } : p)) }
          : etapp
      )
    );
  }

  function taBortPost(etappIndex, postIndex) {
    setNyaEtapper((e) =>
      e.map((etapp, i) => (i === etappIndex ? { ...etapp, poster: etapp.poster.filter((_, j) => j !== postIndex) } : etapp))
    );
  }

  async function hanteraSkapaSpar(e) {
    e.preventDefault();
    await skapaSpar({
      namn: nyttNamn,
      malRoll: nyMalRoll,
      etapper: nyaEtapper.map((etapp) => ({
        ...etapp,
        poster: etapp.poster.filter((p) => p.id),
      })),
    });
    setNyttNamn("");
    setNyMalRoll(ROLES.PERSONAL);
    setNyaEtapper(ETAPPNAMN.map(tomEtapp));
    setVisaSparFormular(false);
  }

  async function hanteraTilldela(e) {
    e.preventDefault();
    const person = anvandare.find((a) => a.id === valdUid);
    const valtSpar = spar.find((s) => s.id === valdSparId);
    if (!person || !valtSpar) return;
    await tilldelaIntroduktionsspar({
      uid: person.id,
      namn: person.namn ?? person.email ?? "",
      organisationId,
      spar: valtSpar,
    });
    setValdUid("");
    setValdSparId("");
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>🎓 Introduktion</h1>

      {minTilldelning && mittSpar && minProgress && (
        <section className="admin-sektion">
          <h2>Mitt introduktionsspår: {mittSpar.namn}</h2>
          <p className="introduktion__status">
            {minProgress.klara} av {minProgress.totalt} klara ({minProgress.procent}%)
          </p>
          <div className="introduktion__stapel">
            <div className="introduktion__stapel-fyllnad" style={{ width: `${minProgress.procent}%` }} />
          </div>
          <ul className="introduktion__lista">
            {minProgress.detaljer.map((p, i) => (
              <li key={i} className={p.klar ? "introduktion__post introduktion__post--klar" : "introduktion__post"}>
                <span>{p.klar ? "✅" : "⬜"}</span>
                <span className="introduktion__post-etapp">{p.etappNamn}</span>
                {p.sokvag ? <Link to={p.sokvag}>{p.titel}</Link> : <span>{p.titel}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!minTilldelning && !farHantera && (
        <p className="sida__beskrivning">Du har inget introduktionsspår tilldelat just nu.</p>
      )}

      {farHantera && (
        <>
          <section className="admin-sektion">
            <h2>Pågående introduktioner</h2>
            <ul className="admin-lista">
              {allaTilldelningar.map((t) => {
                const definierat = spar.find((s) => s.id === t.sparId);
                const progress = definierat
                  ? berakraIntroduktionsProgress(definierat.etapper, t.uid, innehallMap)
                  : null;
                const efter = progress ? liggerEfter(progress.detaljer, dagarSedan(t.tilldelad)) : false;
                return (
                  <li key={t.id} className="admin-lista__rad">
                    <div>
                      <strong>{t.namn}</strong> – {t.sparNamn}
                      {efter && <span className="introduktion__efter-flagga"> ⚠️ Ligger efter</span>}
                      <div className="admin-lista__email">
                        {progress ? `${progress.klara} av ${progress.totalt} klara (${progress.procent}%)` : "Spåret är borttaget"}
                      </div>
                    </div>
                    <button className="knapp knapp--liten knapp--sekundar" onClick={() => taBortIntroduktionstilldelning(t.uid)}>
                      Ta bort tilldelning
                    </button>
                  </li>
                );
              })}
              {allaTilldelningar.length === 0 && <li>Inga pågående introduktioner.</li>}
            </ul>
          </section>

          <section className="admin-sektion">
            <h2>Tilldela manuellt</h2>
            <form className="introduktion__form" onSubmit={hanteraTilldela}>
              <label>
                Person
                <select value={valdUid} onChange={(e) => setValdUid(e.target.value)} required>
                  <option value="">Välj...</option>
                  {anvandare.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namn ?? a.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Introduktionsspår
                <select value={valdSparId} onChange={(e) => setValdSparId(e.target.value)} required>
                  <option value="">Välj...</option>
                  {spar.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namn} ({ROLE_LABELS[s.malRoll]})
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="knapp knapp--liten">
                Tilldela
              </button>
            </form>
          </section>

          <section className="admin-sektion">
            <h2>Introduktionsspår</h2>
            <ul className="admin-lista">
              {spar.map((s) => (
                <li key={s.id} className="admin-lista__rad">
                  <div>
                    <strong>{s.namn}</strong>
                    <div className="admin-lista__email">
                      Målroll: {ROLE_LABELS[s.malRoll]} · {s.etapper?.reduce((sum, e) => sum + (e.poster?.length ?? 0), 0) ?? 0} poster
                    </div>
                  </div>
                  <button className="knapp knapp--liten knapp--sekundar" onClick={() => taBortSpar(s.id)}>
                    Ta bort
                  </button>
                </li>
              ))}
            </ul>

            {!visaSparFormular && (
              <button type="button" className="knapp knapp--liten" onClick={() => setVisaSparFormular(true)}>
                + Nytt introduktionsspår
              </button>
            )}

            {visaSparFormular && (
              <form className="introduktion__form" onSubmit={hanteraSkapaSpar}>
                <label>
                  Namn
                  <input type="text" required value={nyttNamn} onChange={(e) => setNyttNamn(e.target.value)} />
                </label>
                <label>
                  Målroll
                  <select value={nyMalRoll} onChange={(e) => setNyMalRoll(e.target.value)}>
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>

                {nyaEtapper.map((etapp, ei) => (
                  <fieldset key={ei} className="introduktion__etapp">
                    <legend>
                      <input
                        type="text"
                        value={etapp.namn}
                        onChange={(e) =>
                          setNyaEtapper((arr) => arr.map((et, i) => (i === ei ? { ...et, namn: e.target.value } : et)))
                        }
                      />
                    </legend>
                    {etapp.poster.map((p, pi) => (
                      <div key={pi} className="introduktion__postrad">
                        <select value={p.typ} onChange={(e) => uppdateraPost(ei, pi, "typ", e.target.value)}>
                          <option value="rutin">Rutin</option>
                          <option value="anslag">Anslag</option>
                        </select>
                        <select value={p.id} onChange={(e) => uppdateraPost(ei, pi, "id", e.target.value)}>
                          <option value="">Välj...</option>
                          {(p.typ === "rutin" ? allaRutiner : anslag).map((post) => (
                            <option key={post.id} value={post.id}>
                              {post.titel}
                            </option>
                          ))}
                        </select>
                        <label>
                          Dag
                          <input
                            type="number"
                            min="1"
                            value={p.rekommenderadDag}
                            onChange={(e) => uppdateraPost(ei, pi, "rekommenderadDag", Number(e.target.value))}
                          />
                        </label>
                        <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={() => taBortPost(ei, pi)}>
                          Ta bort
                        </button>
                      </div>
                    ))}
                    <button type="button" className="knapp knapp--liten" onClick={() => laggTillPost(ei)}>
                      + Lägg till post
                    </button>
                  </fieldset>
                ))}
                <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={laggTillEtapp}>
                  + Lägg till etapp
                </button>

                <div className="introduktion__formknappar">
                  <button type="button" className="knapp knapp--sekundar" onClick={() => setVisaSparFormular(false)}>
                    Avbryt
                  </button>
                  <button type="submit" className="knapp">
                    Spara spår
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
