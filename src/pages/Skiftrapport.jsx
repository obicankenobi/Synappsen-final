import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSkiftrapport } from "../hooks/useSkiftrapport";
import { arRedaktor } from "../firebase/roles";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import "./Skiftrapport.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function Skiftrapport() {
  const { currentUser, role } = useAuth();
  const { visaMeddelande } = useDialog();
  const { aktiva, atgardadeSenaste, laddar, skapaPost, markeraAtgardad, taBortPost } = useSkiftrapport();
  const [text, setText] = useState("");
  const [skickar, setSkickar] = useState(false);
  const [visaAtgardade, setVisaAtgardade] = useState(false);

  const farTaBortAllas = arRedaktor(role);

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
      await skapaPost({ text: text.trim(), skapadAv: currentUser.uid, skapadAvNamn: currentUser.email });
      setText("");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>🛠️ Skiftrapport</h1>
      <p className="sida__beskrivning">
        Praktisk drift-information mellan skift – t.ex. "vattenläcka i taket", "slut på
        sutur-set" eller "hiss 2 ur funktion". Poster äldre än 48 timmar döljs automatiskt.
      </p>
      <div className="skiftrapport-varning">
        ⚠️ Skriv aldrig patientnamn, personnummer eller annan patientinformation här. Denna sida
        är endast till för praktiska driftfrågor.
      </div>

      <form className="skiftrapport-formular" onSubmit={hanteraSubmit}>
        <textarea
          rows={3}
          required
          placeholder="Vad behöver nästa skift veta? (ej patientinformation)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="knapp" disabled={skickar}>
          {skickar ? "Skickar..." : "Lägg till"}
        </button>
      </form>

      {laddar && <p className="sida__beskrivning">Laddar...</p>}
      {!laddar && aktiva.length === 0 && (
        <div className="platshallare">
          <p>Inga aktiva skiftrapporter just nu.</p>
        </div>
      )}

      <ul className="skiftrapport-lista">
        {aktiva.map((post) => (
          <li key={post.id} className="skiftrapport-rad">
            <p>{post.text}</p>
            <div className="skiftrapport-rad__meta">
              <span>{post.skapadAvNamn}</span>
              <span>{formateraTid(post.skapad)}</span>
            </div>
            <div className="skiftrapport-rad__atgarder">
              <button
                className="knapp knapp--liten"
                onClick={() => markeraAtgardad(post.id, currentUser.uid)}
              >
                ✓ Åtgärdat
              </button>
              {(farTaBortAllas || post.skapadAv === currentUser.uid) && (
                <button
                  className="knapp knapp--farlig knapp--liten"
                  onClick={() => taBortPost(post.id, currentUser.uid)}
                >
                  Ta bort
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {atgardadeSenaste.length > 0 && (
        <>
          <button className="knapp--lank" onClick={() => setVisaAtgardade((v) => !v)}>
            {visaAtgardade ? "Dölj" : "Visa"} åtgärdade (senaste 48h)
          </button>
          {visaAtgardade && (
            <ul className="skiftrapport-lista skiftrapport-lista--atgardad">
              {atgardadeSenaste.map((post) => (
                <li key={post.id} className="skiftrapport-rad">
                  <p>{post.text}</p>
                  <div className="skiftrapport-rad__meta">
                    <span>{post.skapadAvNamn}</span>
                    <span>{formateraTid(post.skapad)}</span>
                    <span>✓ Åtgärdat</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
