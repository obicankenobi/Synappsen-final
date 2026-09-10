import "./NyckeltalSektion.css";

// Etapp 67b (ETAPPLAN16.md): svarar på "hur ligger det till?" innan man börjar läsa listan
// rad för rad. All data kommer redan från listaOrganisationer – inget nytt hämtas här, se
// planens premisskontroll (fynd 4). Genomgående krav 29: demo-organisationen exkluderas
// explicit ur VARJE summa nedan, aldrig genom att lita på att den redan filtrerats bort
// tidigare i kedjan (den gjorde det inte – se fynd 5).
//
// "Delad sökkvot idag" var tidigare en egen sektion i Leverantor.jsx – flyttad hit enligt
// planens uttryckliga instruktion ("flyttas in hit istället för att dupliceras"), inte
// duplicerad.
export default function NyckeltalSektion({ organisationer, sokkvot, antalSignaler, aktivtFilter, onValjFilter }) {
  const riktiga = (organisationer ?? []).filter((o) => !o.arDemo);
  const idagIso = new Date().toISOString().slice(0, 10);

  const aktivaKunder = riktiga.filter((o) => o.status === "aktiv").length;
  const iProvperiod = riktiga.filter((o) => o.provperiodSlut && o.provperiodSlut >= idagIso).length;
  const totaltAnvandare = riktiga.reduce((s, o) => s + (o.antalAnvandare ?? 0), 0);

  const medPris = riktiga.filter((o) => o.avtaladArsavgiftKr != null);
  const summeratPrisKr = medPris.reduce((s, o) => s + o.avtaladArsavgiftKr, 0);
  const antalUtanPris = riktiga.length - medPris.length;

  function tryck(filter) {
    onValjFilter(aktivtFilter === filter ? null : filter);
  }

  return (
    <section className="admin-sektion nyckeltal">
      <h2><span aria-hidden="true">📊</span> Överblick</h2>
      <div className="nyckeltal__rad">
        <button
          type="button"
          className={`nyckeltal__ruta${aktivtFilter === "aktiva" ? " nyckeltal__ruta--vald" : ""}`}
          onClick={() => tryck("aktiva")}
        >
          <span className="nyckeltal__varde">{aktivaKunder}</span>
          <span className="nyckeltal__etikett">Aktiva kunder</span>
        </button>
        <button
          type="button"
          className={`nyckeltal__ruta${aktivtFilter === "provperiod" ? " nyckeltal__ruta--vald" : ""}`}
          onClick={() => tryck("provperiod")}
        >
          <span className="nyckeltal__varde">{iProvperiod}</span>
          <span className="nyckeltal__etikett">Varav i provperiod</span>
        </button>
        <div className="nyckeltal__ruta nyckeltal__ruta--statisk">
          <span className="nyckeltal__varde">{totaltAnvandare}</span>
          <span className="nyckeltal__etikett">Användare totalt</span>
        </div>
        <div className="nyckeltal__ruta nyckeltal__ruta--statisk">
          <span className="nyckeltal__varde">{summeratPrisKr.toLocaleString("sv-SE")} kr/år</span>
          <span className="nyckeltal__etikett">
            Summerat avtalat pris
            {antalUtanPris > 0 && (
              <>
                {" "}
                <span className="nyckeltal__fotnot">
                  ({antalUtanPris} kund{antalUtanPris === 1 ? "" : "er"} utan ifyllt pris, ingår inte)
                </span>
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          className={`nyckeltal__ruta${aktivtFilter === "atgard" ? " nyckeltal__ruta--vald" : ""}${antalSignaler > 0 ? " nyckeltal__ruta--varning" : ""}`}
          onClick={() => tryck("atgard")}
        >
          <span className="nyckeltal__varde">{antalSignaler}</span>
          <span className="nyckeltal__etikett">Kräver åtgärd</span>
        </button>
      </div>

      {sokkvot && (
        <p className={sokkvot.totalAntal >= sokkvot.tak * 0.8 ? "leverantor__varning" : "sida__beskrivning"}>
          🔍 Delad sökkvot idag: {sokkvot.totalAntal} / {sokkvot.tak} sökningar (Custom Search,
          delas av ALLA organisationer).{" "}
          {sokkvot.totalAntal >= sokkvot.tak * 0.8 &&
            "⚠️ Nära dagstaket – klinikstöd kan sluta fungera för alla kunder om taket nås."}
        </p>
      )}
    </section>
  );
}
