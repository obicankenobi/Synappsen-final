export default function ModulerSektion({ modulerLaddade, moduler, sparadModul, vaxlaModul }) {
  return (
    <section className="admin-sektion">
      <h2>🧩 Moduler</h2>
      <p className="sida__beskrivning">
        Slår av/på moduler för er organisation. Core (grundfunktionerna) är alltid
        tillgängligt. Att stänga av en modul döljer inte redan sparad data, bara
        funktionerna som kräver modulen (t.ex. AI-import kräver Intelligence).
      </p>
      <div className="admin-beroendetest">
        {!modulerLaddade && <p>Laddar...</p>}
        {modulerLaddade && (
          <ul className="admin-beroendetest__lista">
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={moduler.operations === true}
                  onChange={(e) => vaxlaModul("operations", e.target.checked)}
                />{" "}
                Operations
              </label>
              {sparadModul === "operations" && " ✓ Sparat"}
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={moduler.intelligence === true}
                  onChange={(e) => vaxlaModul("intelligence", e.target.checked)}
                />{" "}
                Intelligence (AI-import m.m.)
              </label>
              {sparadModul === "intelligence" && " ✓ Sparat"}
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
