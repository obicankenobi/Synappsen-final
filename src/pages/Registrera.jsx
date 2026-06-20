import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Registrera() {
  const [namn, setNamn] = useState("");
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [fel, setFel] = useState("");
  const [laddar, setLaddar] = useState(false);
  const { registrera } = useAuth();
  const navigate = useNavigate();

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel("");

    if (losenord.length < 6) {
      setFel("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    setLaddar(true);
    try {
      await registrera(email, losenord, namn);
      navigate("/");
    } catch {
      setFel("Kunde inte skapa konto. E-postadressen kan redan vara registrerad.");
    } finally {
      setLaddar(false);
    }
  }

  return (
    <div className="sida sida--auth">
      <h1>Skapa konto</h1>
      <p className="auth__undertext">
        Nya konton får rollen Personal. En administratör kan höja behörigheten senare.
      </p>
      <form onSubmit={hanteraSubmit} className="auth-form">
        <label>
          Namn
          <input
            type="text"
            required
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          E-post
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Lösenord
          <input
            type="password"
            required
            value={losenord}
            onChange={(e) => setLosenord(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
        </label>
        {fel && <p className="auth__fel">{fel}</p>}
        <button type="submit" className="knapp" disabled={laddar}>
          {laddar ? "Skapar konto..." : "Skapa konto"}
        </button>
      </form>
      <p className="auth__bytlank">
        Har du redan ett konto? <Link to="/logga-in">Logga in</Link>
      </p>
    </div>
  );
}
