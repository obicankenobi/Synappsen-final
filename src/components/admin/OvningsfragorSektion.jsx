// Etapp 71: kundens egen förvaltning av Öva-lägets frågebank – slå av/på paket, skriv om
// eller dölj en leverantörsfråga, och skapa egna frågor.
//
// Superadmin OCH VÖL får hantera (ägarbeslut 2026-08-27), samma nivå som redan gäller för att
// godkänna kliniskt innehåll. Serverkontrollen ligger i functions/kvissbank.js – det här är
// bara UI-lagret av samma gating.
//
// VIKTIGT om dolda frågor: den här vyn läser de RÅA lagren, inte den sammanslagna banken.
// En dold fråga måste synas här (nedtonad) för att kunna slås på igen – den sammanslagna
// banken har per definition filtrerat bort den.
import { useState } from "react";
import {
  aterstallKvissoverlagring,
  satKvisspaket,
  sparaEgenKvissfraga,
  sparaKvissoverlagring,
  taBortEgenKvissfraga,
} from "../../firebase/functions";
import { useKvissbank } from "../../hooks/useKvissbank";
import { useDialog } from "../../hooks/useDialog";
import {
  LEVERANTORSPAKET_ORDNING,
  PAKET,
  PAKET_BESKRIVNING,
  PAKET_LABEL,
  paketAktivt,
} from "../../utils/kvissbank";
import "./OvningsfragorSektion.css";

const TOM_FRAGA = { fraga: "", alternativ: ["", "", ""], rattIndex: 0, hanvisning: "" };

// Ett redigeringsformulär, delat av "skriv om leverantörsfråga" och "egen fråga" – fälten är
// desamma, bara vart de sparas skiljer.
function FrageFormular({ varde, setVarde, onSpara, onAvbryt, sparar }) {
  function sattAlternativ(i, text) {
    setVarde({ ...varde, alternativ: varde.alternativ.map((a, j) => (j === i ? text : a)) });
  }

  return (
    <div className="ovningsfragor__formular">
      <label>
        Fråga
        <textarea
          rows={2}
          value={varde.fraga}
          onChange={(e) => setVarde({ ...varde, fraga: e.target.value })}
        />
      </label>

      <fieldset className="ovningsfragor__alternativ">
        <legend>Svarsalternativ (markera det rätta)</legend>
        {varde.alternativ.map((alt, i) => (
          <div key={i} className="ovningsfragor__alternativ-rad">
            <input
              type="radio"
              name="ovningsfragor-ratt"
              checked={varde.rattIndex === i}
              onChange={() => setVarde({ ...varde, rattIndex: i })}
              aria-label={`Markera alternativ ${i + 1} som rätt svar`}
            />
            <input
              type="text"
              value={alt}
              onChange={(e) => sattAlternativ(i, e.target.value)}
              aria-label={`Svarsalternativ ${i + 1}`}
            />
            {varde.alternativ.length > 3 && (
              <button
                type="button"
                className="knapp--lank"
                onClick={() =>
                  setVarde({
                    ...varde,
                    alternativ: varde.alternativ.filter((_, j) => j !== i),
                    // Pekade det rätta svaret på det borttagna alternativet faller det
                    // tillbaka på det första – annars hade rattIndex pekat i tomma luften.
                    rattIndex: varde.rattIndex === i ? 0 : varde.rattIndex,
                  })
                }
              >
                Ta bort
              </button>
            )}
          </div>
        ))}
        {varde.alternativ.length < 4 && (
          <button
            type="button"
            className="knapp--lank"
            onClick={() => setVarde({ ...varde, alternativ: [...varde.alternativ, ""] })}
          >
            + Lägg till alternativ
          </button>
        )}
      </fieldset>

      <label>
        Förklaring som visas vid fel svar (valfritt)
        <textarea
          rows={2}
          value={varde.hanvisning}
          onChange={(e) => setVarde({ ...varde, hanvisning: e.target.value })}
        />
      </label>

      <div className="ovningsfragor__formularknappar">
        <button type="button" className="knapp" disabled={sparar} onClick={onSpara}>
          {sparar ? "Sparar..." : "Spara"}
        </button>
        <button type="button" className="knapp--lank" onClick={onAvbryt}>
          Avbryt
        </button>
      </div>
    </div>
  );
}

