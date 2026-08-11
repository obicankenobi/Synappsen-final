import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSokindex } from "../hooks/useSokindex";
import { registreraVisning } from "../hooks/useVisningar";
import { useSokloggar } from "../hooks/useSokloggar";
import { loggaSokning, loggaTidTillKlick } from "../hooks/useSokstatistik";
import { useAuth } from "../hooks/useAuth";
import { DomanBadge } from "./Badge";
import { domanNyckelForEtikett } from "../utils/badge";
import { hittaPersonnummer } from "../utils/piiFilter";
import "./SokFalt.css";

// Egen liten wrapper runt Date.now(), definierad UTANFÖR komponenten – react-hooks/purity
// flaggar annars ett direktanrop till Date.now() inuti komponentkroppen (även när det bara
// sker i en event-handler, aldrig i själva render-passet).
function nuTid() {
  return Date.now();
}

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
  // Etapp 10e (tid-att-hitta): tidpunkten då den PÅGÅENDE sökningen påbörjades (första
  // tecknet efter ett tomt fält) – en ref, inte state, eftersom den aldrig ska trigga en
  // omrendering. Nollställs när fältet töms igen (sökningen avbröts utan klick).
  const sokStartTid = useRef(null);
  const { fuse } = useSokindex();
  const { loggaNollTraff } = useSokloggar(false);
  const { currentUser, organisationId } = useAuth();

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
      // Söker någon på ett personnummer får det aldrig hamna i sökloggen (genomgående krav 1).
      // firestore.rules avvisar det också, men filtret här gör att skrivningen inte ens försöks.
      // Räknaren loggaSokning nedan påverkas inte – den innehåller ingen fritext.
      if (!gavTraff && hittaPersonnummer(term).length === 0) {
        // Fire-and-forget: en nollträffslogg som inte skrivs (t.ex. avvisad av reglerna eller
        // offline) är oviktig för användaren – svälj felet tyst istället för en ohanterad rejection.
        loggaNollTraff(term, currentUser?.uid).catch(() => {});
      }
      loggaSokning(organisationId, gavTraff);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allaTraffar/loggaNollTraff läses vid timeout, inte som trigger
  }, [sokterm]);

  function hanteraSoktermAndring(varde) {
    if (varde.trim() && !sokterm.trim()) {
      sokStartTid.current = nuTid();
    } else if (!varde.trim()) {
      sokStartTid.current = null;
    }
    setSokterm(varde);
    setAktivKategori(null);
  }

  function hanteraKlick(post) {
    registreraVisning(post.titel, post.sokvag, organisationId);
    if (sokStartTid.current) {
      loggaTidTillKlick(organisationId, nuTid() - sokStartTid.current);
      sokStartTid.current = null;
    }
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
        placeholder="Sök rutin, diagnos eller nyckelord..."
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
      {/* Sökträffarna uppdateras medan fokus ligger kvar i fältet – utan en live-region får en
          skärmläsaranvändare ingen signal om att listan ändrats (WCAG 4.1.3). */}
      <p className="sr-only" role="status" aria-live="polite">
        {resultat.length > 0 ? `${resultat.length} träffar` : ""}
      </p>
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
                <span className="sok-falt__meta">
                  <DomanBadge nyckel={domanNyckelForEtikett(post.kategori)} etikett={post.kategori} />
                  {post.plats && <span className="sok-falt__plats">{post.plats}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
