// Etapp 71: leverantörens redaktion för de globala övningsfrågorna, plus nödstoppet per paket.
//
// Frågorna här når SAMTLIGA kunder. Det är hela poängen (en rättelse ska slå igenom överallt),
// men det gör också redigeringen till något som förtjänar samma respekt som en deploy – därav
// dubbel bekräftelse på nödstoppet, samma mönster som EpostNodstoppSektion.
//
// Kunder som skrivit om en fråga behåller sin version; övriga får rättelsen automatiskt. Se
// utils/kvissbank.js för sammanslagningen och
// granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §5.1 för varför modellen ser ut så.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  satGlobaltKvisspaketStopp,
  seedaKvissbank,
  sparaGlobalKvissfraga,
  taBortGlobalKvissfraga,
} from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";
import { LEVERANTORSPAKET_ORDNING, PAKET_LABEL } from "../../utils/kvissbank";

const TOM = {
  fraga: "",
  alternativ: ["", "", ""],
  rattIndex: 0,
  hanvisning: "",
  kategori: "",
  kalla: "",
  kallaDatum: "",
};

export default function KvissbankSektion({ onFel }) {
  const { confirm } = useDialog();
  const [fragor, setFragor] = useState([]);
  const [stopp, setStopp] = useState({});
  const [valtPaket, setValtPaket] = useState(LEVERANTORSPAKET_ORDNING[0]);
  const [utkast, setUtkast] = useState(TOM);
  const [redigerarId, setRedigerarId] = useState(null);
  const [arbetar, setArbetar] = useState(false);

  useEffect(() => {
    const av1 = onSnapshot(collection(db, "kvissfragor"), (snap) =>
      setFragor(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const av2 = onSnapshot(collection(db, "kvisspaket"), (snap) =>
      setStopp(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])))
    );
    return () => {
      av1();
      av2();
    };
  }, []);

  async function kor(atgard) {
    setArbetar(true);
    try {
      await atgard();
      setUtkast(TOM);
      setRedigerarId(null);
    } catch (fel) {
      onFel?.(fel);
    } finally {
      setArbetar(false);
    }
  }

  async function vaxlaStopp(paket, avstangt) {
    const fraga = avstangt
      ? `Stoppa paketet "${PAKET_LABEL[paket]}" för ALLA kunder omedelbart? Använd detta när ` +
        "en fråga visat sig ha fel facit."
      : `Slå på paketet "${PAKET_LABEL[paket]}" igen för alla kunder?`;
    if (!(await confirm(fraga))) return;
    kor(() => satGlobaltKvisspaketStopp(paket, avstangt));
  }

  const fragorIPaketet = fragor.filter((f) => f.paket === valtPaket);
  const stoppat = stopp?.[valtPaket]?.avstangt === true;

  function sattAlternativ(i, text) {
    setUtkast({ ...utkast, alternativ: utkast.alternativ.map((a, j) => (j === i ? text : a)) });
  }

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">🎓</span> Övningsfrågor (global bank)</h2>
      <p className="sida__beskrivning">
        Frågorna här visas för alla kunder som inte stängt av paketet. En kund som skrivit om en
        fråga behåller sin version – övriga får din ändring automatiskt.
      </p>

      <label>
        Paket{" "}
        <select value={valtPaket} onChange={(e) => setValtPaket(e.target.value)}>
          {LEVERANTORSPAKET_ORDNING.map((p) => (
            <option key={p} value={p}>
              {PAKET_LABEL[p]}
            </option>
          ))}
        </select>
      </label>

      <p>
        {stoppat ? "⛔ Paketet är NÖDSTOPPAT för alla kunder." : "✅ Paketet är i drift."}{" "}
        <button
          type="button"
          className="knapp--lank"
          disabled={arbetar}
          onClick={() => vaxlaStopp(valtPaket, !stoppat)}
        >
          {stoppat ? "Slå på igen" : "Nödstoppa paketet"}
        </button>
      </p>

      {/* Startinnehållet ligger i functions/kvissfragorSeed.js. Idempotent: samma id varje
          gång, så en omkörning uppdaterar i stället för att dubblera – och kundernas egna
          överlagringar överlever, eftersom de är nycklade på samma id. Det här är alltså
          också vägen för att distribuera en rättelse av en fråga i filen. */}
      <p>
        <button
          type="button"
          className="knapp--lank"
          disabled={arbetar}
          onClick={async () => {
            if (
              !(await confirm(
                "Skriv startinnehållet till den globala banken? Frågor med samma id skrivs " +
                  "över med filens version – kundernas egna omskrivningar påverkas inte."
              ))
            )
              return;
            kor(async () => {
              const svar = await seedaKvissbank(false);
              const { skapade, uppdaterade } = svar.data ?? {};
              onFel?.(new Error(`Klart: ${skapade} nya, ${uppdaterade} uppdaterade.`));
            });
          }}
        >
          Skriv in startinnehållet
        </button>{" "}
        <button
          type="button"
          className="knapp--lank"
          disabled={arbetar}
          onClick={() =>
            kor(async () => {
              const svar = await seedaKvissbank(true);
              const { skapade, hoppadeOver } = svar.data ?? {};
              onFel?.(new Error(`Klart: ${skapade} nya, ${hoppadeOver} fanns redan.`));
            })
          }
        >
          Lägg bara till nya
        </button>
      </p>

      <ul>
        {fragorIPaketet.map((f) => (
          <li key={f.id}>
            {f.fraga}
            {f.kalla && ` — ${f.kalla}${f.kallaDatum ? ` (${f.kallaDatum})` : ""}`}{" "}
            <button
              type="button"
              className="knapp--lank"
              onClick={() => {
                setRedigerarId(f.id);
                setUtkast({
                  fraga: f.fraga,
                  alternativ: f.alternativ,
                  rattIndex: f.rattIndex,
                  hanvisning: f.hanvisning ?? "",
                  kategori: f.kategori ?? "",
                  kalla: f.kalla ?? "",
                  kallaDatum: f.kallaDatum ?? "",
                });
              }}
            >
              Redigera
            </button>{" "}
            <button
              type="button"
              className="knapp--lank"
              disabled={arbetar}
              onClick={async () => {
                if (!(await confirm(`Ta bort frågan "${f.fraga}" hos alla kunder?`))) return;
                kor(() => taBortGlobalKvissfraga(f.id));
              }}
            >
              Ta bort
            </button>
          </li>
        ))}
        {fragorIPaketet.length === 0 && <li>Inga frågor i paketet ännu.</li>}
      </ul>

      <h3>{redigerarId ? "Redigera fråga" : "Ny fråga"}</h3>
      <label>
        Fråga
        <textarea
          rows={2}
          value={utkast.fraga}
          onChange={(e) => setUtkast({ ...utkast, fraga: e.target.value })}
        />
      </label>

      <fieldset>
        <legend>Svarsalternativ (markera det rätta)</legend>
        {utkast.alternativ.map((alt, i) => (
          <div key={i}>
            <input
              type="radio"
              name="leverantor-kviss-ratt"
              checked={utkast.rattIndex === i}
              onChange={() => setUtkast({ ...utkast, rattIndex: i })}
              aria-label={`Markera alternativ ${i + 1} som rätt svar`}
            />
            <input
              type="text"
              value={alt}
              onChange={(e) => sattAlternativ(i, e.target.value)}
              aria-label={`Svarsalternativ ${i + 1}`}
            />
          </div>
        ))}
        {utkast.alternativ.length < 4 && (
          <button
            type="button"
            className="knapp--lank"
            onClick={() => setUtkast({ ...utkast, alternativ: [...utkast.alternativ, ""] })}
          >
            + Lägg till alternativ
          </button>
        )}
      </fieldset>

      <label>
        Förklaring vid fel svar
        <textarea
          rows={2}
          value={utkast.hanvisning}
          onChange={(e) => setUtkast({ ...utkast, hanvisning: e.target.value })}
        />
      </label>

      <label>
        Kategori (valfritt, grupperar frågan i Öva-lägets filter)
        <input
          type="text"
          value={utkast.kategori}
          onChange={(e) => setUtkast({ ...utkast, kategori: e.target.value })}
        />
      </label>

      {/* Källa och källdatum är obligatoriska i praktiken för det kliniska paketet – de är
          kravet som gör ett facit granskningsbart över tid (MDR-bedömningens §7). Fälten är
          frivilliga i koden eftersom ett processfråge-paket inte alltid har en källa. */}
      <label>
        Källa (t.ex. "Patientdatalagen 3 kap.")
        <input
          type="text"
          value={utkast.kalla}
          onChange={(e) => setUtkast({ ...utkast, kalla: e.target.value })}
        />
      </label>

      <label>
        Källan kontrollerad (ÅÅÅÅ-MM-DD)
        <input
          type="text"
          value={utkast.kallaDatum}
          onChange={(e) => setUtkast({ ...utkast, kallaDatum: e.target.value })}
        />
      </label>

      <div>
        <button
          type="button"
          className="knapp"
          disabled={arbetar}
          onClick={() =>
            kor(() =>
              sparaGlobalKvissfraga({
                ...(redigerarId ? { id: redigerarId } : {}),
                paket: valtPaket,
                ...utkast,
              })
            )
          }
        >
          {arbetar ? "Sparar..." : redigerarId ? "Spara ändring" : "Skapa fråga"}
        </button>
        {redigerarId && (
          <button
            type="button"
            className="knapp--lank"
            onClick={() => {
              setRedigerarId(null);
              setUtkast(TOM);
            }}
          >
            Avbryt
          </button>
        )}
      </div>
    </section>
  );
}