export default function OvningsfragorSektion() {
  const { globalaFragor, overlagringar, egnaFragor, kundensVal, globaltStopp, laddar } =
    useKvissbank();
  const { confirm, visaMeddelande } = useDialog();
  const [redigerar, setRedigerar] = useState(null); // { typ: "global"|"egen", id }
  const [utkast, setUtkast] = useState(TOM_FRAGA);
  const [sparar, setSparar] = useState(false);

  async function korSkyddat(atgard, felmeddelande) {
    setSparar(true);
    try {
      await atgard();
      setRedigerar(null);
      setUtkast(TOM_FRAGA);
    } catch (fel) {
      visaMeddelande(fel.message ?? felmeddelande);
    } finally {
      setSparar(false);
    }
  }

  function borjaRedigeraGlobal(fraga) {
    const overlagring = overlagringar[fraga.id] ?? {};
    setRedigerar({ typ: "global", id: fraga.id });
    setUtkast({
      fraga: overlagring.fraga ?? fraga.fraga,
      alternativ: overlagring.alternativ ?? fraga.alternativ,
      rattIndex: overlagring.rattIndex ?? fraga.rattIndex,
      hanvisning: overlagring.hanvisning ?? fraga.hanvisning ?? "",
    });
  }

  if (laddar) {
    return (
      <details className="admin-sektion admin-sektion--hopfallbar">
        <summary><h2><span aria-hidden="true">🎓</span> Övningsfrågor</h2></summary>
        <p>Laddar...</p>
      </details>
    );
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🎓</span> Övningsfrågor</h2></summary>
      <p className="sida__beskrivning">
        Styr vad som visas i Öva-läget. Inget svar från övningarna sparas någonstans – varken
        för den som övar eller för er som chefer. Att stänga av ett paket döljer det för alla i
        organisationen; frågorna finns kvar och kan slås på igen.
      </p>

      {LEVERANTORSPAKET_ORDNING.map((paket) => {
        const fragorIPaketet = globalaFragor.filter((f) => f.paket === paket);
        const globaltStoppat = globaltStopp?.[paket]?.avstangt === true;
        const aktivt = paketAktivt(paket, kundensVal, globaltStopp);

        return (
          <div key={paket} className="ovningsfragor__paket">
            <label className="ovningsfragor__paketrubrik">
              <input
                type="checkbox"
                checked={kundensVal?.[paket] !== false}
                disabled={globaltStoppat || sparar}
                onChange={(e) =>
                  korSkyddat(
                    () => satKvisspaket(paket, e.target.checked),
                    "Kunde inte ändra paketet."
                  )
                }
              />{" "}
              <strong>{PAKET_LABEL[paket]}</strong>{" "}
              <span className="ovningsfragor__antal">({fragorIPaketet.length} frågor)</span>
            </label>
            <p className="ovningsfragor__beskrivning">{PAKET_BESKRIVNING[paket]}</p>

            {globaltStoppat && (
              <p className="ovningsfragor__stoppat">
                ⚠️ Paketet är tillfälligt stoppat av leverantören och visas inte för någon,
                oavsett inställningen här. Det sker när ett fel upptäckts i en fråga.
              </p>
            )}

            {aktivt && fragorIPaketet.length > 0 && (
              <ul className="ovningsfragor__lista">
                {fragorIPaketet.map((f) => {
                  const overlagring = overlagringar[f.id];
                  const dold = overlagring?.dold === true;
                  const omskriven =
                    !dold &&
                    overlagring &&
                    ["fraga", "alternativ", "rattIndex", "hanvisning"].some(
                      (k) => overlagring[k] !== undefined
                    );

                  return (
                    <li key={f.id} className={dold ? "ovningsfragor__rad--dold" : undefined}>
                      <div className="ovningsfragor__radtext">
                        {overlagring?.fraga ?? f.fraga}
                        {omskriven && <span className="ovningsfragor__markering"> · omskriven av er</span>}
                        {dold && <span className="ovningsfragor__markering"> · dold</span>}
                        {f.kalla && (
                          <span className="ovningsfragor__kalla">
                            Källa: {f.kalla}
                            {f.kallaDatum ? ` (${f.kallaDatum})` : ""}
                          </span>
                        )}
                      </div>

                      {redigerar?.typ === "global" && redigerar.id === f.id ? (
                        <FrageFormular
                          varde={utkast}
                          setVarde={setUtkast}
                          sparar={sparar}
                          onAvbryt={() => setRedigerar(null)}
                          onSpara={() =>
                            korSkyddat(
                              () => sparaKvissoverlagring({ fragaId: f.id, ...utkast }),
                              "Kunde inte spara ändringen."
                            )
                          }
                        />
                      ) : (
                        <div className="ovningsfragor__radknappar">
                          <button
                            type="button"
                            className="knapp--lank"
                            onClick={() => borjaRedigeraGlobal(f)}
                          >
                            Skriv om
                          </button>
                          <button
                            type="button"
                            className="knapp--lank"
                            onClick={() =>
                              korSkyddat(
                                () => sparaKvissoverlagring({ fragaId: f.id, dold: !dold }),
                                "Kunde inte ändra frågan."
                              )
                            }
                          >
                            {dold ? "Visa igen" : "Dölj"}
                          </button>
                          {(omskriven || dold) && (
                            <button
                              type="button"
                              className="knapp--lank"
                              onClick={() =>
                                korSkyddat(
                                  () => aterstallKvissoverlagring(f.id),
                                  "Kunde inte återställa frågan."
                                )
                              }
                              title="Ta bort er ändring. Frågan följer då leverantörens original igen, inklusive framtida rättelser."
                            >
                              Återställ original
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {/* Kundens egna frågor – eget paket, ingen leverantörskoppling */}
      <div className="ovningsfragor__paket">
        <label className="ovningsfragor__paketrubrik">
          <input
            type="checkbox"
            checked={kundensVal?.[PAKET.EGET] !== false}
            disabled={sparar}
            onChange={(e) =>
              korSkyddat(
                () => satKvisspaket(PAKET.EGET, e.target.checked),
                "Kunde inte ändra paketet."
              )
            }
          />{" "}
          <strong>{PAKET_LABEL[PAKET.EGET]}</strong>{" "}
          <span className="ovningsfragor__antal">({egnaFragor.length} frågor)</span>
        </label>
        <p className="ovningsfragor__beskrivning">{PAKET_BESKRIVNING[PAKET.EGET]}</p>

        <ul className="ovningsfragor__lista">
          {egnaFragor.map((f) => (
            <li key={f.id}>
              <div className="ovningsfragor__radtext">{f.fraga}</div>
              {redigerar?.typ === "egen" && redigerar.id === f.id ? (
                <FrageFormular
                  varde={utkast}
                  setVarde={setUtkast}
                  sparar={sparar}
                  onAvbryt={() => setRedigerar(null)}
                  onSpara={() =>
                    korSkyddat(
                      () => sparaEgenKvissfraga({ id: f.id, ...utkast }),
                      "Kunde inte spara frågan."
                    )
                  }
                />
              ) : (
                <div className="ovningsfragor__radknappar">
                  <button
                    type="button"
                    className="knapp--lank"
                    onClick={() => {
                      setRedigerar({ typ: "egen", id: f.id });
                      setUtkast({
                        fraga: f.fraga,
                        alternativ: f.alternativ,
                        rattIndex: f.rattIndex,
                        hanvisning: f.hanvisning ?? "",
                      });
                    }}
                  >
                    Redigera
                  </button>
                  <button
                    type="button"
                    className="knapp--lank"
                    onClick={async () => {
                      if (!(await confirm(`Ta bort frågan "${f.fraga}"?`))) return;
                      korSkyddat(() => taBortEgenKvissfraga(f.id), "Kunde inte ta bort frågan.");
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {redigerar?.typ === "ny" ? (
          <FrageFormular
            varde={utkast}
            setVarde={setUtkast}
            sparar={sparar}
            onAvbryt={() => setRedigerar(null)}
            onSpara={() =>
              korSkyddat(() => sparaEgenKvissfraga(utkast), "Kunde inte skapa frågan.")
            }
          />
        ) : (
          <button
            type="button"
            className="knapp"
            onClick={() => {
              setRedigerar({ typ: "ny" });
              setUtkast(TOM_FRAGA);
            }}
          >
            + Ny egen fråga
          </button>
        )}
      </div>
    </details>
  );
}
