import { useAkutlageRutiner } from "../hooks/useAkutlageRutiner";
import { useKontakter } from "../hooks/useKontakter";

// Etapp 17c: håller akutlägets Firestore-frågor "varma" i IndexedDB-cachen (se Akutlage.jsx
// för resonemanget) oavsett vilken sida användaren faktiskt är på – annars skulle innehållet
// bara vara garanterat läsbart offline om personen redan hunnit besöka /akutlage EN gång med
// nät, vilket inte går att lita på i en nödsituation. Renderar ingenting.
export default function AkutlagePrefetch() {
  useAkutlageRutiner();
  useKontakter();
  return null;
}
