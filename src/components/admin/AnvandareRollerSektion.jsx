import { useState } from "react";
import { ROLES, ROLE_LABELS } from "../../firebase/roles";

// Etapp 66c: eget litet fält för ansvarsområden per rad, samma "kommaseparerad text,
// split/trim/filter vid spara"-mönster som taggar redan använder i RutinFormular.jsx. Egen
// komponent eftersom varje rad behöver sin egen lokala inputtext innan den sparas – annars
// skulle en enda delad state i föräldern skriva om alla rader samtidigt.
function AnsvarsomradenFalt({ anvandarpost, uppdateraAnsvarsomraden, currentUser, organisationId }) {
  const [text, setText] = useState((anvandarpost.ansvarsomraden ?? []).join(", "));
  const [sparar, setSparar] = useState(false);

  async function hanteraSpara() {
    const omraden = text
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    setSparar(true);
    try {
      await uppdateraAnsvarsomraden(anvandarpost.id, omraden, currentUser.uid, organisationId);
    } finally {
      setSparar(false);
    }
  }

  return (
    <label className="admin-lista__ansvarsomraden">
      Ansvarsområden
      <input
        type="text"
        placeholder="T.ex. medicinteknik, brandskydd"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={hanteraSpara}
        disabled={sparar}
        aria-label={`Ansvarsområden för ${anvandarpost.namn || anvandarpost.email || "användare"}`}
      />
    </label>
  );
}

// Etapp 70a: raderingen kräver att namnet skrivs, samma mönster som RaderaOrganisationSektion
// (krav 17, ETAPPLAN10.md). Egen komponent per rad eftersom varje rad behöver sitt eget
// inmatningsfält – samma skäl som PagagendeTilldelning i Introduktion.jsx.
function RaderaAnvandareFalt({ anvandarpost, andrarAnvandare, hanteraRaderaAnvandare }) {
  const [oppen, setOppen] = useState(false);
  const [skrivetNamn, setSkrivetNamn] = useState("");
  const namn = anvandarpost.namn || anvandarpost.email || "";
  const pagar = andrarAnvandare === anvandarpost.id;

  if (!oppen) {
    return (
      <button
        type="button"
        className="knapp knapp--farlig knapp--liten"
        disabled={pagar}
        onClick={() => setOppen(true)}
      >
        Radera
      </button>
    );
  }

  return (
    <span className="anvandare-radera">
      <input
        type="text"
        value={skrivetNamn}
        placeholder={`Skriv ${namn}`}
        aria-label={`Skriv ${namn} för att bekräfta radering`}
        onChange={(e) => setSkrivetNamn(e.target.value)}
      />
      <button
        type="button"
        className="knapp knapp--farlig knapp--liten"
        disabled={pagar || skrivetNamn.trim() !== namn}
        onClick={async () => {
          await hanteraRaderaAnvandare(anvandarpost);
          setOppen(false);
          setSkrivetNamn("");
        }}
      >
        {pagar ? "..." : "Radera permanent"}
      </button>
      <button
        type="button"
        className="knapp--lank"
        onClick={() => {
          setOppen(false);
          setSkrivetNamn("");
        }}
      >
        Avbryt
      </button>
    </span>
  );
}

export default function AnvandareRollerSektion({
  anvandare,
  laddar,
  currentUser,
  organisationId,
  uppdateraRoll,
  uppdateraAnsvarsomraden,
  loggarUtAnvandare,
  hanteraTvingaUtloggning,
  andrarAnvandare,
  hanteraSatAvstangd,
  hanteraRaderaAnvandare,
}) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>Användare och roller</h2></summary>
      {laddar && <p>Laddar...</p>}
      <ul className="admin-lista">
        {anvandare.map((anvandarpost) => (
          <li key={anvandarpost.id} className="admin-lista__rad">
            <div>
              <strong>{anvandarpost.namn || "(namn saknas)"}</strong>
              {anvandarpost.avstangd && (
                <span className="admin-lista__avstangd" title="Kontot kan inte logga in">
                  {" "}
                  🚫 Avstängd
                </span>
              )}
              <div className="admin-lista__email">{anvandarpost.email}</div>
            </div>
            <div className="admin-lista__atgarder">
              <select
                value={anvandarpost.role}
                disabled={anvandarpost.id === currentUser.uid}
                onChange={(e) => uppdateraRoll(anvandarpost.id, e.target.value)}
                aria-label={`Roll för ${anvandarpost.namn || anvandarpost.email || "användare"}`}
              >
                {Object.values(ROLES).map((roll) => (
                  <option key={roll} value={roll}>
                    {ROLE_LABELS[roll]}
                  </option>
                ))}
              </select>
              <AnsvarsomradenFalt
                anvandarpost={anvandarpost}
                uppdateraAnsvarsomraden={uppdateraAnsvarsomraden}
                currentUser={currentUser}
                organisationId={organisationId}
              />
              {anvandarpost.id !== currentUser.uid && (
                <>
                  <button
                    type="button"
                    className="knapp knapp--sekundar knapp--liten"
                    disabled={loggarUtAnvandare === anvandarpost.id}
                    onClick={() => hanteraTvingaUtloggning(anvandarpost)}
                    title="Avslutar pågående sessioner. Personen kan logga in igen med sitt lösenord."
                  >
                    {loggarUtAnvandare === anvandarpost.id ? "..." : "Tvinga utloggning"}
                  </button>
                  <button
                    type="button"
                    className="knapp knapp--liten"
                    disabled={andrarAnvandare === anvandarpost.id}
                    onClick={() => hanteraSatAvstangd(anvandarpost, !anvandarpost.avstangd)}
                    title={
                      anvandarpost.avstangd
                        ? "Låter personen logga in igen"
                        : "Spärrar inloggning helt. Historiken behålls och åtgärden går att ångra."
                    }
                  >
                    {andrarAnvandare === anvandarpost.id
                      ? "..."
                      : anvandarpost.avstangd
                        ? "Slå på konto"
                        : "Stäng av"}
                  </button>
                  <RaderaAnvandareFalt
                    anvandarpost={anvandarpost}
                    andrarAnvandare={andrarAnvandare}
                    hanteraRaderaAnvandare={hanteraRaderaAnvandare}
                  />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
