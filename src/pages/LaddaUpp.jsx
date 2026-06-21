import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { laddaUppInkommandeFoto } from "../firebase/storage";
import { tolkaDokument, tolkaForradsbild } from "../firebase/functions";
import { FORRAD } from "../firebase/forrad";
import "./LaddaUpp.css";

const OMRADEN = [
  { varde: "kliniskt-stod", namn: "Kliniskt stöd" },
  { varde: "logistik", namn: "Logistik" },
  { varde: "administration", namn: "Administration" },
];

const STATUS = {
  VANTAR: "vantar",
  LADDAR_UPP: "laddar_upp",
  TOLKAR: "tolkar",
  KLAR: "klar",
  FEL: "fel",
};

export default function LaddaUpp() {
  const { currentUser } = useAuth();
  const [omrade, setOmrade] = useState(OMRADEN[0].varde);
  const [forrad, setForrad] = useState(FORRAD[0]);
  const [poster, setPoster] = useState([]);

  function valjFiler(e) {
    const filer = Array.from(e.target.files ?? []);
    setPoster(
      filer.map((fil) => ({ fil, status: STATUS.VANTAR, resultat: null, felmeddelande: null })
      )
    );
  }

  async function startaTolkning() {
    for (let i = 0; i < poster.length; i++) {
      await behandlaPost(i);
    }
  }

  async function behandlaPost(index) {
    setPoster((aktuella) =>
      aktuella.map((p, i) => (i === index ? { ...p, status: STATUS.LADDAR_UPP } : p))
    );
    try {
      const fil = poster[index].fil;
      const storagePath = await laddaUppInkommandeFoto(currentUser.uid, fil);

      setPoster((aktuella) =>
        aktuella.map((p, i) => (i === index ? { ...p, status: STATUS.TOLKAR } : p))
      );

      const { data } =
        omrade === "logistik"
          ? await tolkaForradsbild(storagePath, forrad)
          : await tolkaDokument(storagePath, omrade);

      setPoster((aktuella) =>
        aktuella.map((p, i) => (i === index ? { ...p, status: STATUS.KLAR, resultat: data } : p))
      );
    } catch (fel) {
      setPoster((aktuella) =>
        aktuella.map((p, i) =>
          i === index
            ? { ...p, status: STATUS.FEL, felmeddelande: fel.message ?? "Något gick fel." }
            : p
        )
      );
    }
  }

  return (
    <div className="sida">
      <h1>📷 Ladda upp dokument</h1>
      <p className="sida__beskrivning">
        Fota whiteboards, papper eller anteckningar. Gemini tolkar innehållet automatiskt och
        skapar ett utkast som granskas och godkänns innan det publiceras.
      </p>

      <label className="ladda-upp__omrade">
        Område
        <select value={omrade} onChange={(e) => setOmrade(e.target.value)}>
          {OMRADEN.map((o) => (
            <option key={o.varde} value={o.varde}>
              {o.namn}
            </option>
          ))}
        </select>
      </label>

      {omrade === "logistik" && (
        <label className="ladda-upp__omrade">
          Förråd
          <select value={forrad} onChange={(e) => setForrad(e.target.value)}>
            {FORRAD.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      )}

      <input type="file" accept="image/*" multiple capture="environment" onChange={valjFiler} />

      {poster.length > 0 && (
        <button className="knapp" onClick={startaTolkning}>
          Skicka {poster.length} foto(n) för tolkning
        </button>
      )}

      <ul className="ladda-upp__lista">
        {poster.map((post, i) => (
          <li key={i} className="ladda-upp__rad">
            <span>{post.fil.name}</span>
            {post.status === STATUS.VANTAR && <span>Väntar</span>}
            {post.status === STATUS.LADDAR_UPP && <span>Laddar upp...</span>}
            {post.status === STATUS.TOLKAR && <span>Tolkar med Gemini...</span>}
            {post.status === STATUS.KLAR && (
              <span className="ladda-upp__klar">
                Klar:{" "}
                {post.resultat.antal !== undefined
                  ? `${post.resultat.antal} artikel(ar) hittade`
                  : post.resultat.titel}
              </span>
            )}
            {post.status === STATUS.FEL && (
              <span className="ladda-upp__fel">{post.felmeddelande}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
