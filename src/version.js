// Appens versionsnummer. Läses direkt från package.json ("version") istället för att
// underhållas som en egen, separat sträng här – tidigare (fram till v5.26.0) var den en
// manuellt uppdaterad konstant, och glömdes bort vid varje release efter dess (drev isär
// från package.json:s version i minst 19 releaser innan det upptäcktes). Vite/Rollup
// bearbetar JSON-importer vid bygget, så det här kostar ingen extra runtime-uppslagning.
import { version } from "../package.json";

export const APP_VERSION = version;
