import { useOutletContext } from "react-router-dom";
import AtgardsloggSektion from "../../components/leverantor/AtgardsloggSektion";
import LeverantorsfeedbackSektion from "../../components/leverantor/LeverantorsfeedbackSektion";

export default function LeverantorLogg() {
  const { organisationer, setFel } = useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1><span aria-hidden="true">📜</span> Åtgärdslogg</h1>
      <LeverantorsfeedbackSektion organisationer={organisationer} onFel={setFel} />
      <AtgardsloggSektion organisationer={organisationer} onFel={setFel} />
    </div>
  );
}
