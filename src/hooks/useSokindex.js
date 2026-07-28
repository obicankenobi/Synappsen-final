// Etapp 23a: den delade sökmotorn bakom BÅDE SokFalt.jsx (inline på startsidan) och
// Kommandopalett.jsx (global, Ctrl/Cmd+K) – extraherad hit så att det finns EN plats som
// bygger indexet och EN Fuse-instans, istället för en parallell sökmotor i paletten.
import { useMemo } from "react";
import Fuse from "fuse.js";
import { sokposter } from "../data/sokindex";
import { useForradsartiklar, ARTIKEL_STATUS } from "./useForradsartiklar";
import { useRutiner, RUTIN_STATUS } from "./useRutiner";
import { useKontakter } from "./useKontakter";
import { useLankbibliotek } from "./useLankbibliotek";
import { forradTillSlug } from "../firebase/forrad";

export const OMRADE_LABELS = {
  "kliniskt-stod": "Kliniskt stöd",
  administration: "Administration",
};

export const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

function platsBeskrivning(artikel) {
  const delar = [artikel.forrad];
  if (artikel.skap) delar.push(`Skåp ${artikel.skap}`);
  if (artikel.hylla) delar.push(`Hylla ${artikel.hylla}`);
  return delar.join(" · ");
}

// Etapp 23b: "handlingar, inte bara träffar" – en checklistekörning är en annan destination
// (körvyn, /checklista/{id}) än rutinens egen sida, så den listas som en EGEN sökbar post med
// en egen kategori ("Åtgärd"), inte bara en biprodukt av rutinträffen.
const STATISKA_ATGARDER = [
  { titel: "Öppna akutläget", kategori: "Åtgärd", sokvag: "/akutlage", nyckelord: ["larm", "akut", "nödläge"] },
  { titel: "Ny skiftrapport", kategori: "Åtgärd", sokvag: "/skiftrapport", nyckelord: ["drift", "skift"] },
  { titel: "Min kompetensstatus", kategori: "Åtgärd", sokvag: "/kompetensmatris", nyckelord: ["kompetens", "matris"] },
  { titel: "Introduktion", kategori: "Åtgärd", sokvag: "/introduktion", nyckelord: ["ny", "nyanställd"] },
  { titel: "Kontakter", kategori: "Åtgärd", sokvag: "/kontakter", nyckelord: ["telefon", "ringa"] },
];

export function useSokindex() {
  const { artiklar } = useForradsartiklar();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { kontakter } = useKontakter();
  const { lankar } = useLankbibliotek();

  const alltSokbart = useMemo(() => {
    const forradsposter = artiklar
      .filter((a) => a.status === ARTIKEL_STATUS.GODKAND)
      .map((a) => ({
        titel: a.namn,
        kategori: "Logistik",
        sokvag: `/logistik/${forradTillSlug(a.forrad)}`,
        nyckelord: [a.forrad, a.skap, a.hylla, ...(a.sokord ?? [])].filter(Boolean),
        plats: platsBeskrivning(a),
      }));

    const godkandaRutiner = [...klinisktRutiner, ...adminRutiner].filter(
      (r) => r.status === RUTIN_STATUS.GODKAND
    );

    const rutinposter = godkandaRutiner.map((r) => ({
      titel: r.titel,
      kategori: OMRADE_LABELS[r.omrade] ?? r.omrade,
      sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
      nyckelord: (r.innehall ?? "").split(/\s+/).slice(0, 60),
    }));

    // Etapp 23b: en sökbar genväg direkt till körvyn för varje rutin som faktiskt HAR steg
    // (checklistläge, Etapp 18) – annars är "Kör checklista" bara ett löfte utan innehåll.
    const checklisteatgarder = godkandaRutiner
      .filter((r) => (r.steg?.length ?? 0) > 0)
      .map((r) => ({
        titel: `Kör checklista: ${r.titel}`,
        kategori: "Åtgärd",
        sokvag: `/checklista/${r.id}`,
        nyckelord: ["checklista", "kör"],
      }));

    const kontaktposter = kontakter.map((k) => ({
      titel: k.namn,
      kategori: "Kontakt",
      sokvag: "/kontakter",
      nyckelord: [k.kategori, k.beskrivning].filter(Boolean),
    }));

    const lankposter = lankar.map((l) => ({
      titel: l.titel,
      kategori: "Länk",
      sokvag: "/lankbibliotek",
      nyckelord: [l.kategori, l.beskrivning].filter(Boolean),
    }));

    return [
      ...sokposter,
      ...STATISKA_ATGARDER,
      ...forradsposter,
      ...rutinposter,
      ...checklisteatgarder,
      ...kontaktposter,
      ...lankposter,
    ];
  }, [artiklar, klinisktRutiner, adminRutiner, kontakter, lankar]);

  const fuse = useMemo(
    () =>
      new Fuse(alltSokbart, {
        keys: [
          { name: "titel", weight: 0.5 },
          { name: "nyckelord", weight: 0.4 },
          { name: "kategori", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [alltSokbart]
  );

  return { alltSokbart, fuse };
}
