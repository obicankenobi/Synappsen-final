import { useOutletContext } from "react-router-dom";
import EpostNodstoppSektion from "../../components/leverantor/EpostNodstoppSektion";
import AtagandekalenderSektion from "../../components/leverantor/AtagandekalenderSektion";
import BeredskapSektion from "../../components/leverantor/BeredskapSektion";
import AterstallningSektion from "../../components/leverantor/AterstallningSektion";
import IncidentklockaSektion from "../../components/leverantor/IncidentklockaSektion";
import AktivaSupportfonsterSektion from "../../components/leverantor/AktivaSupportfonsterSektion";
import NodstoppsoversiktSektion from "../../components/leverantor/NodstoppsoversiktSektion";

// Etapp L1n/L1p: driftkonsolen. Nödstoppet (Etapp 53a) fanns redan; åtagandekalendern (L1o),
// beredskaps-/återställningskontrollerna (L1n) och incidentklockan (L1p punkt 3) är nya här.
// Etapp L1f punkt 2: aktiva supportfönster, tidigare bara synliga en kund i taget i registret.
// Etapp L1e punkt 1+4: nödstoppsöversikten + åtgärdstidslinjen. Punkt 2 (generaliserat
// nodstopp/{funktion}-mönster) byggdes INTE, se NodstoppsoversiktSektion.jsx.
export default function LeverantorDrift() {
  const { organisationer, epostAvstangd, setEpostAvstangd, setFel, atagandekalender, atagandekalenderLaddar } =
    useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1>🚨 Drift & incident</h1>

      <EpostNodstoppSektion epostAvstangd={epostAvstangd} onAndrad={setEpostAvstangd} onFel={setFel} />

      <NodstoppsoversiktSektion epostAvstangd={epostAvstangd} onFel={setFel} />

      <AktivaSupportfonsterSektion organisationer={organisationer} onFel={setFel} />

      <IncidentklockaSektion organisationer={organisationer} onFel={setFel} />

      <AtagandekalenderSektion atagandekalender={atagandekalender} laddar={atagandekalenderLaddar} onFel={setFel} />

      <BeredskapSektion organisationer={organisationer} onFel={setFel} />

      <AterstallningSektion organisationer={organisationer} onFel={setFel} />
    </div>
  );
}
