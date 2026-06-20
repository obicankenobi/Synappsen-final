import Sektionssida from "../components/Sektionssida";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";

export default function Logistik() {
  return (
    <Sektionssida
      omrade="logistik"
      titel="Logistik"
      ikon="📦"
      beskrivning="Introduktionsguide för nyanställda och förvaringskarta över material och utrustning."
      redigeraRoller={KAN_HANTERA_FORRAD}
      godkannaRoller={KAN_HANTERA_FORRAD}
    />
  );
}
