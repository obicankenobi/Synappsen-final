import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";
import { sokposter } from "../data/sokindex";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { useKontakter } from "../hooks/useKontakter";
import { useLankbibliotek } from "../hooks/useLankbibliotek";
import { forradTillSlug } from "../firebase/forrad";
import { registreraVisning } from "../hooks/useVisningar";
import { useSokloggar } from "../hooks/useSokloggar";
import { loggaSokning } from "../hooks/useSokstatistik";
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

// Fetmarkerar den del av texten som exakt matchar söktermen (versalokänsligt).
// Fuse.js fuzzy-matchar även när texten inte innehåller söktermen ordagrant, i så
// fall visas texten helt enkelt utan markering.
function markeraTraff(text, term) {
  if (!term.trim()) return text;
  const index = text.toLowerCase().indexOf(term.trim().toLowerCase());
  if (index === -1) return text;
  const slut = index + term.trim().length;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, slut)}</mark>
      {text.slice(slut)}
    </>
  );
}

// Sökfält med fuzzy-sökning via Fuse.js, kombinerar statiskt index, förrådsartiklar,
// rutiner, kontakter och länkbibliotek från Firestore
export default function SokFalt() {
  const [sokterm, setSokterm] = useState("");
  const [aktivKategori, setAktivKategori] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { artiklar } = useForradsartiklar();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { kontakter } = useKontakter();
  const { lankar } = useLankbibliotek();
  const { loggaNollTraff } = useSokloggar(false);
  const { currentUser, organisationId } = useAuth();

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

    const kontaktposter = kontakter.map((k) => ({
      titel: k.namn,
      kategori: "Kontakt",
      sokvag: "/kontakter",
      nyckelord: [k.kategori, k.beskrivning].filter(Boolean),
    }));

    const lankposter = lankar.map((l) => ({
      titel: l.titel,
      kategori: "Länk",
      sokvag: "/lankbibliotek",
      nyckelord: [l.kategori, l.beskrivning].filter(Boolean),
    }));

    return [...sokposter, ...forradsposter, ...rutinposter, ...kontaktposter, ...lankposter];
  }, [artiklar, klinisktRutiner, adminRutiner, kontakter, lankar]);

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

  const allaTraffar = sokterm.trim() ? fuse.search(sokterm).map((r) => r.item) : [];
  const traffKategorier = [...new Set(allaTraffar.map((p) => p.kategori))];
  const resultat = aktivKategori
    ? allaTraffar.filter((p) => p.kategori === aktivKategori)
    : allaTraffar;

  // Loggar sökningar (minst 3 tecken) efter en kort paus i skrivandet: dels de som ger noll
  // träffar (så ledningen ser vilket innehåll som efterfrågas men saknas), dels räknare för
  // totalt antal sökningar/nollträffar (Etapp 4 – ger en riktig "andel nollträffar"-procent).
  useEffect(() => {
    const term = sokterm.trim();
    if (term.length < 3) return;
    const timer = setTimeout(() => {
      const gavTraff = allaTraffar.length > 0;
      if (!gavTraff) {
        loggaNollTraff(term, currentUser?.uid);
      }
      loggaSokning(organisationId, gavTraff);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allaTraffar/loggaNollTraff läses vid timeout, inte som trigger
  }, [sokterm]);

  function hanteraSoktermAndring(varde) {
    setSokterm(varde);
    setAktivKategori(null);
  }

  function hanteraKlick(post) {
    registreraVisning(post.titel, post.sokvag, organisationId);
    navigate(post.sokvag);
  }

  function hanteraFaltTangent(e) {
    if (e.key === "Escape") {
      hanteraSoktermAndring("");
    } else if (e.key === "ArrowDown" && resultat.length > 0) {
      e.preventDefault();
      e.currentTarget.parentElement.querySelector(".sok-falt__resultat button")?.focus();
    }
  }

  function hanteraResultatTangent(e, index) {
    const knappar = Array.from(e.currentTarget.closest("ul").querySelectorAll("button"));
    if (e.key === "ArrowDown") {
      e.preventDefault();
      knappar[index + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else knappar[index - 1]?.focus();
    } else if (e.key === "Escape") {
      hanteraSoktermAndring("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="sok-falt">
      <input
        ref={inputRef}
        type="search"
        placeholder="Sök t.ex. 'Ryggsmärta' eller 'Kanyl'..."
        value={sokterm}
        onChange={(e) => hanteraSoktermAndring(e.target.value)}
        onKeyDown={hanteraFaltTangent}
        aria-label="Sök i kunskapsbanken"
      />
      {traffKategorier.length > 1 && (
        <div className="sok-falt__kategorifilter">
          <button
            type="button"
            className={`sok-falt__kategori-chip ${aktivKategori === null ? "sok-falt__kategori-chip--vald" : ""}`}
            onClick={() => setAktivKategori(null)}
          >
            Alla ({allaTraffar.length})
          </button>
          {traffKategorier.map((kategori) => (
            <button
              type="button"
              key={kategori}
              className={`sok-falt__kategori-chip ${aktivKategori === kategori ? "sok-falt__kategori-chip--vald" : ""}`}
              onClick={() => setAktivKategori(kategori)}
            >
              {kategori} ({allaTraffar.filter((p) => p.kategori === kategori).length})
            </button>
          ))}
        </div>
      )}
      {resultat.length > 0 && (
        <ul className="sok-falt__resultat" role="listbox">
          {resultat.map((post, i) => (
            <li key={`${post.titel}-${i}`} role="presentation">
              <button
                onClick={() => hanteraKlick(post)}
                onKeyDown={(e) => hanteraResultatTangent(e, i)}
                role="option"
                aria-selected="false"
              >
                <span className="sok-falt__titel">{markeraTraff(post.titel, sokterm)}</span>
                <span className="sok-falt__kategori">{post.plats ?? post.kategori}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
