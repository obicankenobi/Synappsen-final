import { useOutletContext } from "react-router-dom";
import KvissbankSektion from "../../components/leverantor/KvissbankSektion";
import BaspaketreferenserSektion from "../../components/BaspaketreferenserSektion";

// Etapp L1a: kvissbanken och baspaketreferenserna är GENUINT kundlösa – globalt innehåll
// som delas av alla organisationer (se "Panelens upplägg" i intern/ETAPPLAN-INTERN-1.md).
// Ligger därför utanför både portfölj- och kundläget i tanken, även om den bor på en
// portföljrutt.
export default function LeverantorInnehall() {
  const { setFel } = useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1>📚 Innehåll</h1>
      <p className="sida__beskrivning">Globalt innehåll, delat av alla organisationer.</p>

      <KvissbankSektion onFel={setFel} />

      <BaspaketreferenserSektion />
    </div>
  );
}
