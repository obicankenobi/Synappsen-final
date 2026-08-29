import { useOutletContext } from "react-router-dom";
import { beraknaEkonomiOversikt } from "../../../utils/leverantorEkonomi";
import AvtalOchAtagandeSektion from "../../../components/leverantor/AvtalOchAtagandeSektion";

// Etapp L1b, block 3 "Avtal & ekonomi". Återanvänder L1i:s ekonomiberäkning (samma ren
// funktion, bara filtrerad till en organisation) och L1p:s AvtalOchAtagandeSektion – ingen
// ny beräkning, ingen andra sanning (krav 39).
export default function KundEkonomi() {
  const { org, setFel } = useOutletContext();
  const { perKund } = beraknaEkonomiOversikt([org]);
  const ekonomi = perKund[0];

  return (
    <div>
      <section className="admin-sektion">
        <h2>Avtal & ekonomi</h2>
        <dl className="kund-lista">
          <div>
            <dt>Avtalad årsavgift</dt>
            <dd>{ekonomi.arsavgiftKr !== null ? `${ekonomi.arsavgiftKr.toLocaleString("sv-SE")} kr/år` : "Ej ifyllt"}</dd>
          </div>
          <div>
            <dt>Senaste månadens AI-kostnad</dt>
            <dd>{ekonomi.senasteKostnadKr.toLocaleString("sv-SE")} kr</dd>
          </div>
          <div>
            <dt>Marginal/mån</dt>
            <dd className={ekonomi.marginalKr !== null && ekonomi.marginalKr < 0 ? "leverantor__fel" : ""}>
              {ekonomi.marginalKr !== null ? `${Math.round(ekonomi.marginalKr).toLocaleString("sv-SE")} kr` : "Okänd (inget pris satt)"}
            </dd>
          </div>
          <div>
            <dt>Kostnadstrend</dt>
            <dd>{ekonomi.trend ?? "Okänd"}</dd>
          </div>
        </dl>
      </section>

      <AvtalOchAtagandeSektion org={org} onFel={setFel} />
    </div>
  );
}
