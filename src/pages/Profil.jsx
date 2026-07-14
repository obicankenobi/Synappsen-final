import { useState } from "react";
import { Link } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import TvaFaktorSektion from "../components/TvaFaktorSektion";
import TemaVaxlare from "../components/TemaVaxlare";
import { useSnabblankar, ALLA_SNABBLANKAR } from "../hooks/useSnabblankar";
import { ROLE_LABELS } from "../firebase/roles";
import "./Profil.css";

export default function Profil() {
  const { currentUser, role } = useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const { synliga: snabblankar, satValda: satSnabblankar } = useSnabblankar(currentUser.uid);

  function vaxlaSnabblank(nyckel) {
    const aktuella = snabblankar.map((s) => s.nyckel);
    const nya = aktuella.includes(nyckel) ? aktuella.filter((n) => n !== nyckel) : [...aktuella, nyckel];
    satSnabblankar(nya);
  }
  const [nuvarandeLosenord, setNuvarandeLosenord] = useState("");
  const [nyttLosenord, setNyttLosenord] = useState("");
  const [sparar, setSparar] = useState(false);
  const [meddelande, setMeddelande] = useState(null);

  async function hanteraByteAvLosenord(e) {
    e.preventDefault();
    setMeddelande(null);
    setSparar(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, nuvarandeLosenord);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, nyttLosenord);
      setMeddelande({ typ: "ok", text: "Lösenordet har uppdaterats." });
      setNuvarandeLosenord("");
      setNyttLosenord("");
    } catch {
      setMeddelande({
        typ: "fel",
        text: "Kunde inte byta lösenord. Kontrollera att nuvarande lösenord är rätt.",
      });
    } finally {
      setSparar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>👤 Min profil</h1>

      <section className="profil-sektion">
        <p>
          <strong>E-post:</strong> {currentUser.email}
        </p>
        <p>
          <strong>Roll:</strong> {ROLE_LABELS[role] ?? role}
        </p>
      </section>

      <section className="profil-sektion">
        <h2>Byt lösenord</h2>
        <form className="profil-losenord-formular" onSubmit={hanteraByteAvLosenord}>
          <label>
            Nuvarande lösenord
            <input
              type="password"
              required
              value={nuvarandeLosenord}
              onChange={(e) => setNuvarandeLosenord(e.target.value)}
            />
          </label>
          <label>
            Nytt lösenord
            <input
              type="password"
              required
              minLength={6}
              value={nyttLosenord}
              onChange={(e) => setNyttLosenord(e.target.value)}
            />
          </label>
          {meddelande && (
            <p className={meddelande.typ === "ok" ? "profil-meddelande--ok" : "profil-meddelande--fel"}>
              {meddelande.text}
            </p>
          )}
          <button type="submit" className="knapp" disabled={sparar}>
            {sparar ? "Sparar..." : "Byt lösenord"}
          </button>
        </form>
      </section>

      <TvaFaktorSektion currentUser={currentUser} />

      <section className="profil-sektion">
        <h2>🎨 Utseende</h2>
        <TemaVaxlare />
      </section>

      <section className="profil-sektion">
        <h2>🔗 Genvägar på startsidan</h2>
        <p className="sida__beskrivning">Välj vilka snabblänkar som visas överst på startsidan.</p>
        <div className="profil-snabblankar">
          {ALLA_SNABBLANKAR.map((s) => (
            <label key={s.nyckel} className="profil-snabblankar__rad">
              <input
                type="checkbox"
                checked={snabblankar.some((v) => v.nyckel === s.nyckel)}
                onChange={() => vaxlaSnabblank(s.nyckel)}
              />
              {s.ikon} {s.namn}
            </label>
          ))}
        </div>
      </section>

      <section className="profil-sektion">
        <h2>⭐ Mina favoriter</h2>
        {favoritPoster.length === 0 && <p className="sida__beskrivning">Inga favoriter ännu.</p>}
        <ul className="hem__lista">
          {favoritPoster.map((p, i) => (
            <li key={i}>
              <Link to={p.sokvag}>{p.titel}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
