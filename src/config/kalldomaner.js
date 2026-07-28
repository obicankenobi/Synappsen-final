// Etapp 21a: samma godkända källdomäner som klinikstöd-sökningen och firestore.rules
// (GODKANDA_KALLDOMANER i functions/index.js). Håll de tre listorna synkade – domänen är
// en säkerhetsgräns (källbevakningsjobbet i 21b hämtar bara dessa domäner), inte bara UX.
export const GODKANDA_KALLDOMANER = [
  "internetmedicin.se",
  "1177.se",
  "nationelltklinisktkunskapsstod.se",
  "fass.se",
  "lakemedelsverket.se",
  "vardhandboken.se",
  "folkhalsomyndigheten.se",
];

export function domanGodkand(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return GODKANDA_KALLDOMANER.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
