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
import {
  useIntroduktionssigneringar,
  signeraIntroduktionspost,
  taBortSignering,
  postNyckel,
} from "../hooks/useIntroduktionssigneringar";
import { formateraDatum } from "../utils/datum";
import { ROLES, ROLE_LABELS, KAN_HANTERA_ANSLAG } from "../firebase/roles";
import "./Introduktion.css";

const ETAPPNAMN = ["Dag 1", "Vecka 1", "Månad 1"];

function tomEtapp(namn) {
  return { namn, poster: [] };
}

// Etapp 66b: en rad i chefsvyns "Pågående introduktioner", som egen komponent eftersom den
// behöver sin egen useIntroduktionssigneringar(t.uid)-prenumeration – att anropa en hook
// inuti allaTilldelningar.map(...) hade brutit hook-reglerna (samma mönster som RutinKort.jsx
// redan använder: varje rad äger sina egna hooks).
function PagagendeTilldelning({ tilldelning, progress, efter, currentUser, organisationId, onTaBortTilldelning }) {
  const { signeringar } = useIntroduktionssigneringar(tilldelning.uid);
  const [expanderad, setExpanderad] = useState(false);
  const signeradKarta = new Map(signeringar.map((s) => [s.id, s]));

  async function hanteraSignera(post) {
    await signeraIntroduktionspost({
      uid: tilldelning.uid,
      postTyp: post.typ,
      postId: post.id,
      etappNamn: post.etappNamn,
      signeradAv: currentUser.uid,
      signeradAvNamn: currentUser.displayName ?? currentUser.email ?? "",
      organisationId,
    });
  }

  async function hanteraTaBortSignering(nyckel, etappNamn) {
    await taBortSignering({ uid: tilldelning.uid, nyckel, etappNamn, raderadAv: currentUser.uid, organisationId });
  }

  return (
    <li className="admin-lista__rad introduktion__tilldelning">
      <div className="introduktion__tilldelning-huvud">
        <div>
          <strong>{tilldelning.namn}</strong> – {tilldelning.sparNamn}
          {efter && <span className="introduktion__efter-flagga"> ⚠️ Ligger efter</span>}
          <div className="admin-lista__email">
            {progress ? `${progress.klara} av ${progress.totalt} klara (${progress.procent}%)` : "Spåret är borttaget"}
          </div>
        </div>
        <div className="introduktion__tilldelning-knappar">
          {progress && (
            <button type="button" className="knapp--lank" onClick={() => setExpanderad((v) => !v)}>
              {expanderad ? "Dölj punkter" : "Signera punkter"}
            </button>
          )}
          <button className="knapp knapp--liten knapp--sekundar" onClick={() => onTaBortTilldelning(tilldelning.uid)}>
            Ta bort tilldelning
          </button>
        </div>
      </div>

      {expanderad && progress && (
        <ul className="introduktion__signeringslista">
          {progress.detaljer.map((p, i) => {
            const nyckel = postNyckel(p.typ, p.id);
            const signering = signeradKarta.get(nyckel);
            return (
              <li key={i} className="introduktion__signeringsrad">
                <span className={p.klar ? "introduktion__post introduktion__post--klar" : "introduktion__post"}>
                  {p.klar ? "✅" : "⬜"} {p.etappNamn}: {p.titel}
                  {p.harKviss && (
                    <span className="introduktion__kviss-flagga" title="Innehåller en kort kunskapskontroll vid kvittering">
                      {" "}
                      📝
                    </span>
                  )}
                </span>
                {signering ? (
                  <span className="introduktion__signerad">
                    Signerad av {signering.signeradAvNamn || "okänd"}, {formateraDatum(signering.tidpunkt)}{" "}
                    <button type="button" className="knapp--lank" onClick={() => hanteraTaBortSignering(nyckel, p.etappNamn)}>
                      Ta bort
                    </button>
                  </span>
                ) : tilldelning.uid === currentUser?.uid ? (
                  // Genomgående krav 28: ingen kan signera sin egen introduktion. Reglerna
                  // stoppar det ändå, men knappen döljs så det aldrig visas som ett
                  // misslyckat försök – samma "gränssnittet ska inte bjuda in till något
                  // reglerna ändå avvisar"-princip som gäller på andra ställen i appen.
                  <span className="introduktion__signerad">Du kan inte signera din egen introduktion</span>
                ) : (
                  <button type="button" className="knapp knapp--liten" onClick={() => hanteraSignera(p)}>
                    Signera
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
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
      karta.set(`rutin:${r.id}`, { titel: r.titel, sokvag, lasteAv: r.lasteAv, kviss: r.kviss });
    });
    anslag.forEach((a) => {
      karta.set(`anslag:${a.id}`, { titel: a.titel, sokvag: "/anslag", lasteAv: a.lasteAv });
    });
    return karta;
  }, [allaRutiner, anslag]);

  const mittSpar = spar.find((s) => s.id === minTilldelning?.sparId);
  const minProgress = mittSpar ? berakraIntroduktionsProgress(mittSpar.etapper, currentUser?.uid, innehallMap) : null;
  // Etapp 66b: mina egna handledarsignaturer, skilda från min egen lasteAv-kvittering ovan –
  // de två visas separat i listan nedan, aldrig hopslagna till en enda bock.
  const { signeringar: minaSigneringar } = useIntroduktionssigneringar(currentUser?.uid);
  const minSigneringsKarta = new Map(minaSigneringar.map((s) => [s.id, s]));

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
      <h1><span aria-hidden="true">🎓</span> Introduktion</h1>

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
            {minProgress.detaljer.map((p, i) => {
              const signering = minSigneringsKarta.get(postNyckel(p.typ, p.id));
              return (
                <li key={i} className={p.klar ? "introduktion__post introduktion__post--klar" : "introduktion__post"}>
                  <span>{p.klar ? "✅" : "⬜"}</span>
                  <span className="introduktion__post-etapp">{p.etappNamn}</span>
                  {p.sokvag ? <Link to={p.sokvag}>{p.titel}</Link> : <span>{p.titel}</span>}
                  {p.harKviss && (
                    <span className="introduktion__kviss-flagga" title="Innehåller en kort kunskapskontroll när du kvitterar">
                      📝 kunskapskontroll
                    </span>
                  )}
                  {signering && (
                    <span className="introduktion__signerad">
                      Signerad av {signering.signeradAvNamn || "okänd"}, {formateraDatum(signering.tidpunkt)}
                    </span>
                  )}
                </li>
              );
            })}
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
                  <PagagendeTilldelning
                    key={t.id}
                    tilldelning={t}
                    progress={progress}
                    efter={efter}
                    currentUser={currentUser}
                    organisationId={organisationId}
                    onTaBortTilldelning={taBortIntroduktionstilldelning}
                  />
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
