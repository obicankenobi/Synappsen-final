// Etapp 55: superadmin sätter PIN-koden som en kiosk-enhet använder för att lämna
// kioskläget igen. PIN:en skickas hit precis en gång och lagras bara hashad server-side
// (satKioskPin, se functions/index.js) – den går inte att läsa tillbaka, bara ersätta.
import { useState } from "react";
import { satKioskPin } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";

export default function KioskPinSektion() {
  const { visaMeddelande } = useDialog();
  const [pin, setPin] = useState("");
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setSparar(true);
    try {
      await satKioskPin(pin);
      visaMeddelande("Kiosk-PIN-koden är sparad.");
      setPin("");
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte spara PIN-koden.");
    } finally {
      setSparar(false);
    }
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>🖥️ Kioskläge – PIN-kod</h2></summary>
      <p className="sida__beskrivning">
        PIN-koden krävs för att lämna kioskläget på en delad enhet (t.ex. en foajé-platta) och
        gå till den vanliga inloggningen. Skapa själva kiosk-kontot via "Bjud in kollega" ovan
        med rollen "Kioskläge (delad enhet)". PIN-koden delas separat med den som sköter
        enheten – den sparas bara hashad och går inte att läsa tillbaka här.
      </p>
      <form className="leverantor__form" onSubmit={hanteraSubmit}>
        <label>
          Ny PIN-kod (4–8 siffror)
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4,8}"
            required
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </label>
        <button type="submit" className="knapp" disabled={sparar || pin.length < 4}>
          {sparar ? "..." : "Spara PIN-kod"}
        </button>
      </form>
    </details>
  );
}
