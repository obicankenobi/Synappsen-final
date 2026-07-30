import { useEffect, useState } from "react";
import { useOfflineCenter } from "../hooks/useOfflineCenter";
import { useAuth } from "../hooks/useAuth";
import { lasKo } from "../utils/offlineKo";
import "./OfflineIndikator.css";

const INNEHALLSETIKETT = { rutiner: "Rutiner", kontakter: "Kontakter", forradsartiklar: "Förråd" };

// Etapp 29b: "ärlig status" – bygger vidare på den befintliga online/offline-bannern
// (istället för att bygga något nytt) med EXAKT vad som finns tillgängligt offline och hur
// gammalt det är, per innehållstyp. Utan det såg användaren bara "ingen anslutning" utan att
// veta om den sparade datan är från igår eller för tre veckor sedan.
function relativAlder(iso) {
  if (!iso) return null;
  const minuter = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minuter < 60) return "nyss";
  const timmar = Math.round(minuter / 60);
  if (timmar < 24) return `${timmar} tim sedan`;
  const dagar = Math.round(timmar / 24);
  return `${dagar} dygn sedan`;
}

export default function OfflineIndikator() {
  const [online, setOnline] = useState(navigator.onLine);
  const { currentUser } = useAuth();
  const { status } = useOfflineCenter();
  // Etapp 29c: antal köade åtgärder (läskvittering/bristanmälan) – läses direkt ur
  // localStorage (samma kö som useOfflineKo.js, monterad separat vid approten, faktiskt
  // skickar från), så räknaren håller sig korrekt utan en andra flush-instans här.
  const [antalIKo, setAntalIKo] = useState(0);

  useEffect(() => {
    function satOnline() {
      setOnline(true);
    }
    function satOffline() {
      setOnline(false);
    }
    window.addEventListener("online", satOnline);
    window.addEventListener("offline", satOffline);
    return () => {
      window.removeEventListener("online", satOnline);
      window.removeEventListener("offline", satOffline);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    function uppdatera() {
      setAntalIKo(lasKo(currentUser.uid).length);
    }
    uppdatera();
    // Kön kan ändras av useOfflineKo.js (annan komponentinstans) utan att DEN här
    // komponenten renderar om av sig själv – poll var 3:e sekund är enkelt och tillräckligt
    // exakt för en status-text, ingen anledning till en delad state-lösning för det.
    const intervall = setInterval(uppdatera, 3000);
    return () => clearInterval(intervall);
  }, [currentUser?.uid]);

  if (online && antalIKo === 0) return null;

  const tillgangligt = Object.entries(INNEHALLSETIKETT)
    .map(([typ, etikett]) => {
      const alder = relativAlder(status[typ]?.senast);
      return alder ? `${etikett} (${alder})` : null;
    })
    .filter(Boolean);

  return (
    <div className="offline-indikator" role="status">
      {!online && (
        <p className="offline-indikator__rubrik">
          📴 Ingen internetanslutning – visar sparad data, ändringar synkas när du är online igen.
        </p>
      )}
      {!online && tillgangligt.length > 0 && (
        <p className="offline-indikator__detalj">Tillgängligt offline: {tillgangligt.join(" · ")}</p>
      )}
      {antalIKo > 0 && (
        <p className="offline-indikator__detalj">
          ⏳ {antalIKo} {antalIKo === 1 ? "åtgärd" : "åtgärder"} väntar på att skickas
        </p>
      )}
    </div>
  );
}
