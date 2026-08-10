import { useState } from "react";
import { verifieraKioskPin } from "../firebase/functions";
import "./KioskPinModal.css";

// Etapp 55b: enda vägen ut ur kioskläget. PIN:en verifieras alltid server-side
// (verifieraKioskPin, se functions/index.js) – klienten känner aldrig till rätt kod.
export default function KioskPinModal({ onLyckad, onAvbryt }) {
  const [pin, setPin] = useState("");
  const [fel, setFel] = useState(null);
  const [kontrollerar, setKontrollerar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel(null);
    setKontrollerar(true);
    try {
      const { data } = await verifieraKioskPin(pin);
      if (data?.giltig) {
        onLyckad();
        return;
      }
      setFel("Fel PIN-kod.");
    } catch {
      setFel("Kunde inte kontrollera PIN-koden just nu. Försök igen.");
    } finally {
      setKontrollerar(false);
      setPin("");
    }
  }

  return (
    <div className="kiosk-pin-overlag">
      <form className="kiosk-pin" onSubmit={hanteraSubmit}>
        <h3>Lämna kioskläge</h3>
        <p>Ange PIN-koden för att gå till den vanliga inloggningen.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-label="PIN-kod"
        />
        {fel && (
          <p className="kiosk-pin__fel" role="alert">
            {fel}
          </p>
        )}
        <div className="kiosk-pin__knappar">
          <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
            Avbryt
          </button>
          <button type="submit" className="knapp" disabled={kontrollerar || !pin}>
            Lås upp
          </button>
        </div>
      </form>
    </div>
  );
}
