import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { FEATURE } from "../config/features";
import { laddaUppInkommandeFoto } from "../firebase/storage";
import { tolkaDokument, tolkaForradsbild } from "../firebase/functions";
import { FORRAD } from "../firebase/forrad";
import { useDialog } from "../hooks/useDialog";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { BILDUPPLADDNING_PAMINNELSE } from "../utils/piiFilter";
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
  const { currentUser, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const { confirm, visaMeddelande } = useDialog();
  const { laddat: featuresLaddade, hasFeature } = useFeatures();
  const [omrade, setOmrade] = useState(OMRADEN[0].varde);
  const [forrad, setForrad] = useState(FORRAD[0]);

  // Etapp 10b (bulkimport): granska och godkänn/neka de nytolkade utkasten direkt i den här
  // kön, istället för att behöva navigera till varje områdes egen sida efteråt. Återanvänder
  // samma godkännande-hookar (och alltså samma behörighetskontroller) som Sektionssida/
  // ForradVy redan gör – ingen ny approval-logik, bara ett bekvämare ställe att köra den från
  // när man just importerat en hel bunt dokument på en gång.
  const { rutiner, godkannRutin, taBortRutin } = useRutiner(omrade);
  const { artiklar, godkannArtikel, taBortArtikel } = useForradsartiklar(forrad);
  const [hanterar, setHanterar] = useState(null);

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

  async function valjFilerFranLista(valdaFiler, e) {
    if (e) e.target.value = "";
    if (valdaFiler.length === 0) return;

    // Spärr för det storage.rules ändå nekar: inkommande/{uid} tillåter bara bilder under
    // 10 MB. Utan den här kontrollen laddade klienten upp hela filen först och visade sedan
    // ett rått "storage/unauthorized" i kön – användaren fick vänta ut en uppladdning som
    // aldrig kunde lyckas, utan att förstå varför.
    const MAX_FIL_BYTE = 10 * 1024 * 1024;
    const forStora = valdaFiler.filter((f) => f.size >= MAX_FIL_BYTE);
    const felTyp = valdaFiler.filter((f) => !f.type.startsWith("image/"));
    const filer = valdaFiler.filter((f) => f.size < MAX_FIL_BYTE && f.type.startsWith("image/"));
    if (forStora.length > 0 || felTyp.length > 0) {
      const rader = [
        ...forStora.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB) – max 10 MB per bild.`),
        ...felTyp.map((f) => `${f.name} är inte en bild och kan inte tolkas.`),
      ];
      await visaMeddelande(rader.join("\n"));
    }
    if (filer.length === 0) return;

    // Fynd 1 (granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md): den enda existerande
    // patientuppgifts-påminnelsen (kontrolleraPatientuppgifter) körde bara på formulärtext,
    // inte på bilder – och kontrollen för text kom dessutom EFTER överföringen till Vertex AI.
    // Den här visas INNAN laddaUppInkommandeFoto nedan, alltså innan bilden överhuvudtaget når
    // Storage (som i sig är en lagring), inte bara innan den skickas till Gemini.
    if (!(await confirm(BILDUPPLADDNING_PAMINNELSE))) return;

    // Varning (inte spärr) för stora filer – på mobilnät tar en 8 MB-bild märkbar tid att
    // ladda upp, och Gemini behöver inte full upplösning för att tolka text.
    const STOR_FIL_BYTE = 8 * 1024 * 1024;
    const stora = filer.filter((f) => f.size > STOR_FIL_BYTE);
    if (stora.length > 0) {
      const namn = stora.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ");
      if (!(await confirm(`${namn} är större än 8 MB och kan ta lång tid på mobilnät. Ladda upp ändå?`))) {
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

  function valjFiler(e) {
    return valjFilerFranLista(Array.from(e.target.files ?? []), e);
  }

  async function rensaFiler() {
    // "Rensa" kastar även bort redan uppladdade foton som ännu inte tolkats – de går inte att
    // få tillbaka från kön efteråt, så fråga först när det finns något otolkat kvar.
    const otolkade = poster.filter((p) => p.status === STATUS.VANTAR || p.status === STATUS.LADDAR_UPP);
    if (otolkade.length > 0 && !(await confirm(`Rensa listan? ${otolkade.length} foto(n) har inte tolkats än.`))) {
      return;
    }
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

  // --- Etapp 10b: granskningskö för de nytolkade utkasten ---

  function rutinStatus(rutinId) {
    return rutiner.find((r) => r.id === rutinId)?.status ?? null;
  }

  function artikelStatus(artikelId) {
    return artiklar.find((a) => a.id === artikelId)?.status ?? null;
  }

  // Alla fyra granskningsåtgärder skriver till Firestore. Ett misslyckande (nekad behörighet,
  // tappat nät) syntes tidigare inte alls – raden blev bara kvar som ogodkänd, och i
  // "Godkänn alla klara" avbröts hela loopen tyst mitt i. Returnerar true/false så loopen kan
  // stanna på ett medvetet sätt istället för att kastas ur.
  async function korGranskningsatgard(post, atgard) {
    setHanterar(post.id);
    try {
      await atgard();
      return true;
    } catch (fel) {
      await visaMeddelande(`${post.namn}: åtgärden misslyckades – ${fel?.message ?? "okänt fel"}`);
      return false;
    } finally {
      setHanterar(null);
    }
  }

  function godkannPostRutin(post) {
    return korGranskningsatgard(post, () => godkannRutin(post.resultat.rutinId, currentUser.uid, mittNamn));
  }

  function nekaPostRutin(post) {
    return korGranskningsatgard(post, () => taBortRutin(post.resultat.rutinId, currentUser.uid));
  }

  function godkannPostArtiklar(post) {
    return korGranskningsatgard(post, async () => {
      for (const a of post.resultat.artiklar) {
        await godkannArtikel(a.id);
      }
    });
  }

  function nekaPostArtiklar(post) {
    return korGranskningsatgard(post, async () => {
      for (const a of post.resultat.artiklar) {
        await taBortArtikel(a.id, currentUser.uid);
      }
    });
  }

  // Ett foto räknas som "obehandlat" tills alla poster det skapade är antingen godkända eller
  // borttagna – dvs. "Godkänn alla klara" hoppar automatiskt över sådant som redan hanterats.
  function postArObehandlad(post) {
    if (post.status !== STATUS.KLAR) return false;
    if (omrade === "logistik") {
      return (post.resultat?.artiklar ?? []).some(
        (a) => (artikelStatus(a.id) ?? ARTIKEL_STATUS.UTKAST) === ARTIKEL_STATUS.UTKAST
      );
    }
    return (rutinStatus(post.resultat?.rutinId) ?? RUTIN_STATUS.UTKAST) === RUTIN_STATUS.UTKAST;
  }

  const obehandladePoster = poster.filter(postArObehandlad);

  async function godkannAllaKlara() {
    for (const post of obehandladePoster) {
      const lyckades =
        omrade === "logistik" ? await godkannPostArtiklar(post) : await godkannPostRutin(post);
      if (!lyckades) return;
    }
  }

  async function valjMapp(e) {
    // webkitdirectory ger en FileList med samtliga filer i den valda mappen (inkl.
    // undermappar) – filtrerar bort allt som inte är en bild, samma sätt som vanliga
    // filval redan bara accepterar image/*.
    const alla = Array.from(e.target.files ?? []);
    const bilder = alla.filter((f) => f.type.startsWith("image/"));
    if (bilder.length === 0) return;
    await valjFilerFranLista(bilder, e);
  }

  if (featuresLaddade && !hasFeature(FEATURE.AI_IMPORT)) {
    return (
      <div className="sida">
        <h1><span aria-hidden="true">📷</span> Ladda upp dokument</h1>
        <div className="ladda-upp__kraver-modul">
          <p>AI-import kräver Intelligence-modulen, som inte är aktiverad för din organisation.</p>
          <p>Kontakta en superadmin om ni vill aktivera den.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sida">
      <h1><span aria-hidden="true">📷</span> Ladda upp dokument</h1>
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
        <div className="ladda-upp__filknapp-wrapper">
          <button type="button" className="knapp knapp--sekundar" aria-hidden="true" tabIndex={-1}>
            Ladda upp en hel mapp
          </button>
          <input
            type="file"
            accept="image/*"
            webkitdirectory=""
            onChange={valjMapp}
            aria-label="Ladda upp en hel mapp"
            className="ladda-upp__filknapp-overlay"
          />
        </div>
      </div>
      <p className="ladda-upp__mapp-hjalptext">
        "Ladda upp en hel mapp" är till för att importera många befintliga dokument på en
        gång (t.ex. en mapp med skannade rutiner) – fungerar i skrivbordsläget på Chrome/Edge.
      </p>

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

      {obehandladePoster.length > 1 && (
        <div className="ladda-upp__atgarder">
          <button className="knapp" onClick={godkannAllaKlara} disabled={hanterar !== null}>
            ✅ Godkänn alla {obehandladePoster.length} klara
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
              <>
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
                {postArObehandlad(post) ? (
                  <span className="ladda-upp__granska">
                    <button
                      type="button"
                      className="knapp knapp--liten"
                      disabled={hanterar === post.id}
                      onClick={() =>
                        omrade === "logistik" ? godkannPostArtiklar(post) : godkannPostRutin(post)
                      }
                    >
                      Godkänn
                    </button>
                    <button
                      type="button"
                      className="knapp knapp--farlig knapp--liten"
                      disabled={hanterar === post.id}
                      onClick={() =>
                        omrade === "logistik" ? nekaPostArtiklar(post) : nekaPostRutin(post)
                      }
                    >
                      Ta bort
                    </button>
                  </span>
                ) : (
                  <span className="ladda-upp__hanterad">✓ Hanterad</span>
                )}
              </>
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
