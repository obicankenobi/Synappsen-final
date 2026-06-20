import Sektionssida from "../components/Sektionssida";
import { KAN_REDIGERA_RUTINER, KAN_GODKANNA_RUTINER } from "../firebase/roles";

export default function KlinisktStod() {
  return (
    <Sektionssida
      omrade="kliniskt-stod"
      titel="Kliniskt stöd"
      ikon="🩺"
      beskrivning="Handläggningsrutiner, triageringsstöd och kritiska kom-ihåg-saker."
      redigeraRoller={KAN_REDIGERA_RUTINER}
      godkannaRoller={KAN_GODKANNA_RUTINER}
    />
  );
}
