import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { sokposter } from "../data/sokindex";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { forradTillSlug } from "../firebase/forrad";
import { registreraVisning } from "../hooks/useVisningar";
import { useSokloggar } from "../hooks/useSokloggar";
import { useAuth } from "../hooks/useAuth";
import "./SokFalt.css";

function platsBeskrivning(artikel) {
  const delar = [artikel.forrad];
  if (artikel.skap) delar.push(`Skåp ${artikel.skap}`);
  if (artikel.hylla) delar.push(`Hylla ${artikel.hylla}`);
  return delar.join(" · ");
}

const OMRADE_LABELS = {
  "kliniskt-stod": "Kliniskt stöd",
  administration: "Administration",
};

const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

// Sökfält med fuzzy-sökning via Fuse.js, kombinerar statiskt index, förrådsartiklar och riktiga
// rutiner från Firestore (Kliniskt stöd + Administration)
export default function SokFalt() {
  const [sokterm, setSokterm] = useState("");
  const navigate = useNavigate();
  const { artiklar } = useForradsartiklar();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { loggaNollTraff } = useSokloggar(false);
  const { currentUser } = useAuth();

  const alltSokbart = useMemo(() => {
    const forradsposter = artiklar
      .filter((a) => a.status === ARTIKEL_STATUS.GODKAND)
      .map((a) => ({
        titel: a.namn,
        kategori: "Logistik",
        sokvag: `/logistik/${forradTillSlug(a.forrad)}`,
        nyckelord: [a.forrad, a.skap, a.hylla, ...(a.sokord ?? [])].filter(Boolean),
        plats: platsBeskrivning(a),
      }));

    const rutinposter = [...klinisktRutiner, ...adminRutiner]
      .filter((r) => r.status === RUTIN_STATUS.GODKAND)
      .map((r) => ({
        titel: r.titel,
        kategori: OMRADE_LABELS[r.omrade] ?? r.omrade,
        sokvag: `${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`,
        nyckelord: (r.innehall ?? "").split(/\s+/).slice(0, 60),
      }));

    return [...sokposter, ...forradsposter, ...rutinposter];
  }, [artiklar, klinisktRutiner, adminRutiner]);

  const fuse = useMemo(
    () =>
      new Fuse(alltSokbart, {
        keys: [
          { name: "titel", weight: 0.5 },
          { name: "nyckelord", weight: 0.4 },
          { name: "kategori", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [alltSokbart]
  );

  const resultat = sokterm.trim() ? fuse.search(sokterm).map((r) => r.item) : [];

  // Loggar sökningar (minst 3 tecken) som ger noll träffar, efter en kort paus i skrivandet,
  // så att ledningen ser vilket innehåll personal efterfrågar men som saknas.
  useEffect(() => {
    const term = sokterm.trim();
    if (term.length < 3) return;
    const timer = setTimeout(() => {
      if (resultat.length === 0) {
        loggaNollTraff(term, currentUser?.uid);
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resultat/loggaNollTraff läses vid timeout, inte som trigger
  }, [sokterm]);

  function hanteraKlick(post) {
    registreraVisning(post.titel, post.sokvag);
    navigate(post.sokvag);
  }

  return (
    <div className="sok-falt">
      <input
        type="search"
        placeholder="Sök t.ex. 'Ryggsmärta' eller 'Kanyl'..."
        value={sokterm}
        onChange={(e) => setSokterm(e.target.value)}
        aria-label="Sök i kunskapsbanken"
      />
      {resultat.length > 0 && (
        <ul className="sok-falt__resultat">
          {resultat.map((post, i) => (
            <li key={`${post.titel}-${i}`}>
              <button onClick={() => hanteraKlick(post)}>
                <span className="sok-falt__titel">{post.titel}</span>
                <span className="sok-falt__kategori">{post.plats ?? post.kategori}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
