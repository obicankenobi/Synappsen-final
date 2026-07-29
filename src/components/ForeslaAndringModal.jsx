import { useState } from "react";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import "./ForeslaAndringModal.css";

// Etapp 26a: "markera ett stycke → Föreslå ändring → skriv förslaget → skicka". Riktig
// textmarkering fångas via window.getSelection() precis INNAN knappen trycks (se
// RutinKort.jsx) – på mobil, där textmarkering är opraktiskt, kan fältet nedan fyllas i för
// hand istället. Ingen automatik: förslaget är bara råmaterial till redaktören (26d).
export default function ForeslaAndringModal({ forvaldMarkeratStycke, onSkicka, onAvbryt }) {
  const { visaMeddelande } = useDialog();
  const [markeratStycke, setMarkeratStycke] = useState(forvaldMarkeratStycke ?? "");
  const [forslag, setForslag] = useState("");
  const [motivering, setMotivering] = useState("");
  const [visaNamnOffentligt, setVisaNamnOffentligt] = useState(true);
  const [skickar, setSkickar] = useState(false);

  async function hanteraSkicka(e) {
    e.preventDefault();
    for (const text of [markeratStycke, forslag, motivering]) {
      const kontroll = kontrolleraPatientuppgifter(text);
      if (kontroll.blockerad) {
        if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
        return;
      }
    }
    setSkickar(true);
    try {
      await onSkicka({ markeratStycke: markeratStycke.trim(), forslag: forslag.trim(), motivering: motivering.trim(), visaNamnOffentligt });
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="foresla-andring-modal__bakgrund" role="dialog" aria-modal="true" aria-label="Föreslå ändring">
      <form className="foresla-andring-modal" onSubmit={hanteraSkicka}>
        <h3>✏️ Föreslå ändring</h3>
        <p className="sida__beskrivning">
          Ditt förslag skickas till redaktören för granskning – det publiceras aldrig
          automatiskt.
        </p>
        <label>
          Vilket stycke gäller det?
          <textarea
            rows={2}
            value={markeratStycke}
            onChange={(e) => setMarkeratStycke(e.target.value)}
            placeholder="Klistra in eller skriv den del av rutinen du vill ändra"
          />
        </label>
        <label>
          Ditt förslag
          <textarea
            rows={3}
            required
            value={forslag}
            onChange={(e) => setForslag(e.target.value)}
            placeholder="Vad ska stå istället?"
          />
        </label>
        <label>
          Motivering (frivilligt)
          <textarea
            rows={2}
            value={motivering}
            onChange={(e) => setMotivering(e.target.value)}
            placeholder="Varför behövs ändringen?"
          />
        </label>
        <label className="foresla-andring-modal__kryssruta">
          <input
            type="checkbox"
            checked={visaNamnOffentligt}
            onChange={(e) => setVisaNamnOffentligt(e.target.checked)}
          />
          Visa mitt namn för redaktören i rutinens historik (avmarkera för att vara anonym)
        </label>
        <div className="foresla-andring-modal__knappar">
          <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
            Avbryt
          </button>
          <button type="submit" className="knapp" disabled={skickar || !forslag.trim()}>
            {skickar ? "Skickar..." : "Skicka förslag"}
          </button>
        </div>
      </form>
    </div>
  );
}
