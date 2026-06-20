import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { sokposter } from "../data/sokindex";
import "./SokFalt.css";

// Sökfält med fuzzy-sökning via Fuse.js
export default function SokFalt() {
  const [sokterm, setSokterm] = useState("");
  const navigate = useNavigate();

  const fuse = useMemo(
    () =>
      new Fuse(sokposter, {
        keys: ["titel", "kategori", "nyckelord"],
        threshold: 0.4,
      }),
    []
  );

  const resultat = sokterm.trim() ? fuse.search(sokterm).map((r) => r.item) : [];

  return (
    <div className="sok-falt">
      <input
        type="search"
        placeholder="Sök t.ex. 'Ryggsmärta' eller 'Trauma höft'..."
        value={sokterm}
        onChange={(e) => setSokterm(e.target.value)}
        aria-label="Sök i kunskapsbanken"
      />
      {resultat.length > 0 && (
        <ul className="sok-falt__resultat">
          {resultat.map((post) => (
            <li key={post.titel}>
              <button onClick={() => navigate(post.sokvag)}>
                <span className="sok-falt__titel">{post.titel}</span>
                <span className="sok-falt__kategori">{post.kategori}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
