import { DOMAN_INFO, STATUS_INFO } from "../utils/badge";

// UI-designjustering (2026-07): EN delad källa för domän- och statusbadges, så de aldrig kan
// implementeras med olika padding/radius/typsnitt i olika delar av appen (kravet på ett
// enhetligt badge-designsystem). Domänfärger (fast per område) och statusfärger (dynamiska,
// t.ex. "väntar på godkännande") delar medvetet ALDRIG samma hue-familj – se tokens i
// index.css. Statusbadgen har alltid en ikon som redundant signal utöver färgen.

// En domänbadge för ett känt område (Kliniskt stöd/Logistik/Administration). Andra
// kategorier (Åtgärd, Kontakt, Länk m.fl., se useSokindex.js) har ingen fast domänfärg och
// visas neutralt istället – de tävlar inte om samma betydelse som PUB-områdena.
export function DomanBadge({ nyckel, etikett }) {
  const info = DOMAN_INFO[nyckel];
  if (info) {
    return <span className={`badge ${info.css}`}>{info.etikett}</span>;
  }
  if (!etikett) return null;
  return <span className="badge badge--neutral">{etikett}</span>;
}

export function StatusBadge({ status }) {
  const info = STATUS_INFO[status];
  if (!info) return null;
  return (
    <span className={`badge badge--status ${info.css}`}>
      <span aria-hidden="true">{info.ikon}</span>
      {info.etikett}
    </span>
  );
}
