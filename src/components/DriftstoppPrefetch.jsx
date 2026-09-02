import { useDriftstoppRutiner } from "../hooks/useDriftstoppRutiner";

// Etapp 72f: håller driftstoppslägets Firestore-fråga "varm" i IndexedDB-cachen (se
// Driftstopp.jsx för resonemanget) oavsett vilken sida användaren faktiskt är på – annars
// skulle innehållet bara vara garanterat läsbart offline om personen redan hunnit besöka
// /driftstopp EN gång med nät, vilket inte går att lita på när IT-systemen ligger nere.
// Ingen useKontakter behövs här (till skillnad från AkutlagePrefetch.jsx) – driftstoppsläget
// har ingen larmnummersektion. Renderar ingenting.
export default function DriftstoppPrefetch() {
  useDriftstoppRutiner();
  return null;
}
