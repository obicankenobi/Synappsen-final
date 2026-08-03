// Etapp 42b/42d: delad av Godkannanden.jsx (hela kön) och GodkannandeBanner.jsx (bara antalet
// på Hem) – en enda plats som slår ihop utkast-rutiner/förrådsartiklar/ändringsförslag, så de
// två ställena aldrig kan råka räkna olika. Ren omslagning av useRutiner/useForradsartiklar/
// useAndringsforslag + byggGodkannandeKo(); montera BARA i komponenter som redan är villkorat
// renderade för redaktörer (se Hem.jsx: `{arRedaktor(role) && <GodkannandeBanner />}`) – annars
// läggs de här Firestore-lyssnarna på varje sidvisning oavsett behörighet.
import { useAuth } from "./useAuth";
import { useRutiner } from "./useRutiner";
import { useForradsartiklar } from "./useForradsartiklar";
import { useAndringsforslag } from "./useAndringsforslag";
import { byggGodkannandeKo } from "../utils/godkannandeKo";
import { KAN_GODKANNA_RUTINER, KAN_HANTERA_ANSLAG, KAN_HANTERA_FORRAD } from "../firebase/roles";

export function useGodkannandeKo() {
  const { role } = useAuth();

  const farGodkannaKlin = KAN_GODKANNA_RUTINER.includes(role);
  const farGodkannaAdmin = KAN_HANTERA_ANSLAG.includes(role);
  const farGodkannaLogistik = KAN_HANTERA_FORRAD.includes(role);

  const { rutiner: klinRutiner, godkannRutin: godkannKlin, taBortRutin: taBortKlin } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner, godkannRutin: godkannAdmin, taBortRutin: taBortAdmin } = useRutiner("administration");
  const { artiklar, godkannArtikel, taBortArtikel } = useForradsartiklar();
  const { forslag: klinForslag } = useAndringsforslag("kliniskt-stod");
  const { forslag: adminForslag } = useAndringsforslag("administration");

  const ko = byggGodkannandeKo({
    rutinerPerOmrade: { "kliniskt-stod": klinRutiner, administration: adminRutiner },
    artiklar,
    forslagPerOmrade: { "kliniskt-stod": klinForslag, administration: adminForslag },
    behorighet: { "kliniskt-stod": farGodkannaKlin, administration: farGodkannaAdmin, logistik: farGodkannaLogistik },
  });

  const aktorer = {
    "kliniskt-stod": { godkann: godkannKlin, taBort: taBortKlin },
    administration: { godkann: godkannAdmin, taBort: taBortAdmin },
  };

  async function godkann(post, uid, namn) {
    if (post.typ === "forradsartikel") {
      return godkannArtikel(post.id);
    }
    return aktorer[post.omrade].godkann(post.id, uid, namn);
  }

  async function taBort(post, uid) {
    if (post.typ === "forradsartikel") {
      return taBortArtikel(post.id, uid);
    }
    return aktorer[post.omrade].taBort(post.id, uid);
  }

  return { ...ko, godkann, taBort };
}
