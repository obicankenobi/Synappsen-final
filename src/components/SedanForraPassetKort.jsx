import { Link } from "react-router-dom";
import { useSedanForraPasset } from "../hooks/useSedanForraPasset";
import "./SedanForraPassetKort.css";

// Etapp 25b: dynamiskt kort på startsidan – till skillnad från övriga STARTVY_BLOCK-kort
// (statisk titel/beskrivning/länk) visar det här antal poster och de tre viktigaste, så
// Hem.jsx särskiljer nyckeln "sedan-forra-passet" och renderar den här istället för den
// generiska SektionsKort.
export default function SedanForraPassetKort() {
  const { poster } = useSedanForraPasset();

  if (poster.length === 0) return null;

  return (
    <Link to="/sedan-forra-passet" className="sektionskort sedan-forra-passet-kort">
      <span className="sektionskort__ikon">🕑</span>
      <h3>Sedan ditt förra pass</h3>
      <p>{poster.length} {poster.length === 1 ? "sak" : "saker"} har hänt</p>
      <ul className="sedan-forra-passet-kort__lista">
        {poster.slice(0, 3).map((p) => (
          <li key={p.id}>{p.text}</li>
        ))}
      </ul>
    </Link>
  );
}
