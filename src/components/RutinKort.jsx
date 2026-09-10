import { useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { RUTIN_STATUS } from "../hooks/useRutiner";
import { useAuth } from "../hooks/useAuth";
import { kvitteraLastMedKo } from "../hooks/useLaskvittering";
import { borGranskas, arUtgangen, arArkiverad, andradSedanLasning } from "../utils/rutinHjalp";
import { formateraDatum } from "../utils/datum";
import { talText } from "../utils/talText";
import { useTalsyntes } from "../hooks/useTalsyntes";
import { useRutinDiffSedanLast } from "../hooks/useRutinDiffSedanLast";
import { ROLE_LABELS, ROLES } from "../firebase/roles";
import FavoritKnapp from "./FavoritKnapp";
import Kommentarer from "./Kommentarer";
import VersionsHistorik from "./VersionsHistorik";
import DiffVy from "./DiffVy";
import MarkdownInnehall from "./MarkdownInnehall";
import PrivatAnteckning from "./PrivatAnteckning";
import KvissModal from "./KvissModal";
import ForeslaAndringModal from "./ForeslaAndringModal";
import { StatusBadge } from "./Badge";
import { skapaForslag } from "../hooks/useAndringsforslag";
import "./RutinKort.css";

const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

function skrivUtRutin(rutinId) {
  document.querySelectorAll(".rutin-kort--utskrift").forEach((el) => el.classList.remove("rutin-kort--utskrift"));
  document.getElementById(`rutin-${rutinId}`)?.classList.add("rutin-kort--utskrift");
  document.body.classList.add("utskrift-lage");
  window.print();
  window.addEventListener(
    "afterprint",
    () => document.body.classList.remove("utskrift-lage"),
    { once: true }
  );
}

export default function RutinKort({
  rutin,
  allaRutiner = [],
  anvandare = [],
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
  onMarkeraGranskad,
  onArkivera,
  onAterstallVersion,
  onGranskaKalla,
  hamtaVersioner,
}) {
  const { currentUser, namn, organisationId, role } = useAuth();
  // Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.4/4.5): kiosk är ett DELAT
  // enhetskonto. Tre ytor nedan var öppna för den utan att vara det server-side, eller
  // utan att vara meningsfulla på ett delat konto – se respektive användningsställe.
  const arKiosk = role === ROLES.KIOSK;
  const mittNamn = namn || currentUser?.email;
  const { stods: talstods, laserUpp, vaxla } = useTalsyntes();
  // Etapp 72h: lättläst-läge – redaktörsstyrt (lattlastText skrivs i RutinFormular.jsx),
  // produkten bara växlar visningen. Knappen visas bara om en lättläst version faktiskt
  // finns – annars finns inget att växla till.
  const [visaLattlast, setVisaLattlast] = useState(false);
  const harLattlast = Boolean(rutin.lattlastText?.trim());
  const visatInnehall = visaLattlast && harLattlast ? rutin.lattlastText : rutin.innehall;
  const begrepp = rutin.begrepp ?? [];
  const [visaHistorik, setVisaHistorik] = useState(false);
  const [visaOlasta, setVisaOlasta] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [visaKviss, setVisaKviss] = useState(false);
  const [visaForeslaAndring, setVisaForeslaAndring] = useState(false);
  const [forvaldMarkeratStycke, setForvaldMarkeratStycke] = useState("");
  const [visaAndratDiff, setVisaAndratDiff] = useState(false);
  const arUtkast = rutin.status === RUTIN_STATUS.UTKAST;
  const flaggadForGranskning = farRedigera && borGranskas(rutin.granskadDatum);
  const utgangen = farRedigera && arUtgangen(rutin);
  const arkiverad = arArkiverad(rutin);
  const lasteAv = rutin.lasteAv ?? [];
  const jagHarLast = lasteAv.some((l) => l.uid === currentUser?.uid);
  const minKvitteringTidpunkt = lasteAv.find((l) => l.uid === currentUser?.uid)?.tidpunkt;
  const visaAndratBadge = jagHarLast && andradSedanLasning(rutin, minKvitteringTidpunkt);
  const { laddar: diffLaddar, fel: diffFel, rader: diffRader, hamtaDiff } = useRutinDiffSedanLast(rutin.id);
  const relaterade = (rutin.relateradeRutiner ?? [])
    .map((id) => allaRutiner.find((r) => r.id === id))
    .filter(Boolean);
  const oläste = anvandare.filter((a) => !lasteAv.some((l) => l.uid === a.id));

  async function hanteraVisaQr() {
    if (!qrUrl) {
      const lank = `${window.location.origin}${OMRADE_SOKVAG[rutin.omrade] ?? "/"}#rutin-${rutin.id}`;
      setQrUrl(await QRCode.toDataURL(lank));
    } else {
      setQrUrl(null);
    }
  }

  return (
    <article className="rutin-kort" id={`rutin-${rutin.id}`}>
      <header className="rutin-kort__header">
        <h3>{rutin.titel}</h3>
        <div className="rutin-kort__badgar">
          {arUtkast && <StatusBadge status="vantar" />}
          {visaAndratBadge && (
            <button
              type="button"
              className="rutin-kort__badge rutin-kort__badge--varning rutin-kort__badge--knapp"
              onClick={() => {
                const nastaVisning = !visaAndratDiff;
                setVisaAndratDiff(nastaVisning);
                if (nastaVisning && diffRader === null) {
                  hamtaDiff(minKvitteringTidpunkt, rutin.innehall);
                }
              }}
            >
              Uppdaterad sedan du läste den
            </button>
          )}
          {flaggadForGranskning && (
            <span className="rutin-kort__badge rutin-kort__badge--varning">Bör granskas</span>
          )}
          {utgangen && <span className="rutin-kort__badge rutin-kort__badge--varning">Utgången</span>}
          {arkiverad && (
            <span className="rutin-kort__badge" title="Gäller inte längre – arkiverad, utlöser inget kvitteringskrav">
              Arkiverad
            </span>
          )}
          {farRedigera && rutin.kallVarning && (
            <span className="rutin-kort__badge rutin-kort__badge--varning">Källan har uppdaterats</span>
          )}
          {/* Etapp 72, undantag 1 (ETAPPLAN19.md): AI-förordningen artikel 50 kräver att
              AI-genererat innehåll märks. Rutinen kan ha börjat som ett AI-tolkat utkast
              (tolkaDokument, functions/ai-import.js sätter kalla: "gemini") men sedan ha
              godkänts av en redaktör – fältet ska ändå synas här, det byter aldrig ursprung.
              Ordvalet "AI-tolkat" är medvetet (inte "AI-driven"/"smart"/"intelligent", se
              produkt/VARUMARKE.md s. 319). */}
          {rutin.kalla === "gemini" && (
            <span
              className="rutin-kort__badge"
              title="Innehållet extraherades ursprungligen ur ett foto eller PDF med AI-tolkning, och har därefter granskats och godkänts av en redaktör."
            >
              AI-tolkat ursprung
            </span>
          )}
          {/* Fynd 5 (granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md): rutin.kalla täckte
              bara rutinens EGEN text, inte AI-genererade kvissfrågor eller checklistesteg som
              föreslås separat (foreslaKvissfragor/foreslaChecklistSteg, RutinFormular.jsx) och
              annars sparades utan någon markör alls. Samma "byter aldrig ursprung"-princip som
              ovan. */}
          {rutin.kallaKviss === "gemini" && (
            <span
              className="rutin-kort__badge"
              title="Quizfrågorna föreslogs ursprungligen av AI utifrån rutinens innehåll, och har därefter granskats och godkänts av en redaktör."
            >
              AI-tolkad quiz
            </span>
          )}
          {rutin.kallaSteg === "gemini" && (
            <span
              className="rutin-kort__badge"
              title="Checklistestegen föreslogs ursprungligen av AI utifrån rutinens innehåll, och har därefter granskats och godkänts av en redaktör."
            >
              AI-tolkade steg
            </span>
          )}
        </div>
        <FavoritKnapp typ="rutin" id={rutin.id} />
      </header>

      {(rutin.godkandAvNamn || rutin.granskadAvNamn) && (
        <div className="rutin-kort__signatur">
          {rutin.godkandAvNamn && (
            <span>
              Godkänd av {rutin.godkandAvNamn}
              {rutin.godkandDatum && ` · ${formateraDatum(rutin.godkandDatum)}`}
            </span>
          )}
          {rutin.granskadAvNamn && (
            <span>
              Senast granskad av {rutin.granskadAvNamn}
              {rutin.granskadDatum && ` · ${formateraDatum(rutin.granskadDatum)}`}
            </span>
          )}
        </div>
      )}

      {rutin.agare && (
        <div className="rutin-kort__signatur">
          <span>
            Ansvarig:{" "}
            {rutin.agare.typ === "roll" ? ROLE_LABELS[rutin.agare.roll] ?? rutin.agare.roll : rutin.agare.namn}
          </span>
        </div>
      )}

      {/* Etapp 26c: frivillig, avstängningsbar synlighet – förslagsställaren kunde avmarkera
          "visa mitt namn" och vara anonym (se ForeslaAndringModal.jsx). Visas här i signaturen
          istället för i den tekniska versionshistoriken (VersionsHistorik.jsx), som är en
          separat mekanism för att kunna återställa gamla innehållsversioner, inte en logg över
          VARIFRÅN innehållet kom. */}
      {rutin.senastForslagAvNamn && rutin.senastForslagSynligt !== false && (
        <div className="rutin-kort__signatur">
          <span>Innehåller ett infört förslag från {rutin.senastForslagAvNamn}</span>
        </div>
      )}

      {visaAndratDiff && (
        <div className="rutin-kort__andrat-diff">
          {diffLaddar && <p>Hämtar vad som ändrats...</p>}
          {diffFel && <p className="rutin-kort__badge--varning">{diffFel}</p>}
          {diffRader?.length === 0 && <p>Inget innehåll har ändrats sedan din kvittering.</p>}
          {diffRader?.length > 0 && <DiffVy rader={diffRader} />}
        </div>
      )}

      {/* bildUrl är kvar för bakåtkompatibilitet med rutiner skapade innan bilagor (fas 5) */}
      {rutin.bildUrl && !rutin.bilagor?.length && (
        <img className="rutin-kort__bild" src={rutin.bildUrl} alt="" />
      )}
      {rutin.bilagor?.length > 0 && (
        <div className="rutin-kort__bilagor">
          {rutin.bilagor.map((b, i) =>
            b.typ === "dokument" ? (
              <a key={i} href={b.url} target="_blank" rel="noreferrer" className="rutin-kort__dokument">
                📎 {b.namn ?? "Bilaga"}
              </a>
            ) : (
              <img key={i} className="rutin-kort__bild" src={b.url} alt="" />
            )
          )}
        </div>
      )}
      {harLattlast && (
        <button
          type="button"
          className={`knapp knapp--sekundar knapp--liten rutin-kort__lattlast-vaxel${
            visaLattlast ? " rutin-kort__lattlast-vaxel--vald" : ""
          }`}
          onClick={() => setVisaLattlast((v) => !v)}
          aria-pressed={visaLattlast}
        >
          {visaLattlast ? "📖 Visa vanlig text" : "🔤 Lättläst"}
        </button>
      )}
      <MarkdownInnehall className="rutin-kort__innehall" text={visatInnehall} />

      {begrepp.length > 0 && (
        <div className="rutin-kort__begrepp">
          <strong>Begrepp:</strong>{" "}
          {begrepp.map((b, i) => (
            <details key={i} className="rutin-kort__begrepp-post">
              <summary title={b.forklaring}>{b.term}</summary>
              <span>{b.forklaring}</span>
            </details>
          ))}
        </div>
      )}

      {rutin.taggar?.length > 0 && (
        <div className="rutin-kort__taggar">
          {rutin.taggar.map((t) => (
            <span key={t} className="rutin-kort__tagg">
              {t}
            </span>
          ))}
        </div>
      )}

      {rutin.referenser && (
        <p className="rutin-kort__referenser">
          <strong>Referenser:</strong> {rutin.referenser}
        </p>
      )}

      {relaterade.length > 0 && (
        <div className="rutin-kort__relaterade">
          <strong>Se även:</strong>{" "}
          {relaterade.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <a href={`#rutin-${r.id}`}>{r.titel}</a>
            </span>
          ))}
        </div>
      )}

      {arkiverad ? (
        <p className="rutin-kort__signatur">Arkiverad – gäller inte längre, ingen kvittering krävs.</p>
      ) : (
        <div className="rutin-kort__laskvittering">
          {/* Fynd 4.6: firestore.rules kräver !arKiosk() för lasteAv, men knappen visades
              ändå. Eftersom kvitteringen går genom offlinekön lades en post som ALDRIG kan
              gå igenom – ett tyst datafel och en kö som växer på varje delad platta. Ingen
              säkerhetslucka (servern höll), men UI och regel ska säga samma sak. */}
          {arKiosk ? (
            <p className="rutin-kort__signatur">
              Läskvittering kräver ett personligt konto och kan inte göras från en delad enhet.
            </p>
          ) : (
          <button
            type="button"
            className="knapp knapp--sekundar knapp--liten"
            disabled={jagHarLast}
            onClick={() => {
              if ((rutin.kviss?.length ?? 0) > 0) {
                setVisaKviss(true);
              } else {
                kvitteraLastMedKo(rutin.id, currentUser.uid, mittNamn);
              }
            }}
          >
            {jagHarLast ? "✓ Du har läst detta" : "Jag har läst och förstått"}
          </button>
          )}
          {farRedigera && lasteAv.length > 0 && (
            <span
              className="rutin-kort__last-antal"
              title={lasteAv
                .map((l) => anvandare.find((a) => a.id === l.uid)?.namn ?? l.uid)
                .join(", ")}
            >
              {lasteAv.length} har kvitterat
            </span>
          )}
          {farRedigera && oläste.length > 0 && (
            <button type="button" className="knapp--lank" onClick={() => setVisaOlasta((v) => !v)}>
              {oläste.length} har inte kvitterat
            </button>
          )}
        </div>
      )}

      {visaKviss && (
        <KvissModal
          rutin={rutin}
          onKlar={() => {
            setVisaKviss(false);
            kvitteraLastMedKo(rutin.id, currentUser.uid, mittNamn);
          }}
          onAvbryt={() => setVisaKviss(false)}
        />
      )}

      {visaOlasta && (
        <ul className="rutin-kort__olasta-lista">
          {oläste.map((a) => (
            <li key={a.id}>{a.namn || a.email}</li>
          ))}
        </ul>
      )}

      {farRedigera && rutin.kallVarning && (
        <div className="rutin-kort__atgarder rutin-kort__atgarder--varning">
          <p>
            Källan <a href={rutin.kallVarningUrl} target="_blank" rel="noreferrer">{rutin.kallVarningUrl}</a> har
            uppdaterats sedan rutinen granskades.
          </p>
          <button className="knapp knapp--sekundar" onClick={() => onGranskaKalla(rutin.id)}>
            Granskad, ingen ändring behövs
          </button>
          <button className="knapp" onClick={() => onRedigera(rutin)}>
            Öppna för redigering
          </button>
        </div>
      )}

      {(farRedigera || farGodkanna) && (
        <div className="rutin-kort__atgarder">
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => onRedigera(rutin)}>
              Redigera
            </button>
          )}
          {farGodkanna && arUtkast && (
            <button className="knapp" onClick={() => onGodkann(rutin.id)}>
              Godkänn
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--farlig" onClick={() => onTaBort(rutin.id)}>
              Ta bort
            </button>
          )}
          {farRedigera && !arkiverad && (
            <button className="knapp knapp--sekundar" onClick={() => onMarkeraGranskad(rutin.id)}>
              Markera som granskad
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => onArkivera(rutin.id, arkiverad)}>
              {arkiverad ? "Återaktivera" : "Arkivera – gäller inte längre"}
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => setVisaHistorik(true)}>
              Visa historik
            </button>
          )}
        </div>
      )}

      <div className="rutin-kort__verktyg">
        {!arUtkast && (rutin.steg?.length ?? 0) > 0 && (
          <Link to={`/checklista/${rutin.id}`} className="knapp knapp--liten">
            ▶️ Kör checklista
          </Link>
        )}
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten rutin-kort__skriv-ut"
          onClick={() => skrivUtRutin(rutin.id)}
        >
          🖨️ Skriv ut / PDF
        </button>
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={hanteraVisaQr}>
          🔳 QR-kod
        </button>
        {talstods && (
          <button
            type="button"
            className="knapp knapp--sekundar knapp--liten"
            onClick={() => vaxla(talText(visatInnehall))}
          >
            {laserUpp ? "⏹️ Sluta lyssna" : "🔊 Lyssna"}
          </button>
        )}
        {!arUtkast && (
          <button
            type="button"
            className="knapp knapp--sekundar knapp--liten"
            onClick={() => {
              // Etapp 26a: fångar en eventuell textmarkering GJORD INNAN knapptrycket (t.ex.
              // markering direkt i MarkdownInnehall). Fungerar bara på enheter med riktig
              // textmarkering (desktop) – på mobil lämnas fältet tomt och kan fyllas i för
              // hand i modalen istället.
              const markering = window.getSelection?.().toString().trim();
              setForvaldMarkeratStycke(markering || "");
              setVisaForeslaAndring(true);
            }}
          >
            ✏️ Föreslå ändring
          </button>
        )}
      </div>

      {qrUrl && (
        <div className="rutin-kort__qr">
          <img src={qrUrl} alt="QR-kod som länkar till rutinen" width={160} height={160} />
          <p className="rutin-kort__qr-hjalptext">Skanna för att öppna rutinen direkt.</p>
        </div>
      )}

      {visaForeslaAndring && (
        <ForeslaAndringModal
          forvaldMarkeratStycke={forvaldMarkeratStycke}
          onAvbryt={() => setVisaForeslaAndring(false)}
          onSkicka={async ({ markeratStycke, forslag, motivering, visaNamnOffentligt }) => {
            await skapaForslag({
              organisationId,
              rutinId: rutin.id,
              rutinTitel: rutin.titel,
              omrade: rutin.omrade,
              markeratStycke,
              forslag,
              motivering,
              uid: currentUser.uid,
              namn: mittNamn,
              visaNamnOffentligt,
            });
            setVisaForeslaAndring(false);
          }}
        />
      )}

      {/* Fynd 4.4: "Bara du kan se det du skriver här" är ett falskt löfte på ett delat
          konto – nästa person vid plattan ser samma text. Regeln nekar numera också
          skrivningen (firestore.rules, anteckningar), det här hindrar bara att rutan
          ens erbjuds. */}
      {!arKiosk && <PrivatAnteckning rutinId={rutin.id} />}

      {/* Fynd 4.5: servern nekar redan en kioskkommentar (skapaKommentar), men
          formuläret visades ändå – och dess @-autokomplettering listar kollegors namn
          och e-postadresser fem i taget. På en obevakad foajéplatta är det en
          personalkatalog för vem som helst som går förbi. Kommentarerna VISAS
          fortfarande, det är bara skrivvägen som tas bort. */}
      <Kommentarer
        rutinId={rutin.id}
        farTaBortAlla={farRedigera}
        anvandare={arKiosk ? [] : anvandare}
        farSkriva={!arKiosk}
      />

      {visaHistorik && (
        <VersionsHistorik
          hamtaVersioner={() => hamtaVersioner(rutin.id)}
          nuvarandeInnehall={rutin.innehall}
          onAterstall={(v) => onAterstallVersion(v)}
          onStang={() => setVisaHistorik(false)}
        />
      )}
    </article>
  );
}
