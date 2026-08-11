import { useState } from "react";
import { useBaspaketreferenser } from "../hooks/useBaspaketreferenser";
import { domanGodkand, GODKANDA_KALLDOMANER } from "../config/kalldomaner";
import { useDialog } from "../hooks/useDialog";

// Etapp 64 (ETAPPLAN13.md), scaffolding-fasen. Syns ENDAST i leverantörsvyn (plattformsadmin),
// aldrig för en kundorganisation – se firestore.rules för den faktiska spärren, det här är
// bara gränssnittet ovanpå den. Ingen kund kan nå eller ens veta att den här sektionen finns.
// Fälten är MEDVETET begränsade till referensmetadata (titel/utgivare/källdatum/url/kategori)
// – inget innehållsfält, se ETAPPLAN13.md 64a/64c och genomgående krav 26. Tänkt att fyllas
// med FIKTIVA exempelposter under den juridiska granskningen, aldrig ett riktigt namngivet
// instrument, tills den bedömningen finns (se OPPNA-PUNKTER.md).
const TOM_FORM = { titel: "", utgivare: "", kalldatum: "", url: "", kategori: "" };

export default function BaspaketreferenserSektion() {
  const { referenser, laddar, fel, laggTillReferens, uppdateraReferens, taBortReferens } = useBaspaketreferenser();
  const { confirm } = useDialog();
  const [form, setForm] = useState(TOM_FORM);
  const [redigerarId, setRedigerarId] = useState(null);
  const [sparar, setSparar] = useState(false);
  const [formFel, setFormFel] = useState(null);

  function oppnaRedigering(ref) {
    setRedigerarId(ref.id);
    setForm({ titel: ref.titel, utgivare: ref.utgivare, kalldatum: ref.kalldatum ?? "", url: ref.url, kategori: ref.kategori ?? "" });
  }

  function avbrytRedigering() {
    setRedigerarId(null);
    setForm(TOM_FORM);
    setFormFel(null);
  }

  async function hanteraSpara(e) {
    e.preventDefault();
    setFormFel(null);
    if (!domanGodkand(form.url)) {
      setFormFel(`Bara länkar till godkända källdomäner accepteras: ${GODKANDA_KALLDOMANER.join(", ")}.`);
      return;
    }
    setSparar(true);
    try {
      if (redigerarId) {
        await uppdateraReferens(redigerarId, form);
      } else {
        await laggTillReferens(form);
      }
      avbrytRedigering();
    } catch (err) {
      setFormFel(err.message);
    } finally {
      setSparar(false);
    }
  }

  async function hanteraTaBort(id) {
    if (!(await confirm("Ta bort den här referensposten?"))) return;
    await taBortReferens(id);
  }

  return (
    <section className="admin-sektion">
      <h2>📚 Baspaket – nationella referenser (Etapp 64, under juridisk granskning)</h2>
      <p className="leverantor__varning">
        ⚠️ Inte byggd färdig och INTE synlig eller aktiverbar för någon kund. Det här är
        scaffolding under den externa juridiska bedömningen (MDR + upphovsrätt) – fyll bara i
        fiktiva exempelposter här, aldrig ett riktigt namngivet instrument, tills bedömningen
        finns (se <code>OPPNA-PUNKTER.md</code> och <code>ETAPPLAN13.md</code>).
      </p>
      {fel && <p className="leverantor__fel">{fel.message}</p>}

      <form className="leverantor__form" onSubmit={hanteraSpara}>
        <label>
          Titel
          <input
            type="text"
            required
            value={form.titel}
            onChange={(e) => setForm((f) => ({ ...f, titel: e.target.value }))}
          />
        </label>
        <label>
          Utgivare
          <input
            type="text"
            required
            value={form.utgivare}
            onChange={(e) => setForm((f) => ({ ...f, utgivare: e.target.value }))}
          />
        </label>
        <label>
          Källdatum (valfritt)
          <input
            type="date"
            value={form.kalldatum}
            onChange={(e) => setForm((f) => ({ ...f, kalldatum: e.target.value }))}
          />
        </label>
        <label>
          Länk (bara godkända källdomäner: {GODKANDA_KALLDOMANER.join(", ")})
          <input
            type="url"
            required
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        </label>
        <label>
          Kategori (valfritt, t.ex. "bedömningsinstrument")
          <input
            type="text"
            value={form.kategori}
            onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
          />
        </label>
        <button type="submit" className="knapp" disabled={sparar}>
          {sparar ? "Sparar..." : redigerarId ? "Spara ändring" : "Lägg till referens"}
        </button>
        {redigerarId && (
          <button type="button" className="knapp knapp--sekundar" onClick={avbrytRedigering}>
            Avbryt
          </button>
        )}
        {formFel && <p className="leverantor__fel">{formFel}</p>}
      </form>

      {laddar ? (
        <p>Laddar...</p>
      ) : (
        <ul className="admin-lista">
          {referenser.length === 0 && <li>Inga referensposter ännu.</li>}
          {referenser.map((ref) => (
            <li key={ref.id} className="admin-lista__rad leverantor__rad">
              <div>
                <strong>{ref.titel}</strong> · {ref.utgivare}
                {ref.kategori && ` · ${ref.kategori}`}
                {ref.kalldatum && ` · ${ref.kalldatum}`}
                <div className="admin-lista__email">
                  <a href={ref.url} target="_blank" rel="noreferrer">
                    {ref.url}
                  </a>
                </div>
              </div>
              <div className="admin-lista__atgarder">
                <button type="button" className="knapp knapp--liten" onClick={() => oppnaRedigering(ref)}>
                  Redigera
                </button>
                <button type="button" className="knapp knapp--liten" onClick={() => hanteraTaBort(ref.id)}>
                  Ta bort
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
