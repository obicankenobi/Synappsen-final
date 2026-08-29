import { Link, useOutletContext } from "react-router-dom";

// Etapp L1a: gemensam platshållare för kundlägets fem flikar. Kunddossién (L1b) ersätter
// den här filen flik för flik. Länken tillbaka till kundregistret pekar på raden i den
// befintliga listan, som fortfarande är den fungerande vägen till per-kund-åtgärder.
export default function KundStub() {
  const { org } = useOutletContext();
  return (
    <div>
      <p className="sida__beskrivning">
        Kunddossién (L1b) är inte byggd än. Åtgärder för {org.namn} finns tills vidare i{" "}
        <Link to={`/leverantor/kunder#org-${org.orgId}`}>kundregistret</Link>.
      </p>
    </div>
  );
}
