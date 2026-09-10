import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSkiftrapport } from "../hooks/useSkiftrapport";
import { useAllaGodkandaRutiner } from "../hooks/useAllaGodkandaRutiner";
import { arRedaktor } from "../firebase/roles";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import Skelett from "../components/Skelett";
import "./Skiftrapport.css";

// Etapp 66d: fast lista, ingen fritext (se firestore.rules arGiltigDriftstorningskategori) –
// undviker att kategori-fältet blir en ny PII-yta.
const KATEGORIER = {
  lokal: "Lokal/fastighet",
  it: "IT/teknik",
  medicinteknik: "Medicinteknik",
  forsorjning: "Försörjning/förråd",
  ovrigt: "Övrigt",
};

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

// Etapp 66d: kategori-/rutinlänkskontroller för EN post. Rent presentationell – hela
// tillståndet (vald kategori/rutin) kommer direkt från posten själv, ingen lokal draft-state,
// eftersom valet sparas omedelbart (samma "en diskret ändring, spara direkt"-princip som
// t.ex. rollväljaren i AnvandareRollerSektion.jsx redan använder för <select>).
function KategoriseraKontroller({ post, rutiner, kategoriseraPost, uid }) {
  const koppladRutin = rutiner.find((r) => r.id === post.rutinId);
  return (
    <div className="skiftrapport-rad__kategorisering">
      <label>
        Kategori
        <select
          value={post.kategori ?? ""}
          onChange={(e) => kategoriseraPost(post.id, { kategori: e.target.value || null }, uid)}
        >
          <option value="">Ingen</option>
          {Object.entries(KATEGORIER).map(([nyckel, namn]) => (
            <option key={nyckel} value={nyckel}>
              {namn}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rutin
        <select
          value={post.rutinId ?? ""}
          onChange={(e) => kategoriseraPost(post.id, { rutinId: e.target.value || null }, uid)}
        >
          <option value="">Ingen länkad rutin</option>
          {rutiner.map((r) => (
            <option key={r.id} value={r.id}>
              {r.titel}
            </option>
          ))}
        </select>
      </label>
      {koppladRutin && (
        <span className="skiftrapport-rad__rutinlank">
          → <Link to={`/${koppladRutin.omrade}`}>{koppladRutin.titel}</Link>
        </span>
      )}
    </div>
  );
}

export default function Skiftrapport() {
  const { currentUser, role, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const { visaMeddelande } = useDialog();
  const { aktiva, atgardadeSenaste, alla, laddar, skapaPost, markeraAtgardad, kategoriseraPost, taBortPost } =
    useSkiftrapport();
  const { rutiner: allaGodkandaRutiner } = useAllaGodkandaRutiner();
  const [text, setText] = useState("");
  const [skickar, setSkickar] = useState(false);
  const [visaAtgardade, setVisaAtgardade] = useState(false);
  const [visaHistorik, setVisaHistorik] = useState(false);
  const [historikKategori, setHistorikKategori] = useState("");

  const farTaBortAllas = arRedaktor(role);

  // Etapp 66d: hela historiken (ingen 48h-gräns), valfritt filtrerad på kategori – separat
  // från standardvyns aktiva/atgardadeSenaste, som är oförändrade.
  const historik = useMemo(
    () => alla.filter((p) => !historikKategori || p.kategori === historikKategori),
    [alla, historikKategori]
  );

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
      await skapaPost({ text: text.trim(), skapadAv: currentUser.uid, skapadAvNamn: mittNamn });
      setText("");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">🛠️</span> Skiftrapport</h1>
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

      {laddar && <Skelett />}
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
            <KategoriseraKontroller
              post={post}
              rutiner={allaGodkandaRutiner}
              kategoriseraPost={kategoriseraPost}
              uid={currentUser.uid}
            />
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
                    {post.kategori && <span>{KATEGORIER[post.kategori] ?? post.kategori}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <hr className="skiftrapport-avdelare" />

      <button type="button" className="knapp--lank" onClick={() => setVisaHistorik((v) => !v)}>
        {visaHistorik ? "Dölj" : "Visa"} hela historiken (även äldre än 48h)
      </button>

      {visaHistorik && (
        <div className="skiftrapport-historik">
          <label className="skiftrapport-historik__filter">
            Filtrera på kategori
            <select value={historikKategori} onChange={(e) => setHistorikKategori(e.target.value)}>
              <option value="">Alla kategorier</option>
              {Object.entries(KATEGORIER).map(([nyckel, namn]) => (
                <option key={nyckel} value={nyckel}>
                  {namn}
                </option>
              ))}
            </select>
          </label>
          {historik.length === 0 && <p>Inga poster matchar filtret.</p>}
          <ul className="skiftrapport-lista skiftrapport-lista--historik">
            {historik.map((post) => {
              const koppladRutin = allaGodkandaRutiner.find((r) => r.id === post.rutinId);
              return (
                <li key={post.id} className="skiftrapport-rad">
                  <p>{post.text}</p>
                  <div className="skiftrapport-rad__meta">
                    <span>{post.skapadAvNamn}</span>
                    <span>{formateraTid(post.skapad)}</span>
                    <span>{post.atgardad ? "✓ Åtgärdat" : "Öppen"}</span>
                    {post.kategori && <span>{KATEGORIER[post.kategori] ?? post.kategori}</span>}
                    {koppladRutin && (
                      <span>
                        → <Link to={`/${koppladRutin.omrade}`}>{koppladRutin.titel}</Link>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
