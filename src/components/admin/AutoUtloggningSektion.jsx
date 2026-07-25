export default function AutoUtloggningSektion({
  utloggningMinuter,
  nyaUtloggningMinuter,
  setNyaUtloggningMinuter,
  hanteraNyUtloggningstid,
}) {
  return (
    <section className="admin-sektion">
      <h2>Auto-utloggningstid</h2>
      <p className="sida__beskrivning">
        Nuvarande: <strong>{utloggningMinuter} minuter</strong> inaktivitet innan automatisk utloggning.
      </p>
      <form className="admin-budget__form" onSubmit={hanteraNyUtloggningstid}>
        <input
          type="number"
          min="2"
          step="1"
          placeholder="Nya minuter"
          value={nyaUtloggningMinuter}
          onChange={(e) => setNyaUtloggningMinuter(e.target.value)}
        />
        <button type="submit" className="knapp">
          Uppdatera
        </button>
      </form>
    </section>
  );
}
