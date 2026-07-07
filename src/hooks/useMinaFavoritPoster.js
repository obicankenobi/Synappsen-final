// Slår ihop favoritmarkerade rutiner och förrådsartiklar till en enhetlig lista med
// titel + sökväg, för visning på Hem och profilsidan.
import { useAuth } from "./useAuth";
import { useFavoriter } from "./useFavoriter";
import { useRutiner } from "./useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "./useForradsartiklar";
import { forradTillSlug } from "../firebase/forrad";

export function useMinaFavoritPoster() {
  const { currentUser } = useAuth();
  const { favoriter } = useFavoriter(currentUser?.uid);
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { artiklar } = useForradsartiklar();

  const favoritRutiner = [...klinisktRutiner, ...adminRutiner]
    .filter((r) => favoriter.includes(`rutin:${r.id}`))
    .map((r) => ({
      titel: r.titel,
      sokvag: r.omrade === "kliniskt-stod" ? "/kliniskt-stod" : "/administration",
    }));

  const favoritArtiklar = artiklar
    .filter((a) => a.status === ARTIKEL_STATUS.GODKAND && favoriter.includes(`artikel:${a.id}`))
    .map((a) => ({ titel: a.namn, sokvag: `/logistik/${forradTillSlug(a.forrad)}` }));

  return [...favoritRutiner, ...favoritArtiklar];
}
