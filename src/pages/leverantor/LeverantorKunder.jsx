import { useMemo } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import SkapaOrganisationSektion from "../../components/leverantor/SkapaOrganisationSektion";
import SeedaStartbibliotekSektion from "../../components/leverantor/SeedaStartbibliotekSektion";
import DemomiljoSektion from "../../components/leverantor/DemomiljoSektion";
import HuvudmanSektion from "../../components/leverantor/HuvudmanSektion";
import OrganisationsListaSektion from "../../components/leverantor/OrganisationsListaSektion";
import PipelineSektion from "../../components/leverantor/PipelineSektion";
import { filtreraOchSorteraOrganisationer, SORT_FALT } from "../../utils/leverantorFilter";

// Etapp L1a: kundregistret, flyttat oförändrat hit från den forna Leverantor.jsx (Etapp 67d).
// Filter-/sorterings-/söktillståndet fortsätter leva i URL:en – bara scopat till DEN HÄR
// rutten nu (/leverantor/kunder?snabb=...), inte hela panelen.
export default function LeverantorKunder() {
  const { organisationer, sokkvot, orgIdMedSignal, ladda, setFel } = useOutletContext();

  const [sokparametrar, setSokparametrar] = useSearchParams();
  const snabbfilter = sokparametrar.get("snabb");
  const statusFilter = sokparametrar.get("status") ?? "";
  const avtalsstatusFilter = sokparametrar.get("avtalsstatus") ?? "";
  const modulFilter = sokparametrar.get("modul") ?? "";
  const visaDemo = sokparametrar.get("demo") !== "0";
  const sokterm = sokparametrar.get("sok") ?? "";
  const sortField = sokparametrar.get("sort") ?? SORT_FALT.NAMN;
  const sortRiktning = sokparametrar.get("riktning") ?? "asc";

  function uppdateraFilter(patch) {
    setSokparametrar(
      (fore) => {
        const efter = new URLSearchParams(fore);
        for (const [nyckel, varde] of Object.entries(patch)) {
          if (varde === null || varde === "" || varde === undefined) efter.delete(nyckel);
          else efter.set(nyckel, String(varde));
        }
        return efter;
      },
      { replace: true }
    );
  }

  const visadeOrganisationer = useMemo(
    () =>
      filtreraOchSorteraOrganisationer(
        organisationer,
        {
          snabbfilter,
          status: statusFilter,
          avtalsstatus: avtalsstatusFilter,
          modul: modulFilter,
          visaDemo,
          sok: sokterm,
          sortField,
          sortRiktning,
        },
        orgIdMedSignal
      ),
    [organisationer, snabbfilter, statusFilter, avtalsstatusFilter, modulFilter, visaDemo, sokterm, sortField, sortRiktning, orgIdMedSignal]
  );
  const nagotFilterAktivt =
    Boolean(snabbfilter) || Boolean(statusFilter) || Boolean(avtalsstatusFilter) || Boolean(modulFilter) || Boolean(sokterm) || !visaDemo;

  return (
    <div className="sida sida--bred">
      <h1><span aria-hidden="true">🏢</span> Kunder</h1>
      <p className="sida__beskrivning">
        Alla kundorganisationer – moduler, antal användare och senaste avslutade månadens
        AI-kostnad.
      </p>

      <SkapaOrganisationSektion onSkapad={ladda} onFel={setFel} />

      <SeedaStartbibliotekSektion organisationer={organisationer} onSeedat={ladda} onFel={setFel} />

      <DemomiljoSektion onNollstallt={ladda} onFel={setFel} />

      <HuvudmanSektion organisationer={organisationer} />

      <PipelineSektion organisationer={organisationer} />

      <OrganisationsListaSektion
        organisationer={organisationer}
        sokkvot={sokkvot}
        visadeOrganisationer={visadeOrganisationer}
        nagotFilterAktivt={nagotFilterAktivt}
        sokterm={sokterm}
        avtalsstatusFilter={avtalsstatusFilter}
        statusFilter={statusFilter}
        modulFilter={modulFilter}
        sortField={sortField}
        sortRiktning={sortRiktning}
        visaDemo={visaDemo}
        uppdateraFilter={uppdateraFilter}
        onRensaFilter={() => setSokparametrar(new URLSearchParams(), { replace: true })}
        ladda={ladda}
        onFel={setFel}
      />
    </div>
  );
}
