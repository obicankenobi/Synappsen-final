import { useOutletContext } from "react-router-dom";
import KundHistorikSektion from "../../../components/leverantor/KundHistorikSektion";

export default function KundHistorik() {
  const { org, setFel } = useOutletContext();
  return <KundHistorikSektion orgId={org.orgId} onFel={setFel} />;
}
