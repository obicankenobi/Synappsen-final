export default function BudgetSektion({ budget, nyttTak, setNyttTak, hanteraNyttTak }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>Budget för bildtolkning (Gemini)</h2></summary>
      {budget && (
        <p className="sida__beskrivning">
          Använt denna månad: <strong>{(budget.anvantOre / 100).toFixed(2)} kr</strong> av{" "}
          <strong>{(budget.taketOre / 100).toFixed(2)} kr</strong>.
          {budget.anvantOre >= budget.taketOre && (
            <span className="admin-budget__sparrad"> Taket är nått – tolkning är pausad.</span>
          )}
          <br />
          Varje enskild användare kan max använda 50 kr av detta per månad, så att ingen enskild
          person kan förbruka hela budgeten.
        </p>
      )}
      <form className="admin-budget__form" onSubmit={hanteraNyttTak}>
        <input
          type="number"
          min="0"
          step="10"
          placeholder="Nytt tak i kr"
          value={nyttTak}
          onChange={(e) => setNyttTak(e.target.value)}
        />
        <button type="submit" className="knapp">
          Uppdatera tak
        </button>
      </form>
    </details>
  );
}
