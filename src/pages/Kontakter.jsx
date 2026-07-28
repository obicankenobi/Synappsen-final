import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useKontakter } from "../hooks/useKontakter";
import { KAN_HANTERA_ANSLAG } from "../firebase/roles";
import { telHref } from "../utils/telefon";
import KontaktFormular from "../components/KontaktFormular";
import Skelett from "../components/Skelett";
import "./Kontakter.css";

export default function Kontakter() {
  const { currentUser, role } = useAuth();
  const { kontakter, laddar, skapaKontakt, uppdateraKontakt, taBortKontakt } = useKontakter();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);
  const [sokterm, setSokterm] = useState("");

  const farHantera = KAN_HANTERA_ANSLAG.includes(role);

  const filtrerade = kontakter.filter((k) => {
    const term = sokterm.trim().toLowerCase();
    if (!term) return true;
    return k.namn.toLowerCase().includes(term) || k.kategori.toLowerCase().includes(term);
  });

  const grupperade = useMemo(() => {
    const grupper = new Map();
    filtrerade.forEach((k) => {
      const lista = grupper.get(k.kategori) ?? [];
      lista.push(k);
      grupper.set(k.kategori, lista);
    });
    return [...grupper.entries()];
  }, [filtrerade]);

  async function hanteraSpara(varden) {
    if (redigerar) {
      await uppdateraKontakt(redigerar.id, varden, currentUser.uid);
    } else {
      await skapaKontakt({ ...varden, uid: currentUser.uid });
    }
    setVisaFormular(false);
    setRedigerar(null);
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>☎️ Kontaktlista</h1>
      <p className="sida__beskrivning">
        Interna och externa telefonnummer. Tryck på ett nummer för att ringa direkt.
      </p>

      <input
        type="search"
        className="kontakter-sok"
        placeholder="Sök namn eller kategori..."
        value={sokterm}
        onChange={(e) => setSokterm(e.target.value)}
      />

      {farHantera && !visaFormular && (
        <button className="knapp" onClick={() => setVisaFormular(true)}>
          Lägg till kontakt
        </button>
      )}

      {visaFormular && (
        <KontaktFormular
          initialaVarden={redigerar}
          befintliga={kontakter}
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
          <p>Inga kontakter registrerade ännu.</p>
        </div>
      )}

      {grupperade.map(([kategori, lista]) => (
        <section key={kategori} className="kontakter-grupp">
          <h2>{kategori}</h2>
          <ul className="kontakter-lista">
            {lista.map((k) => (
              <li key={k.id} className="kontakter-rad">
                <div>
                  <strong>{k.namn}</strong>
                  {k.beskrivning && <div className="kontakter-rad__beskrivning">{k.beskrivning}</div>}
                </div>
                <div className="kontakter-rad__hoger">
                  <a className="kontakter-rad__nummer" href={telHref(k.nummer)}>
                    📞 {k.nummer}
                  </a>
                  {farHantera && (
                    <div className="kontakter-rad__atgarder">
                      <button
                        className="knapp--lank"
                        onClick={() => {
                          setRedigerar(k);
                          setVisaFormular(true);
                        }}
                      >
                        Redigera
                      </button>
                      <button className="knapp--lank" onClick={() => taBortKontakt(k.id, currentUser.uid)}>
                        Ta bort
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
