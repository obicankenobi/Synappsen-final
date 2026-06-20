import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoggaIn() {
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [fel, setFel] = useState("");
  const [laddar, setLaddar] = useState(false);
  const { loggaIn } = useAuth();
  const navigate = useNavigate();

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel("");
    setLaddar(true);
    try {
      await loggaIn(email, losenord);
      navigate("/");
    } catch {
      setFel("Fel e-post eller lösenord. Försök igen.");
    } finally {
      setLaddar(false);
    }
  }

  return (
    <div className="sida sida--auth">
      <h1>Logga in</h1>
      <p className="auth__undertext">Synappsen – kunskapsbank för akutmottagningen</p>
      <form onSubmit={hanteraSubmit} className="auth-form">
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
            autoComplete="current-password"
          />
        </label>
        {fel && <p className="auth__fel">{fel}</p>}
        <button type="submit" className="knapp" disabled={laddar}>
          {laddar ? "Loggar in..." : "Logga in"}
        </button>
      </form>
      <p className="auth__bytlank">
        Inget konto? <Link to="/registrera">Skapa konto</Link>
      </p>
    </div>
  );
}
