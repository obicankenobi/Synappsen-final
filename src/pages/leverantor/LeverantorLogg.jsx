import { useOutletContext } from "react-router-dom";
import AtgardsloggSektion from "../../components/leverantor/AtgardsloggSektion";

export default function LeverantorLogg() {
  const { organisationer, setFel } = useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1>📜 Åtgärdslogg</h1>
      <AtgardsloggSektion organisationer={organisationer} onFel={setFel} />
    </div>
  );
}
