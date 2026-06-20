import Sektionssida from "../components/Sektionssida";
import { KAN_HANTERA_ANSLAG } from "../firebase/roles";

export default function Administration() {
  return (
    <Sektionssida
      omrade="administration"
      titel="Administration"
      ikon="📋"
      beskrivning="Besöks- och anhörigpolicy, anslag och nyheter samt allmänna regelverk."
      redigeraRoller={KAN_HANTERA_ANSLAG}
      godkannaRoller={KAN_HANTERA_ANSLAG}
    />
  );
}
