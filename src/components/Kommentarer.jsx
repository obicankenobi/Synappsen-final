import { useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useKommentarer } from "../hooks/useKommentarer";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import "./Kommentarer.css";

// Hittar ett ofullständigt "@handtag" precis före markörens position, t.ex. text
// "hej @an|na" med markör vid | ger "an" – används för autocomplete-förslag.
function hittaPagaendeHandtag(text, markorPosition) {
  const foreMarkor = text.slice(0, markorPosition);
  const match = foreMarkor.match(/@([a-zA-Z0-9._-]*)$/);
  return match ? match[1] : null;
}

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function KommentarRad({ kommentar, svar, currentUser, farTaBortAlla, taBortKommentar, onSvara, djup }) {
  return (
    <div className="kommentarer__rad" style={{ marginLeft: djup * 20 }}>
      <div className="kommentarer__meta">
        <strong>{kommentar.skapadAvNamn}</strong>
        <span>{formateraTid(kommentar.skapad)}</span>
      </div>
      <p>{kommentar.text}</p>
      <div className="kommentarer__rad-atgarder">
        <button type="button" className="knapp--lank" onClick={() => onSvara(kommentar.id)}>
          Svara
        </button>
        {(farTaBortAlla || kommentar.skapadAv === currentUser.uid) && (
          <button className="knapp--lank" onClick={() => taBortKommentar(kommentar.id)}>
            Ta bort
          </button>
        )}
      </div>
      {svar.map((s) => (
        <KommentarRad
          key={s.id}
          kommentar={s}
          svar={[]}
          currentUser={currentUser}
          farTaBortAlla={farTaBortAlla}
          taBortKommentar={taBortKommentar}
          onSvara={onSvara}
          djup={djup + 1}
        />
      ))}
    </div>
  );
}

// Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.5): farSkriva stängs av för kioskkontot.
// Servern nekade redan skapaKommentar för rollen kiosk, men formuläret visades ändå – och
// dess @-autokomplettering listar kollegors namn och e-postadresser fem i taget, vilket
// gjorde en obevakad foajéplatta till en uppslagsbok över personalen. Standardvärdet är
// true så att inget befintligt anropsställe ändrar beteende.
export default function Kommentarer({ rutinId, farTaBortAlla, anvandare = [], farSkriva = true }) {
  const { currentUser } = useAuth();
  const { visaMeddelande } = useDialog();
  const { kommentarer, skapaKommentar, taBortKommentar } = useKommentarer(rutinId);
  const [oppen, setOppen] = useState(false);
  const [text, setText] = useState("");
  const [svararPa, setSvararPa] = useState(null);
  const [skickar, setSkickar] = useState(false);
  const [pagaendeHandtag, setPagaendeHandtag] = useState(null);
  const textareaRef = useRef(null);

  const toppniva = kommentarer.filter((k) => !k.svarPa);
  const svarTill = (id) => kommentarer.filter((k) => k.svarPa === id);

  const forslag = useMemo(() => {
    if (pagaendeHandtag === null) return [];
    const prefix = pagaendeHandtag.toLowerCase();
    return anvandare
      .filter((a) => a.email && a.email.split("@")[0].toLowerCase().startsWith(prefix))
      .slice(0, 5);
  }, [pagaendeHandtag, anvandare]);

  function hanteraTextandring(e) {
    const nyText = e.target.value;
    setText(nyText);
    setPagaendeHandtag(hittaPagaendeHandtag(nyText, e.target.selectionStart));
  }

  function valjForslag(anvandarpost) {
    const handtag = anvandarpost.email.split("@")[0];
    const markorPosition = textareaRef.current?.selectionStart ?? text.length;
    const foreMarkor = text.slice(0, markorPosition).replace(/@([a-zA-Z0-9._-]*)$/, `@${handtag} `);
    const efterMarkor = text.slice(markorPosition);
    setText(foreMarkor + efterMarkor);
    setPagaendeHandtag(null);
    textareaRef.current?.focus();
  }

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const kontroll = kontrolleraPatientuppgifter(text);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    setSkickar(true);
    try {
      await skapaKommentar({ text: text.trim(), svarPa: svararPa });
      setText("");
      setSvararPa(null);
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte spara kommentaren.");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="kommentarer">
      <button type="button" className="knapp--lank kommentarer__toggle" onClick={() => setOppen((v) => !v)}>
        💬 {kommentarer.length > 0 ? `${kommentarer.length} kommentar(er)` : "Kommentera / fråga"}
      </button>

      {oppen && (
        <div className="kommentarer__panel">
          {toppniva.map((k) => (
            <KommentarRad
              key={k.id}
              kommentar={k}
              svar={svarTill(k.id)}
              currentUser={currentUser}
              farTaBortAlla={farTaBortAlla}
              taBortKommentar={taBortKommentar}
              onSvara={setSvararPa}
              djup={0}
            />
          ))}

          {!farSkriva && (
            <p className="kommentarer__tom">
              Kommentarer kan inte skrivas från en delad enhet. Logga in på ditt eget konto.
            </p>
          )}

          {farSkriva && (
          <form className="kommentarer__formular" onSubmit={hanteraSubmit}>
            {svararPa && (
              <p className="kommentarer__svarar-pa">
                Svarar på en kommentar.{" "}
                <button type="button" className="knapp--lank" onClick={() => setSvararPa(null)}>
                  Avbryt
                </button>
              </p>
            )}
            <div className="kommentarer__textarea-wrapper">
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder="Skriv en kommentar eller fråga... (@anvandarnamn för att nämna någon)"
                value={text}
                onChange={hanteraTextandring}
                onBlur={() => setTimeout(() => setPagaendeHandtag(null), 150)}
              />
              {forslag.length > 0 && (
                <ul className="kommentarer__forslag">
                  {forslag.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => valjForslag(a)}>
                        @{a.email.split("@")[0]} {a.namn ? `(${a.namn})` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="knapp knapp--liten" disabled={skickar}>
              Skicka
            </button>
          </form>
          )}
        </div>
      )}
    </div>
  );
}
