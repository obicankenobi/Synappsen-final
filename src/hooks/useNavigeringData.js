import { useAuth } from "./useAuth";
import { arRedaktor, ROLES } from "../firebase/roles";
import { useArPlattformsadmin } from "./useArPlattformsadmin";

// Etapp 69c: EN källa för vilka sidor huvudnavigeringen länkar till, oavsett om de visas i
// BottomNav.jsx (mobil, ett fåtal synliga länkar + "Mer") eller Sidomeny.jsx (dator, allt
// synligt samtidigt). Två separata kopior av samma roll-/redaktörs-/plattformsadmin-logik är
// precis det mönster som redan orsakat en riktig bugg i det här projektet (se ETAPPLAN18.md
// 69a: BottomNav.jsx glömde stänga en meny den själv byggde) – därför byggs listan HÄR en
// gång, och båda komponenterna läser den.
//
// "Sök", "Mer" och "Lämna kioskläge" är MEDVETET inte med. De är åtgärder (öppnar
// kommandopaletten/en meny/en PIN-dialog), inte sidlänkar, och kräver lokal state (öppet/
// stängt) i den komponent som visar dem – att lägga dem här hade bara flyttat kopplingen
// till fel ställe.
export function useNavigeringData() {
  const { role } = useAuth();
  const { arPlattformsadmin } = useArPlattformsadmin();

  if (role === ROLES.KIOSK) {
    return {
      kiosk: true,
      huvud: [
        { till: "/", end: true, ikon: "🏠", namn: "Hem" },
        // Etapp 55b: akutläget ska vara en tryckning bort på en kiosk-enhet.
        { till: "/akutlage", ikon: "🚨", namn: "Akutläge" },
      ],
      ovriga: [
        { till: "/kliniskt-stod", ikon: "🩺", namn: "Kliniskt" },
        { till: "/logistik", ikon: "📦", namn: "Logistik" },
        { till: "/administration", ikon: "📋", namn: "Regler" },
      ],
    };
  }

  return {
    kiosk: false,
    huvud: [
      { till: "/", end: true, ikon: "🏠", namn: "Hem" },
      { till: "/kliniskt-stod", ikon: "🩺", namn: "Kliniskt" },
      { till: "/logistik", ikon: "📦", namn: "Logistik" },
    ],
    ovriga: [
      { till: "/anslag", ikon: "📢", namn: "Anslag" },
      { till: "/administration", ikon: "📋", namn: "Regler" },
      { till: "/nyheter", ikon: "📰", namn: "Nyheter" },
      // Etapp 65d: övningspasset – hör hemma bland de sällan-varje-dag-sidorna.
      { till: "/ova", ikon: "🎓", namn: "Öva" },
      ...(arRedaktor(role) ? [{ till: "/godkannanden", ikon: "✅", namn: "Godkänn" }] : []),
      ...(arRedaktor(role) ? [{ till: "/admin", ikon: "⚙️", namn: "Admin" }] : []),
      // Etapp 67a: gatas på den faktiska behörigheten (plattformsadmin är ingen roll), inte på role.
      ...(arPlattformsadmin ? [{ till: "/leverantor", ikon: "🏢", namn: "Leverantör" }] : []),
    ],
  };
}
