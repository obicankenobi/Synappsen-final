import { useState } from "react";
import { nollstallDemoOrganisation } from "../../firebase/functions";

// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring).
export default function DemomiljoSektion({ onNollstallt, onFel }) {
  const [demoEpost, setDemoEpost] = useState("");
  const [demoNollstaller, setDemoNollstaller] = useState(false);
  const [demoInbjudanLank, setDemoInbjudanLank] = useState(null);
  const [demoMeddelande, setDemoMeddelande] = useState(null);

  async function hanteraNollstallDemo(e) {
    e.preventDefault();
    setDemoNollstaller(true);
    setDemoMeddelande(null);
    setDemoInbjudanLank(null);
    try {
      const { data } = await nollstallDemoOrganisation(demoEpost.trim() || undefined);
      if (data.inbjudanToken) {
        setDemoInbjudanLank(`${window.location.origin}/registrera?bjudan=${data.inbjudanToken}`);
        setDemoMeddelande("Demomiljön nollställd med nytt exempelinnehåll. Inbjudan skapad.");
      } else {
        setDemoMeddelande("Demomiljön nollställd med nytt exempelinnehåll.");
      }
      setDemoEpost("");
      await onNollstallt();
    } catch (e2) {
      onFel(e2);
    } finally {
      setDemoNollstaller(false);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>🎓 Demo- och övningsmiljö</h2>
      <p className="sida__beskrivning">
        En egen organisation ("_demo") med fiktivt exempelinnehåll – aldrig en riktig kund,
        aldrig i faktureringsunderlaget. Nollställs automatiskt varje natt 04:00. Fyll i en
        e-postadress för att direkt få en färsk superadmin-inbjudan till den personen (giltig i
        7 dagar) – annars nollställs bara innehållet.
      </p>
      <form className="leverantor__form" onSubmit={hanteraNollstallDemo}>
        <label>
          E-post för inbjudan (valfritt)
          <input
            type="email"
            value={demoEpost}
            onChange={(e) => setDemoEpost(e.target.value)}
            placeholder="prospekt@exempel.se"
          />
        </label>
        <button type="submit" className="knapp" disabled={demoNollstaller}>
          {demoNollstaller ? "..." : "Nollställ demomiljön nu"}
        </button>
      </form>
      {demoMeddelande && <p className="leverantor__info">{demoMeddelande}</p>}
      {demoInbjudanLank && (
        <div className="leverantor__info">
          <p>Inbjudan är skickad till e-postadressen. Reservlänk (giltig i 7 dagar):</p>
          <input type="text" readOnly value={demoInbjudanLank} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </section>
  );
}
