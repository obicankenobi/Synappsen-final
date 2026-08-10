import { useState } from "react";
import { Link } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { laddaUppAvatar } from "../firebase/storage";
import { aktiveraPush, inaktiveraPush, pushStodsAvEnheten, arIos, korSomInstalleradApp } from "../firebase/messaging";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";
import { useDialog } from "../hooks/useDialog";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import TvaFaktorSektion from "../components/TvaFaktorSektion";
import TemaVaxlare from "../components/TemaVaxlare";
import AccentValjare from "../components/AccentValjare";
import { useSnabblankar, ALLA_SNABBLANKAR } from "../hooks/useSnabblankar";
import { ROLE_LABELS } from "../firebase/roles";
import "./Profil.css";

// Etapp 22a: eget litet formulär för visningsnamnet. Mountas av Profil.jsx FÖRST när
// namnLaddat är sant (se nedan) – då finns `aktuelltNamn` redan när komponenten skapas, så
// startvärdet kan sättas med en vanlig (lat) useState-initierare istället för en effekt som
// synkar in det asynkront, samma mönster som RutinFormular.jsx redan använder för
// initialaVarden.
function NamnFormular({ uid, aktuelltNamn }) {
  const { visaMeddelande } = useDialog();
  const [nyttNamn, setNyttNamn] = useState(aktuelltNamn);
  const [sparasNamn, setSparasNamn] = useState(false);
  const [sparat, setSparat] = useState(false);

  async function hanteraSparaNamn(e) {
    e.preventDefault();
    const kontroll = kontrolleraPatientuppgifter(nyttNamn);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    setSparasNamn(true);
    setSparat(false);
    try {
      await updateDoc(doc(db, "users", uid), { namn: nyttNamn.trim() });
      setSparat(true);
    } finally {
      setSparasNamn(false);
    }
  }

  return (
    <form className="profil-namn-formular" onSubmit={hanteraSparaNamn}>
      <label>
        Visningsnamn
        <input
          type="text"
          required
          value={nyttNamn}
          onChange={(e) => {
            setNyttNamn(e.target.value);
            setSparat(false);
          }}
        />
      </label>
      <p className="sida__beskrivning">
        Visas istället för din e-postadress vid kvitteringar och godkännanden.
      </p>
      <button type="submit" className="knapp knapp--liten" disabled={sparasNamn}>
        {sparasNamn ? "Sparar..." : "Spara namn"}
      </button>
      {sparat && <span className="profil-meddelande--ok"> ✓ Sparat</span>}
    </form>
  );
}

// Etapp 22e: valfri profilbild, samma "vänta tills det verkliga värdet finns"-mönster som
// NamnFormular ovan.
function ProfilbildFormular({ uid, aktuellBildUrl }) {
  const [bildUrl, setBildUrl] = useState(aktuellBildUrl);
  const [laddarUpp, setLaddarUpp] = useState(false);

  async function hanteraValjBild(e) {
    const fil = e.target.files?.[0];
    e.target.value = "";
    if (!fil) return;
    setLaddarUpp(true);
    try {
      const url = await laddaUppAvatar(uid, fil);
      await updateDoc(doc(db, "users", uid), { profilbildUrl: url });
      setBildUrl(url);
    } finally {
      setLaddarUpp(false);
    }
  }

  async function hanteraTaBort() {
    await updateDoc(doc(db, "users", uid), { profilbildUrl: null });
    setBildUrl(null);
  }

  return (
    <div className="profil-bild">
      {bildUrl ? (
        <img className="profil-bild__forhandsvisning" src={bildUrl} alt="" />
      ) : (
        <div className="profil-bild__platshallare" aria-hidden="true">
          👤
        </div>
      )}
      <div className="profil-bild__knappar">
        <label className="knapp knapp--liten knapp--sekundar">
          {laddarUpp ? "Laddar upp..." : bildUrl ? "Byt bild" : "Lägg till bild"}
          <input type="file" accept="image/*" onChange={hanteraValjBild} disabled={laddarUpp} />
        </label>
        {bildUrl && (
          <button type="button" className="knapp--lank" onClick={hanteraTaBort}>
            Ta bort bild
          </button>
        )}
      </div>
    </div>
  );
}

