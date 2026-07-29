import { useState } from "react";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import "./ForslagSektion.css";

// Etapp 26b: en rad per öppet förslag – "Inför" öppnar rutinformuläret med förslaget
// förifyllt (se Sektionssida.jsx:s oppnaInforForslag), "Avvisa" kräver en kort motivering
// direkt i raden (samma inline-mönster som bristanmälan i ForradArtikelKort.jsx).
function ForslagRad({ f, onInfor, onAvvisa }) {
  const { visaMeddelande } = useDialog();
  const [visaAvvisa, setVisaAvvisa] = useState(false);
  const [motivering, setMotivering] = useState("");
  const [skickar, setSkickar] = useState(false);

  async function hanteraBekraftaAvvisning() {
    const kontroll = kontrolleraPatientuppgifter(motivering);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    if (!motivering.trim()) return;
    setSkickar(true);
    try {
      await onAvvisa(f, motivering.trim());
      setVisaAvvisa(false);
      setMotivering("");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <li className="forslag-sektion__rad">
      <div className="forslag-sektion__innehall">
        <p className="forslag-sektion__rutin">{f.rutinTitel}</p>
        {f.markeratStycke && (
          <p className="forslag-sektion__stycke">
            <strong>Gäller:</strong> {f.markeratStycke}
          </p>
        )}
        <p className="forslag-sektion__text">
          <strong>Förslag:</strong> {f.forslag}
        </p>
        {f.motivering && (
          <p className="forslag-sektion__text">
            <strong>Motivering:</strong> {f.motivering}
          </p>
        )}
        <p className="forslag-sektion__avsandare">
          Från {f.visaNamnOffentligt !== false ? f.foreslagenAvNamn || "okänd" : "en anonym kollega"}
        </p>
      </div>
      <div className="forslag-sektion__knappar">
        <button type="button" className="knapp knapp--liten" onClick={() => onInfor(f)}>
          Inför
        </button>
        <button
          type="button"
          className="knapp knapp--liten knapp--sekundar"
          onClick={() => setVisaAvvisa((v) => !v)}
        >
          Avvisa
        </button>
      </div>
      {visaAvvisa && (
        <div className="forslag-sektion__avvisa-formular">
          <textarea
            rows={2}
            placeholder="Kort motivering (visas för den som föreslog)"
            value={motivering}
            onChange={(e) => setMotivering(e.target.value)}
          />
          <button
            type="button"
            className="knapp knapp--liten knapp--farlig"
            disabled={skickar || !motivering.trim()}
            onClick={hanteraBekraftaAvvisning}
          >
            {skickar ? "Skickar..." : "Bekräfta avvisning"}
          </button>
        </div>
      )}
    </li>
  );
}

export default function ForslagSektion({ forslag, onInfor, onAvvisa }) {
  return (
    <section className="forslag-sektion">
      <h2>✏️ {forslag.length} förslag väntar på granskning</h2>
      <ul className="forslag-sektion__lista">
        {forslag.map((f) => (
          <ForslagRad key={f.id} f={f} onInfor={onInfor} onAvvisa={onAvvisa} />
        ))}
      </ul>
    </section>
  );
}
