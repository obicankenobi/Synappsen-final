// Etapp L1a: rutten finns (och är server-gatad som alla andra) så att panelens navigering
// och tester täcker den, men delmålet den ska visa – L1f, supportarbetsytan (begäran i
// appen, aktiva fönster, läslogg, ärendetråd) – är INTE byggt än. Se
// intern/ETAPPLAN-INTERN-1.md, beslutspunkt 4.
export default function LeverantorSupport() {
  return (
    <div className="sida sida--bred">
      <h1><span aria-hidden="true">🎧</span> Support</h1>
      <p className="sida__beskrivning">
        Supportarbetsytan (L1f) är inte byggd än. Tills vidare hanteras supportfönster i
        respektive organisations egna adminpanel.
      </p>
    </div>
  );
}
