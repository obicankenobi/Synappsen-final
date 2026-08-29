import { useOutletContext } from "react-router-dom";
import EpostNodstoppSektion from "../../components/leverantor/EpostNodstoppSektion";
import AtagandekalenderSektion from "../../components/leverantor/AtagandekalenderSektion";
import BeredskapSektion from "../../components/leverantor/BeredskapSektion";
import AterstallningSektion from "../../components/leverantor/AterstallningSektion";
import IncidentklockaSektion from "../../components/leverantor/IncidentklockaSektion";

// Etapp L1n/L1p: driftkonsolen. Nödstoppet (Etapp 53a) fanns redan; åtagandekalendern (L1o),
// beredskaps-/återställningskontrollerna (L1n) och incidentklockan (L1p punkt 3) är nya här.
// L1e (det generaliserade nödstoppsmönstret, en åtgärdstidslinje) är INTE byggt i denna omgång.
export default function LeverantorDrift() {
  const { organisationer, epostAvstangd, setEpostAvstangd, setFel, atagandekalender, atagandekalenderLaddar } =
    useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1>🚨 Drift & incident</h1>

      <EpostNodstoppSektion epostAvstangd={epostAvstangd} onAndrad={setEpostAvstangd} onFel={setFel} />

      <IncidentklockaSektion organisationer={organisationer} onFel={setFel} />

      <AtagandekalenderSektion atagandekalender={atagandekalender} laddar={atagandekalenderLaddar} onFel={setFel} />

      <BeredskapSektion organisationer={organisationer} onFel={setFel} />

      <AterstallningSektion organisationer={organisationer} onFel={setFel} />
    </div>
  );
}
