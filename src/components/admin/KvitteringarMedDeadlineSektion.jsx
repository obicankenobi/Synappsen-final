export default function KvitteringarMedDeadlineSektion({ anslagMedFrist }) {
  return (
    <section className="admin-sektion">
      <h2>⏰ Kvitteringar med deadline</h2>
      <button
        className="knapp knapp--sekundar knapp--liten"
        onClick={() => {
          const rader = [
            "Anslag;Frist;Kvitterat;Totalt;Saknas",
            ...anslagMedFrist.map((a) =>
              [
                a.titel.replaceAll(";", ","),
                a.frist,
                a.antalKvitterat,
                a.antalTotalt,
                a.ejKvitterat.join(", ").replaceAll(";", ","),
              ].join(";")
            ),
          ];
          const blob = new Blob(["﻿" + rader.join("\n")], { type: "text/csv;charset=utf-8" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `kvitteringar-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(a.href);
        }}
      >
        Exportera som CSV
      </button>
      <ol className="admin-statistik-lista">
        {anslagMedFrist.map((a) => (
          <li key={a.id}>
            <strong>{a.titel}</strong> – kvittering senast {a.frist}:{" "}
            {a.antalKvitterat}/{a.antalTotalt} har kvitterat
            {a.passerad && a.ejKvitterat.length > 0 && (
              <span className="admin-frist-varning" title={a.ejKvitterat.join(", ")}>
                {" "}
                (frist passerad, {a.ejKvitterat.length} saknas)
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
