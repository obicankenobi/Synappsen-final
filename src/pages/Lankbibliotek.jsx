import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLankbibliotek } from "../hooks/useLankbibliotek";
import { KAN_HANTERA_ANSLAG } from "../firebase/roles";
import LankFormular from "../components/LankFormular";
import Skelett from "../components/Skelett";
import "./Kontakter.css";

export default function Lankbibliotek() {
  const { currentUser, role } = useAuth();
  const { lankar, laddar, skapaLank, uppdateraLank, taBortLank } = useLankbibliotek();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);

  const farHantera = KAN_HANTERA_ANSLAG.includes(role);

  const grupperade = useMemo(() => {
    const grupper = new Map();
    lankar.forEach((l) => {
      const lista = grupper.get(l.kategori) ?? [];
      lista.push(l);
      grupper.set(l.kategori, lista);
    });
    return [...grupper.entries()];
  }, [lankar]);

  async function hanteraSpara(varden) {
    if (redigerar) {
      await uppdateraLank(redigerar.id, varden, currentUser.uid);
    } else {
      await skapaLank({ ...varden, uid: currentUser.uid });
    }
    setVisaFormular(false);
    setRedigerar(null);
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">🔗</span> Länkbibliotek</h1>
      <p className="sida__beskrivning">Externa resurser – FASS, Internetmedicin, regionala PM med mera.</p>

      {farHantera && !visaFormular && (
        <button className="knapp" onClick={() => setVisaFormular(true)}>
          Lägg till länk
        </button>
      )}

      {visaFormular && (
        <LankFormular
          initialaVarden={redigerar}
          befintliga={lankar}
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
          }}
        />
      )}

      {laddar && <Skelett />}
      {!laddar && grupperade.length === 0 && (
        <div className="platshallare">
          <p>Inga länkar registrerade ännu.</p>
        </div>
      )}

      {grupperade.map(([kategori, lista]) => (
        <section key={kategori} className="kontakter-grupp">
          <h2>{kategori}</h2>
          <ul className="kontakter-lista">
            {lista.map((l) => (
              <li key={l.id} className="kontakter-rad">
                <div>
                  {/^https?:\/\//i.test(l.url) ? (
                    <a href={l.url} target="_blank" rel="noreferrer">
                      <strong>{l.titel}</strong>
                    </a>
                  ) : (
                    <strong>{l.titel}</strong>
                  )}
                  {l.beskrivning && <div className="kontakter-rad__beskrivning">{l.beskrivning}</div>}
                </div>
                {farHantera && (
                  <div className="kontakter-rad__atgarder">
                    <button
                      className="knapp--lank"
                      onClick={() => {
                        setRedigerar(l);
                        setVisaFormular(true);
                      }}
                    >
                      Redigera
                    </button>
                    <button className="knapp--lank" onClick={() => taBortLank(l.id, currentUser.uid)}>
                      Ta bort
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
