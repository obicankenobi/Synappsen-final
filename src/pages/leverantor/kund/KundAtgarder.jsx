import { useOutletContext } from "react-router-dom";
import KundAtgarderSektion from "../../../components/leverantor/KundAtgarderSektion";

export default function KundAtgarder() {
  const { org, ladda, setFel } = useOutletContext();
  return <KundAtgarderSektion org={org} onAndrad={ladda} onFel={setFel} />;
}
