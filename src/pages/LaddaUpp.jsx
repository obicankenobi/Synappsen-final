import { useEffect, useState } from "react";
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

const SESSION_KEY = "laddaUpp_kol";

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export default function LaddaUpp() {
  const { currentUser } = useAuth();
  const [omrade, setOmrade] = useState(OMRADEN[0].varde);
  const [forrad, setForrad] = useState(FORRAD[0]);

  // Restore any pending (uploaded but not yet interpreted) files from a previous session
  const [poster, setPoster] = useState(() => {
    try {
      const sparad = sessionStorage.getItem(SESSION_KEY);
      return sparad
        ? JSON.parse(sparad).map((p) => ({ ...p, resultat: null, felmeddelande: null }))
        : [];
    } catch {
      return [];
    }
  });

  // Keep sessionStorage in sync so the queue survives a page reload
  useEffect(() => {
    const pending = poster
      .filter((p) => p.storagePath && (p.status === STATUS.VANTAR || p.status === STATUS.TOLKAR))
      .map(({ id, namn, storagePath }) => ({ id, namn, storagePath, status: STATUS.VANTAR }));

    if (pending.length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(pending));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [poster]);

  function valjFiler(e) {
    const filer = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (filer.length === 0) return;

    // Varning (inte spärr) för stora filer – på mobilnät tar en 8 MB-bild märkbar tid att
    // ladda upp, och Gemini behöver inte full upplösning för att tolka text.
    const STOR_FIL_BYTE = 8 * 1024 * 1024;
    const stora = filer.filter((f) => f.size > STOR_FIL_BYTE);
    if (stora.length > 0) {
      const namn = stora.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ");
      if (!confirm(`${namn} är större än 8 MB och kan ta lång tid på mobilnät. Ladda upp ändå?`)) {
        return;
      }
    }

    // Assign each file a stable id before the async upload so we can update them by id
    const nyaPoster = filer.map((fil) => ({
      id: genId(),
      namn: fil.name,
      status: STATUS.LADDAR_UPP,
      storagePath: null,
      resultat: null,
      felmeddelande: null,
    }));

    setPoster((aktuella) => [...aktuella, ...nyaPoster]);

    // Upload immediately in the background — we only need the storage path going forward,
    // not the File object. This means the queue survives if Android reloads the page.
    filer.forEach(async (fil, i) => {
      const { id } = nyaPoster[i];
      try {
        const storagePath = await laddaUppInkommandeFoto(currentUser.uid, fil);
        setPoster((aktuella) =>
          aktuella.map((p) => (p.id === id ? { ...p, status: STATUS.VANTAR, storagePath } : p))
        );
      } catch (fel) {
        setPoster((aktuella) =>
          aktuella.map((p) =>
            p.id === id
              ? { ...p, status: STATUS.FEL, felmeddelande: fel.message ?? "Uppladdning misslyckades." }
              : p
          )
        );
      }
    });
  }

  function rensaFiler() {
    setPoster([]);
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function startaTolkning() {
    const vantar = poster.filter((p) => p.status === STATUS.VANTAR && p.storagePath);
    for (const post of vantar) {
      await behandlaPost(post);
    }
  }

  async function behandlaPost({ id, storagePath }) {
    setPoster((aktuella) =>
      aktuella.map((p) => (p.id === id ? { ...p, status: STATUS.TOLKAR } : p))
    );
    try {
      const { data } =
        omrade === "logistik"
          ? await tolkaForradsbild(storagePath, forrad)
          : await tolkaDokument(storagePath, omrade);

      setPoster((aktuella) =>
        aktuella.map((p) => (p.id === id ? { ...p, status: STATUS.KLAR, resultat: data } : p))
      );
    } catch (fel) {
      setPoster((aktuella) =>
        aktuella.map((p) =>
          p.id === id
            ? { ...p, status: STATUS.FEL, felmeddelande: fel.message ?? "Något gick fel." }
            : p
        )
      );
    }
  }

  const antalVantar = poster.filter((p) => p.status === STATUS.VANTAR).length;
  const laddararUpp = poster.some((p) => p.status === STATUS.LADDAR_UPP);

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

      <div className="ladda-upp__filval">
        {/* Transparent file input overlaid on the button so the user's tap hits
            the input directly — avoids programmatic .click() which some mobile
            browsers handle unreliably for hidden inputs */}
        <div className="ladda-upp__filknapp-wrapper">
          <button type="button" className="knapp knapp--sekundar" aria-hidden="true" tabIndex={-1}>
            Välj bilder från galleri
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={valjFiler}
            aria-label="Välj bilder från galleri"
            className="ladda-upp__filknapp-overlay"
          />
        </div>
        <div className="ladda-upp__filknapp-wrapper">
          <button type="button" className="knapp knapp--sekundar" aria-hidden="true" tabIndex={-1}>
            Ta foto
          </button>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={valjFiler}
            aria-label="Ta foto"
            className="ladda-upp__filknapp-overlay"
          />
        </div>
      </div>

      {poster.length > 0 && (
        <div className="ladda-upp__atgarder">
          <button
            className="knapp"
            onClick={startaTolkning}
            disabled={antalVantar === 0 || laddararUpp}
          >
            {laddararUpp ? "Laddar upp..." : `Tolka ${antalVantar} foto(n) med Gemini`}
          </button>
          <button className="knapp knapp--sekundar" onClick={rensaFiler}>
            Rensa
          </button>
        </div>
      )}

      <ul className="ladda-upp__lista">
        {poster.map((post) => (
          <li key={post.id} className="ladda-upp__rad">
            <span>{post.namn}</span>
            {post.status === STATUS.LADDAR_UPP && <span>Laddar upp...</span>}
            {post.status === STATUS.VANTAR && <span>Klar att tolka</span>}
            {post.status === STATUS.TOLKAR && <span>Tolkar med Gemini...</span>}
            {post.status === STATUS.KLAR && (
              <span className="ladda-upp__klar">
                Klar:{" "}
                {post.resultat?.antal !== undefined
                  ? `${post.resultat.antal} artikel(ar) hittade${
                      post.resultat.artiklar?.filter((a) => a.ersatte).length
                        ? ` (${post.resultat.artiklar.filter((a) => a.ersatte).length} ersatte befintliga)`
                        : ""
                    }`
                  : post.resultat?.titel}
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
