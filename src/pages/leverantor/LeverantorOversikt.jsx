import { useNavigate, useOutletContext } from "react-router-dom";
import NyckeltalSektion from "../../components/leverantor/NyckeltalSektion";
import KraverAtgardSektion from "../../components/leverantor/KraverAtgardSektion";

// Etapp L1a: "Översikt" är en triageyta, inte en instrumentbräda (se "Panelens upplägg",
// intern/ETAPPLAN-INTERN-1.md). Nyckeltalens snabbfilter navigerar nu till Kundregistret
// (en annan rutt) i stället för att sätta ett lokalt URL-tillstånd, eftersom listan flyttat
// dit i L1a:s uppdelning.
export default function LeverantorOversikt() {
  const { organisationer, sokkvot, signaler } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="sida sida--bred">
      <h1><span aria-hidden="true">📊</span> Översikt</h1>
      <p className="sida__beskrivning">Vad som kräver din uppmärksamhet, och det övergripande läget just nu.</p>

      <NyckeltalSektion
        organisationer={organisationer}
        sokkvot={sokkvot}
        antalSignaler={signaler.length}
        aktivtFilter={null}
        onValjFilter={(v) => navigate(v ? `/leverantor/kunder?snabb=${v}` : "/leverantor/kunder")}
      />

      <KraverAtgardSektion signaler={signaler} />
    </div>
  );
}
