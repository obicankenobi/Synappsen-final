import { useOutletContext } from "react-router-dom";
import EkonomiOversiktSektion from "../../components/leverantor/EkonomiOversiktSektion";
import ManadsrapportSektion from "../../components/ManadsrapportSektion";

export default function LeverantorEkonomi() {
  const { organisationer } = useOutletContext();

  return (
    <div className="sida sida--bred">
      <h1><span aria-hidden="true">💰</span> Ekonomi</h1>

      <EkonomiOversiktSektion organisationer={organisationer} />

      <ManadsrapportSektion />
    </div>
  );
}
