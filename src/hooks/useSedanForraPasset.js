// Etapp 25a: "Sedan ditt förra pass" – en passbaserad (inte dagbaserad) sammanställning av
// vad som hänt sedan användarens FÖREGÅENDE inloggning (foregaendeInloggning, se
// AuthContext.jsx – fångad innan users/{uid}.senasteInloggning skrivs över av den pågående
// sessionen). Bygger uteslutande på datakällor som redan finns (useAnslag, useRutiner,
// useSkiftrapport) – ingen ny insamling, bara en ny sammanställning av befintlig data.
import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useAnslag } from "./useAnslag";
import { useRutiner, RUTIN_STATUS } from "./useRutiner";
import { useSkiftrapport } from "./useSkiftrapport";
import { kvitteraLast, kvitteraLastAnslag } from "./useLaskvittering";

const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

function efterFörraPasset(tidpunkt, sedan) {
  if (!tidpunkt?.toDate) return false;
  if (!sedan?.toDate) return true;
  return tidpunkt.toDate() > sedan.toDate();
}

function harKvitterat(lasteAv, uid) {
  return (lasteAv ?? []).some((l) => l.uid === uid);
}

export function useSedanForraPasset() {
  const { currentUser, namn, foregaendeInloggning } = useAuth();
  const { anslag } = useAnslag();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  // useSkiftrapport begränsar redan till de senaste 48 timmarna (skiftrapporter är
  // MENAT att vara transient driftinfo, inte historik) – ingen ny fråga byggs här, "aktiva"
  // och "atgardadeSenaste" täcker tillsammans hela det fönstret.
  const { aktiva: aktivaSkiftrapporter, atgardadeSenaste } = useSkiftrapport();
  const skiftrapporter = useMemo(
    () => [...aktivaSkiftrapporter, ...atgardadeSenaste],
    [aktivaSkiftrapporter, atgardadeSenaste]
  );

  const uid = currentUser?.uid;

  const poster = useMemo(() => {
    const allaRutiner = [...klinisktRutiner, ...adminRutiner];

    const anslagsposter = anslag
      .filter((a) => !a.borttagen && efterFörraPasset(a.skapad, foregaendeInloggning))
      .map((a) => ({
        id: `anslag-${a.id}`,
        typ: "anslag",
        text: `Nytt anslag: ${a.titel}`,
        sokvag: "/anslag",
        tid: a.skapad,
        kanKvittera: !harKvitterat(a.lasteAv, uid),
        kvittera: () => kvitteraLastAnslag(a.id, uid, namn),
      }));

    const rutinposter = allaRutiner
      .filter((r) => r.status === RUTIN_STATUS.GODKAND && efterFörraPasset(r.skapad, foregaendeInloggning))
      .map((r) => ({
        id: `rutin-${r.id}`,
        typ: "rutin",
        text: `Ny rutin: ${r.titel}`,
        sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
        tid: r.skapad,
        kanKvittera: !harKvitterat(r.lasteAv, uid),
        kvittera: () => kvitteraLast(r.id, uid, namn),
      }));

    const skiftposter = skiftrapporter
      .filter((s) => efterFörraPasset(s.skapad, foregaendeInloggning))
      .map((s) => ({
        id: `skift-${s.id}`,
        typ: "skiftrapport",
        text: s.text,
        sokvag: "/skiftrapport",
        tid: s.skapad,
        kanKvittera: false,
      }));

    return [...anslagsposter, ...rutinposter, ...skiftposter].sort(
      (a, b) => (b.tid?.toMillis?.() ?? 0) - (a.tid?.toMillis?.() ?? 0)
    );
  }, [anslag, klinisktRutiner, adminRutiner, skiftrapporter, foregaendeInloggning, uid, namn]);

  return { poster, sedan: foregaendeInloggning };
}
