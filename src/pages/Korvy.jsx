import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRutin } from "../hooks/useRutiner";
import {
  lasFramsteg,
  sparaFramsteg,
  rensaFramsteg,
} from "../utils/checklistFramsteg";
import {
  registreraChecklistaPaborjad,
  registreraChecklistaSlutford,
  registreraChecklistaAvbruten,
} from "../hooks/useChecklistStatistik";
import "./Korvy.css";

// Enkel hörbar signal via Web Audio API – inget externt ljudfilsberoende. Körs bara på
// användarinitierad interaktion (steget visas efter en knapptryckning), så webbläsarens
// autoplay-spärr för ljud är inget problem.
function spelaSignal() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // Ljud är en förstärkning, inte ett krav – misslyckas tyst om Web Audio saknas/blockeras
  }
}

// Etapp 18c: kör en redan godkänd rutins steg ett i taget. Skapar inget nytt kliniskt
// innehåll – visar bara upp det som redan står i rutinen (se SAKERHETSRAPPORT.md).
export default function Korvy() {
  const { rutinId } = useParams();
  const { currentUser, organisationId } = useAuth();
  const { rutin, laddar } = useRutin(rutinId);

  // Lazy init (körs bara vid montering) istället för ett useEffect+setState – "fortsätt där
  // du var" är bara ett engångsläsning av lokalt sparad position, ingen extern prenumeration.
  const [index, setIndex] = useState(() =>
    currentUser?.uid ? (lasFramsteg(currentUser.uid, rutinId)?.stegIndex ?? 0) : 0
  );
  const [klart, setKlart] = useState(false);
  const paborjadRegistreradRef = useRef(false);
  const slutfordRef = useRef(false);

  const steg = rutin?.steg ?? [];
  const aktivtSteg = steg[index];

  // Startpunkt för hela körningen (för total tid) – lazy useState-init (körs bara vid
  // montering, som index ovan), inte i en effekt.
  const [startTid] = useState(() =>
    currentUser?.uid && rutinId ? (lasFramsteg(currentUser.uid, rutinId)?.startTid ?? Date.now()) : Date.now()
  );

  // Räknar upp sekunder på DET AKTUELLA steget, istället för att beräkna mot en tidsstämpel
  // (Date.now() får inte anropas under rendering) – nollställs i nastaSteg/foregaendeSteg,
  // inte i en effekt, eftersom det är en händelse (bytt steg) snarare än en prenumeration.
  const [sekunderPaSteg, setSekunderPaSteg] = useState(0);
  useEffect(() => {
    if (!aktivtSteg?.timerSekunder) return undefined;
    const intervall = setInterval(() => setSekunderPaSteg((s) => s + 1), 1000);
    return () => clearInterval(intervall);
  }, [aktivtSteg]);

  const kvarSekunder = aktivtSteg?.timerSekunder
    ? Math.max(0, aktivtSteg.timerSekunder - sekunderPaSteg)
    : null;

  useEffect(() => {
    if (kvarSekunder === 0) spelaSignal();
    // Bara när gränsen faktiskt passeras (false -> true), inte vid varje efterföljande
    // omrendering medan den redan är på 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kvarSekunder === 0]);

  useEffect(() => {
    if (!currentUser?.uid || !rutinId || paborjadRegistreradRef.current || !organisationId) return;
    paborjadRegistreradRef.current = true;
    registreraChecklistaPaborjad(rutinId, organisationId).catch(() => {});
  }, [currentUser?.uid, rutinId, organisationId]);

  useEffect(() => {
    if (!currentUser?.uid || !rutinId || klart) return;
    sparaFramsteg(currentUser.uid, rutinId, index, startTid);
  }, [currentUser?.uid, rutinId, index, klart, startTid]);

  // Registrerar ett bästa-försök-avbrott om användaren lämnar sidan innan checklistan är
  // slutförd (t.ex. stänger fliken eller navigerar bort). Ingen identitet lagras, bara
  // vilket steg det begav sig på.
  useEffect(() => {
    return () => {
      if (!slutfordRef.current && organisationId && rutinId) {
        registreraChecklistaAvbruten(rutinId, organisationId, index).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nastaSteg() {
    if (index < steg.length - 1) {
      setIndex((i) => i + 1);
      setSekunderPaSteg(0);
    } else {
      slutfordRef.current = true;
      const tidMs = Date.now() - startTid;
      if (organisationId) {
        registreraChecklistaSlutford(rutinId, organisationId, tidMs).catch(() => {});
      }
      if (currentUser?.uid) rensaFramsteg(currentUser.uid, rutinId);
      setKlart(true);
    }
  }

  function foregaendeSteg() {
    setIndex((i) => Math.max(0, i - 1));
    setSekunderPaSteg(0);
  }

  if (laddar) {
    return (
      <div className="korvy">
        <p>Laddar...</p>
      </div>
    );
  }

  if (!rutin || steg.length === 0) {
    return (
      <div className="korvy">
        <p>Den här rutinen har inga checklistesteg.</p>
        <Link to="/" className="korvy__knapp korvy__knapp--sekundar">
          ← Tillbaka
        </Link>
      </div>
    );
  }

  if (klart) {
    return (
      <div className="korvy">
        <h1>✅ Klar</h1>
        <p>Checklistan för "{rutin.titel}" är genomförd.</p>
        <Link to="/" className="korvy__knapp">
          Till startsidan
        </Link>
      </div>
    );
  }

  return (
    <div className="korvy">
      <header className="korvy__header">
        <Link to="/" className="korvy__stang" aria-label="Avsluta checklistan">
          ✕
        </Link>
        <div className="korvy__progress">
          Steg {index + 1} av {steg.length}
        </div>
      </header>
      <div className="korvy__progressbar">
        <div className="korvy__progressbar-fyllnad" style={{ width: `${((index + 1) / steg.length) * 100}%` }} />
      </div>

      <h1 className="korvy__titel">{rutin.titel}</h1>

      <div className="korvy__steg">
        <p className="korvy__stegtext">{aktivtSteg.text}</p>
        {aktivtSteg.varning && <p className="korvy__varning">⚠️ {aktivtSteg.varning}</p>}
        {kvarSekunder !== null && (
          <p className={kvarSekunder === 0 ? "korvy__timer korvy__timer--klar" : "korvy__timer"}>
            {kvarSekunder === 0 ? "Tiden är ute" : `⏱ ${kvarSekunder} s`}
          </p>
        )}
      </div>

      <div className="korvy__knappar">
        <button type="button" className="korvy__knapp korvy__knapp--sekundar" disabled={index === 0} onClick={foregaendeSteg}>
          ← Föregående
        </button>
        <button type="button" className="korvy__knapp" onClick={nastaSteg}>
          {index === steg.length - 1 ? "Klar ✓" : "Klart, nästa steg →"}
        </button>
      </div>
    </div>
  );
}
