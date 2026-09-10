import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useAndringsforslag, FORSLAG_STATUS } from "../hooks/useAndringsforslag";
import { useNotiser } from "../hooks/useNotiser";
import { borGranskas, narmarSigGranskning } from "../utils/rutinHjalp";
import {
  KAN_REDIGERA_RUTINER,
  KAN_GODKANNA_RUTINER,
  KAN_HANTERA_ANSLAG,
  KAN_HANTERA_FORRAD,
} from "../firebase/roles";

// Samlar det som väntar på just den inloggade användaren, så man slipper leta i varje sektion.
export default function MinaUppgifter() {
  const { currentUser, role } = useAuth();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { artiklar: forradsartiklar } = useForradsartiklar();
  const { forslag: forslagKlin } = useAndringsforslag("kliniskt-stod");
  const { forslag: forslagAdmin } = useAndringsforslag("administration");
  const { notiser } = useNotiser();

  const farGodkannaKlin = KAN_GODKANNA_RUTINER.includes(role);
  const farRedigeraKlin = KAN_REDIGERA_RUTINER.includes(role);
  const farHanteraAdmin = KAN_HANTERA_ANSLAG.includes(role);
  const farHanteraForrad = KAN_HANTERA_FORRAD.includes(role);

  const uppgifter = [];

  const utkastKlin = farGodkannaKlin ? klinisktRutiner.filter((r) => r.status === RUTIN_STATUS.UTKAST).length : 0;
  const utkastAdmin = farHanteraAdmin ? adminRutiner.filter((r) => r.status === RUTIN_STATUS.UTKAST).length : 0;
  const utkastForrad = farHanteraForrad
    ? forradsartiklar.filter((a) => a.status === ARTIKEL_STATUS.UTKAST).length
    : 0;

  if (utkastKlin > 0) {
    uppgifter.push({ text: `${utkastKlin} utkast väntar i Kliniskt stöd`, sokvag: "/kliniskt-stod" });
  }
  if (utkastAdmin > 0) {
    uppgifter.push({ text: `${utkastAdmin} utkast väntar i Administration`, sokvag: "/administration" });
  }
  if (utkastForrad > 0) {
    uppgifter.push({ text: `${utkastForrad} förrådsartiklar väntar på granskning`, sokvag: "/logistik" });
  }

  // Etapp 38a: ändringsförslag (Etapp 26) syntes tidigare bara om man själv navigerade in i
  // rätt sektion – nu räknas de in i samma samlade lista som utkast, så en redaktör ser HELA
  // sin kö på ett ställe.
  const forslagKlinAntal = farGodkannaKlin ? forslagKlin.filter((f) => f.status === FORSLAG_STATUS.NY).length : 0;
  const forslagAdminAntal = farHanteraAdmin ? forslagAdmin.filter((f) => f.status === FORSLAG_STATUS.NY).length : 0;

  if (forslagKlinAntal > 0) {
    uppgifter.push({ text: `${forslagKlinAntal} ändringsförslag väntar i Kliniskt stöd`, sokvag: "/kliniskt-stod" });
  }
  if (forslagAdminAntal > 0) {
    uppgifter.push({ text: `${forslagAdminAntal} ändringsförslag väntar i Administration`, sokvag: "/administration" });
  }

  // Etapp 37d: en arkiverad rutin ("gäller inte längre") ska inte nagga om granskning.
  const flaggadeKlin = farRedigeraKlin
    ? klinisktRutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND && r.arkiverad !== true && borGranskas(r.granskadDatum)).length
    : 0;
  const flaggadeAdmin = farHanteraAdmin
    ? adminRutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND && r.arkiverad !== true && borGranskas(r.granskadDatum)).length
    : 0;

  if (flaggadeKlin > 0) {
    uppgifter.push({ text: `${flaggadeKlin} rutiner bör granskas i Kliniskt stöd`, sokvag: "/kliniskt-stod" });
  }
  if (flaggadeAdmin > 0) {
    uppgifter.push({ text: `${flaggadeAdmin} rutiner bör granskas i Administration`, sokvag: "/administration" });
  }

  // Rutiner där just den inloggade uttryckligen är ansvarig (agare-fältet) och som snart
  // behöver granskas – oberoende av vanlig redigeringsbehörighet, eftersom en specifik person
  // kan tilldelas ansvar utan att ha en roll med redigeringsrätt för området.
  const minaAnsvarsrutiner = [...klinisktRutiner, ...adminRutiner].filter((r) => {
    if (r.status !== RUTIN_STATUS.GODKAND || r.arkiverad === true || !narmarSigGranskning(r.granskadDatum)) return false;
    if (r.agare?.typ === "roll") return role === r.agare.roll;
    if (r.agare?.typ === "person") return currentUser?.uid === r.agare.uid;
    return false;
  });
  if (minaAnsvarsrutiner.length > 0) {
    uppgifter.push({
      text: `${minaAnsvarsrutiner.length} rutin(er) du ansvarar för behöver granskas snart`,
      sokvag: minaAnsvarsrutiner[0].omrade === "kliniskt-stod" ? "/kliniskt-stod" : "/administration",
    });
  }

  if (notiser.length > 0) {
    uppgifter.push({ text: `${notiser.length} olästa notiser`, sokvag: notiser[0].sokvag });
  }

  if (uppgifter.length === 0) return null;

  return (
    <section className="hem__sektion">
      <h2><span aria-hidden="true">✅</span> Mina uppgifter</h2>
      <ul className="hem__lista">
        {uppgifter.map((u, i) => (
          <li key={i}>
            <Link to={u.sokvag}>{u.text}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
