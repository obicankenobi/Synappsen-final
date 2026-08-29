import { useState } from "react";
import { seedaAtagandekalender, sattAtagandeUtfort } from "../../firebase/functions";
import { arAtagandeForfallet } from "../../utils/leverantorSignaler";
import "./AtagandekalenderSektion.css";

// Etapp L1o (intern/ETAPPLAN-INTERN-1.md): fyra återkommande leverantörsskyldigheter,
// tidigare bara prosa i fyra olika dokument. "rto-matning" kvitteras ENDAST automatiskt av
// functions/scripts/rto-matning.cjs – ingen knapp för den här, av samma skäl som planen ger:
// ett åtagande vars datum bara kan sättas för hand är svagare, och ska märkas som sådant.
const AUTOMATISK_ID = "rto-matning";

export default function AtagandekalenderSektion({ atagandekalender, laddar, onFel }) {
  const [seedar, setSeedar] = useState(false);
  const [kvitterarId, setKvitterarId] = useState(null);

  async function hanteraSeed() {
    setSeedar(true);
    onFel?.(null);
    try {
      await seedaAtagandekalender();
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte skriva in åtagandena.");
    } finally {
      setSeedar(false);
    }
  }

  async function hanteraKvittera(id) {
    setKvitterarId(id);
    onFel?.(null);
    try {
      await sattAtagandeUtfort(id);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte kvittera åtagandet.");
    } finally {
      setKvitterarId(null);
    }
  }

  if (laddar) return null;

  return (
    <section className="admin-sektion atagandekalender">
      <h2>📅 Åtagandekalender</h2>
      <p className="sida__beskrivning">
        Återkommande skyldigheter – nyckelrotation, RTO-mätning och planöversyner. Ett förfallet
        åtagande syns även under "Kräver åtgärd" ovan.
      </p>
      {atagandekalender.length === 0 ? (
        <button type="button" className="knapp" disabled={seedar} onClick={hanteraSeed}>
          {seedar ? "Skriver in..." : "Skriv in åtagandena"}
        </button>
      ) : (
        <ul className="atagandekalender__lista">
          {atagandekalender.map((post) => {
            const forfallet = arAtagandeForfallet(post);
            return (
              <li
                key={post.id}
                className={forfallet ? "atagandekalender__rad atagandekalender__rad--forfallet" : "atagandekalender__rad"}
              >
                <div>
                  <span className="atagandekalender__vad">{post.vad}</span>
                  <span className="atagandekalender__meta">
                    {post.senastUtfort
                      ? `Senast utfört ${post.senastUtfort.slice(0, 10)} · intervall ${post.intervallManader} mån`
                      : `Aldrig registrerat · intervall ${post.intervallManader} mån`}
                    {post.kalla ? ` · källa: ${post.kalla}` : ""}
                  </span>
                </div>
                {post.id === AUTOMATISK_ID ? (
                  <span className="atagandekalender__automatisk">Sätts automatiskt av RTO-mätningen</span>
                ) : (
                  <button
                    type="button"
                    className="knapp knapp--liten"
                    disabled={kvitterarId === post.id}
                    onClick={() => hanteraKvittera(post.id)}
                  >
                    {kvitterarId === post.id ? "..." : "Markera utfört idag"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
