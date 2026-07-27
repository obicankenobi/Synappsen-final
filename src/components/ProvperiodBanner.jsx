import { useAuth } from "../hooks/useAuth";
import { useProvperiod } from "../hooks/useProvperiod";
import "./ProvperiodBanner.css";

// Etapp 15e: varnar 14/7/1 dag innan en organisations provperiod går ut och organisationen
// pausas automatiskt (kontrolleraProvperioderSchemalagt, functions/index.js). Bara en mjuk
// UI-påminnelse – syns för alla inloggade i organisationen, inte bara superadmin, eftersom
// det är leverantören (inte kunden själv) som förlänger provperioden.
export default function ProvperiodBanner() {
  const { currentUser } = useAuth();
  const { dagarKvar } = useProvperiod();

  if (!currentUser || dagarKvar === null || dagarKvar > 14) {
    return null;
  }

  const meddelande =
    dagarKvar <= 0
      ? "Er provperiod har gått ut. Organisationen pausas automatiskt inom kort."
      : dagarKvar === 1
        ? "Er provperiod går ut imorgon."
        : `Er provperiod går ut om ${dagarKvar} dagar.`;

  return (
    <div className="provperiod-banner" role="alert">
      {meddelande} Kontakta leverantören för att fortsätta använda Synappsen.
    </div>
  );
}
