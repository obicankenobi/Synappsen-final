import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { sokposter } from "../data/sokindex";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { forradTillSlug } from "../firebase/forrad";
import "./SokFalt.css";

function platsBeskrivning(artikel) {
  const delar = [artikel.forrad];
  if (artikel.skap) delar.push(`Skåp ${artikel.skap}`);
  if (artikel.hylla) delar.push(`Hylla ${artikel.hylla}`);
  return delar.join(" · ");
}

// Sökfält med fuzzy-sökning via Fuse.js, kombinerar statiskt index med förrådsartiklar från Firestore
export default function SokFalt() {
  const [sokterm, setSokterm] = useState("");
  const navigate = useNavigate();
  const { artiklar } = useForradsartiklar();

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
    return [...sokposter, ...forradsposter];
  }, [artiklar]);

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
              <button onClick={() => navigate(post.sokvag)}>
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
