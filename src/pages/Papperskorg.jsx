import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePapperskorg } from "../hooks/usePapperskorg";
import { arRedaktor } from "../firebase/roles";
import { useDialog } from "../hooks/useDialog";
import "./Papperskorg.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function Papperskorg() {
  const { currentUser, role } = useAuth();
  const { confirm, visaMeddelande } = useDialog();
  const { rutiner, artiklar, anslag, aterstall, raderaPermanent } = usePapperskorg();

  if (!arRedaktor(role)) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        {/* Etapp 45c: en sida helt utan rubrik gav axe-core: page-has-heading-one. */}
        <h1><span aria-hidden="true">🗑️</span> Papperskorg</h1>
        <p className="sida__beskrivning">Du har inte behörighet att se papperskorgen.</p>
      </div>
    );
  }

  const grupper = [
    { namn: "Rutiner", samling: "rutiner", poster: rutiner, fält: "titel" },
    { namn: "Förrådsartiklar", samling: "forradsartiklar", poster: artiklar, fält: "namn" },
    { namn: "Anslag", samling: "anslag", poster: anslag, fält: "titel" },
  ];

  const totalt = rutiner.length + artiklar.length + anslag.length;

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">🗑️</span> Papperskorg</h1>
      <p className="sida__beskrivning">
        Borttaget innehåll hamnar här och kan återställas. Permanent radering går inte att ångra.
      </p>

      {totalt === 0 && (
        <div className="platshallare">
          <p>Papperskorgen är tom.</p>
        </div>
      )}

      {grupper.map(
        ({ namn, samling, poster, fält }) =>
          poster.length > 0 && (
            <section key={samling} className="papperskorg-grupp">
              <h2>{namn}</h2>
              <ul className="papperskorg-lista">
                {poster.map((p) => (
                  <li key={p.id} className="papperskorg-rad">
                    <div>
                      <strong>{p[fält]}</strong>
                      <div className="papperskorg-rad__meta">
                        Borttagen {formateraTid(p.borttagenDatum)}
                      </div>
                    </div>
                    <div className="papperskorg-rad__atgarder">
                      <button
                        className="knapp knapp--liten"
                        onClick={async () => {
                          try {
                            await aterstall(samling, p.id, currentUser.uid);
                          } catch {
                            visaMeddelande("Du har inte behörighet att återställa detta.");
                          }
                        }}
                      >
                        Återställ
                      </button>
                      <button
                        className="knapp knapp--farlig knapp--liten"
                        onClick={async () => {
                          if (await confirm("Radera permanent? Detta går inte att ångra.")) {
                            try {
                              await raderaPermanent(samling, p.id, currentUser.uid);
                            } catch {
                              visaMeddelande("Du har inte behörighet att radera detta.");
                            }
                          }
                        }}
                      >
                        Radera permanent
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
      )}
    </div>
  );
}