// Etapp 24c/24d: aktivering + per-notistyp-inställningar. Förvalt läge är återhållsamt
// (genomgående krav 10) – ingen ruta är förikryssad, och tillståndsdialogen triggas bara av
// att användaren själv trycker på "Aktivera"-knappen här, aldrig automatiskt vid inloggning.
const PUSH_TYPER = [
  { nyckel: "nyRutin", etikett: "Ny eller ändrad rutin", forAlla: true },
  { nyckel: "anslagsfrist", etikett: "Ett anslag väntar på kvittering", forAlla: true },
  { nyckel: "kallVarning", etikett: "Källvarning på en rutin jag äger", forAlla: true },
  { nyckel: "bristanmalan", etikett: "Ny bristanmälan i förrådet", forrad: true },
  { nyckel: "granskningsrunda", etikett: "En granskningsrunda har startat för en rutin jag äger", forAlla: true },
  { nyckel: "forslagPaminnelse", etikett: "Ett ändringsförslag har väntat över en vecka", forAlla: true },
];

function PushNotisSektion({ uid, role, pushTokens, pushInstallningar }) {
  const { visaMeddelande } = useDialog();
  const [arbetar, setArbetar] = useState(false);
  const aktiverad = (pushTokens?.length ?? 0) > 0;
  const stods = pushStodsAvEnheten();
  const behoverHemskarm = arIos() && !korSomInstalleradApp();

  async function hanteraAktivera() {
    setArbetar(true);
    try {
      const { status } = await aktiveraPush(uid);
      if (status === "nekad") {
        visaMeddelande("Du behöver tillåta notiser i webbläsaren för att kunna aktivera push.");
      } else if (status === "ej-konfigurerad" || status === "ej-stodd" || status === "fel") {
        visaMeddelande("Push-notiser kan inte aktiveras på den här enheten just nu.");
      }
    } finally {
      setArbetar(false);
    }
  }

  async function hanteraInaktivera() {
    setArbetar(true);
    try {
      await inaktiveraPush(uid);
    } finally {
      setArbetar(false);
    }
  }

  function vaxlaTyp(nyckel) {
    const nya = { ...pushInstallningar, [nyckel]: !pushInstallningar?.[nyckel] };
    updateDoc(doc(db, "users", uid), { pushInstallningar: nya });
  }

  return (
    <section className="profil-sektion">
      <h2>🔔 Push-notiser</h2>
      <p className="sida__beskrivning">
        Få en påminnelse på den här enheten även när appen inte är öppen. Innehåller aldrig
        kliniskt innehåll eller fritext – bara en generisk rad som "Det finns en ny rutin att
        läsa".
      </p>

      {behoverHemskarm && (
        <p className="profil-push__ios-guide">
          📱 På iPhone/iPad måste Synappsen först läggas till på hemskärmen för att push ska
          fungera: tryck på Dela-ikonen i Safari, välj "Lägg till på hemskärmen", och öppna
          appen därifrån istället för via webbläsaren.
        </p>
      )}

      {!stods && !behoverHemskarm && (
        <p className="sida__beskrivning">Push-notiser stöds inte av den här webbläsaren.</p>
      )}

      {stods && (
        <button
          type="button"
          className="knapp knapp--liten"
          onClick={aktiverad ? hanteraInaktivera : hanteraAktivera}
          disabled={arbetar}
        >
          {arbetar ? "Arbetar..." : aktiverad ? "Stäng av på den här enheten" : "Aktivera på den här enheten"}
        </button>
      )}

      {aktiverad && (
        <div className="profil-push__typer">
          {PUSH_TYPER.filter((t) => t.forAlla || (t.forrad && KAN_HANTERA_FORRAD.includes(role))).map((t) => (
            <label key={t.nyckel} className="profil-snabblankar__rad">
              <input
                type="checkbox"
                checked={Boolean(pushInstallningar?.[t.nyckel])}
                onChange={() => vaxlaTyp(t.nyckel)}
              />
              {t.etikett}
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

// Etapp 53c: motsatt förval av push-sektionen ovan, med avsikt – en tilldelad uppgift
// (mitt anslag väntar, mitt ändringsförslag har väntat en vecka) är inte brus, så
// e-postpåminnelser är förvalt PÅ. Ingen ruta att kryssa i, bara EN opt-out-kryssruta.
function EpostPaminnelseSektion({ uid, epostInstallningar }) {
  const avstangd = epostInstallningar?.paminnelser === false;

  function vaxla() {
    updateDoc(doc(db, "users", uid), {
      epostInstallningar: { ...epostInstallningar, paminnelser: avstangd },
    });
  }

  return (
    <section className="profil-sektion">
      <h2>✉️ E-postpåminnelser</h2>
      <p className="sida__beskrivning">
        Ett anslag som väntar på din kvittering, eller ett ändringsförslag som väntat över en
        vecka på ditt område – sammanslaget till högst ett mejl per dag, aldrig ett per
        händelse. Påslaget som förval, eftersom det handlar om uppgifter tilldelade just dig.
      </p>
      <label className="profil-snabblankar__rad">
        <input type="checkbox" checked={avstangd} onChange={vaxla} />
        Skicka INGA e-postpåminnelser till mig
      </label>
    </section>
  );
}

export default function Profil() {
  const { currentUser, role, namn, namnLaddat, profilbildUrl, pushTokens, pushInstallningar, epostInstallningar } =
    useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const { synliga: snabblankar, satValda: satSnabblankar } = useSnabblankar(currentUser.uid);

  function vaxlaSnabblank(nyckel) {
    const aktuella = snabblankar.map((s) => s.nyckel);
    const nya = aktuella.includes(nyckel) ? aktuella.filter((n) => n !== nyckel) : [...aktuella, nyckel];
    satSnabblankar(nya);
  }
  const [nuvarandeLosenord, setNuvarandeLosenord] = useState("");
  const [nyttLosenord, setNyttLosenord] = useState("");
  const [sparar, setSparar] = useState(false);
  const [meddelande, setMeddelande] = useState(null);

  async function hanteraByteAvLosenord(e) {
    e.preventDefault();
    setMeddelande(null);
    setSparar(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, nuvarandeLosenord);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, nyttLosenord);
      setMeddelande({ typ: "ok", text: "Lösenordet har uppdaterats." });
      setNuvarandeLosenord("");
      setNyttLosenord("");
    } catch {
      setMeddelande({
        typ: "fel",
        text: "Kunde inte byta lösenord. Kontrollera att nuvarande lösenord är rätt.",
      });
    } finally {
      setSparar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>👤 Min profil</h1>

      <section className="profil-sektion">
        <p>
          <strong>E-post:</strong> {currentUser.email}
        </p>
        <p>
          <strong>Roll:</strong> {ROLE_LABELS[role] ?? role}
        </p>
      </section>

      <section className="profil-sektion">
        <h2>👤 Namn och bild</h2>
        {namnLaddat ? (
          <>
            <ProfilbildFormular uid={currentUser.uid} aktuellBildUrl={profilbildUrl} />
            <NamnFormular uid={currentUser.uid} aktuelltNamn={namn ?? ""} />
          </>
        ) : (
          <p className="sida__beskrivning">Laddar...</p>
        )}
      </section>

      <section className="profil-sektion">
        <h2>Byt lösenord</h2>
        <form className="profil-losenord-formular" onSubmit={hanteraByteAvLosenord}>
          <label>
            Nuvarande lösenord
            <input
              type="password"
              required
              value={nuvarandeLosenord}
              onChange={(e) => setNuvarandeLosenord(e.target.value)}
            />
          </label>
          <label>
            Nytt lösenord
            <input
              type="password"
              required
              minLength={6}
              value={nyttLosenord}
              onChange={(e) => setNyttLosenord(e.target.value)}
            />
          </label>
          {meddelande && (
            <p className={meddelande.typ === "ok" ? "profil-meddelande--ok" : "profil-meddelande--fel"}>
              {meddelande.text}
            </p>
          )}
          <button type="submit" className="knapp" disabled={sparar}>
            {sparar ? "Sparar..." : "Byt lösenord"}
          </button>
        </form>
      </section>

      <TvaFaktorSektion currentUser={currentUser} />

      <PushNotisSektion
        uid={currentUser.uid}
        role={role}
        pushTokens={pushTokens}
        pushInstallningar={pushInstallningar}
      />

      <EpostPaminnelseSektion uid={currentUser.uid} epostInstallningar={epostInstallningar} />

      <section className="profil-sektion">
        <h2>🎨 Utseende</h2>
        <TemaVaxlare />
        <p className="profil-utseende__etikett">Accentfärg</p>
        <AccentValjare />
      </section>

      <section className="profil-sektion">
        <h2>🔗 Genvägar på startsidan</h2>
        <p className="sida__beskrivning">Välj vilka snabblänkar som visas överst på startsidan.</p>
        <div className="profil-snabblankar">
          {ALLA_SNABBLANKAR.map((s) => (
            <label key={s.nyckel} className="profil-snabblankar__rad">
              <input
                type="checkbox"
                checked={snabblankar.some((v) => v.nyckel === s.nyckel)}
                onChange={() => vaxlaSnabblank(s.nyckel)}
              />
              {s.ikon} {s.namn}
            </label>
          ))}
        </div>
      </section>

      <section className="profil-sektion">
        <h2>⭐ Mina favoriter</h2>
        {favoritPoster.length === 0 && (
          <p className="sida__beskrivning">
            Inga favoriter ännu – tryck på stjärnan ⭐ på en rutin eller en förrådsartikel för
            att spara den här.
          </p>
        )}
        <ul className="hem__lista">
          {favoritPoster.map((p, i) => (
            <li key={i}>
              <Link to={p.sokvag}>{p.titel}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
