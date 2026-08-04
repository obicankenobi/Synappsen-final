import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hamtaMfaResolver, slutforMfaInloggning } from "../firebase/mfa";

export default function LoggaIn() {
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [totpKod, setTotpKod] = useState("");
  const [resolver, setResolver] = useState(null);
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
    } catch (err) {
      if (err.code === "auth/multi-factor-auth-required") {
        setResolver(hamtaMfaResolver(err));
      } else {
        setFel("Fel e-post eller lösenord. Försök igen.");
      }
    } finally {
      setLaddar(false);
    }
  }

  async function hanteraTotpSubmit(e) {
    e.preventDefault();
    setFel("");
    setLaddar(true);
    try {
      await slutforMfaInloggning(resolver, totpKod);
      navigate("/");
    } catch {
      setFel("Fel kod från autentiseringsappen. Försök igen.");
    } finally {
      setLaddar(false);
    }
  }

  if (resolver) {
    return (
      <main id="huvudinnehall" className="sida sida--auth" tabIndex={-1}>
        <h1>Verifieringskod</h1>
        <p className="auth__undertext">Ange koden från din autentiseringsapp.</p>
        <form onSubmit={hanteraTotpSubmit} className="auth-form">
          <label>
            Kod
            <input
              type="text"
              inputMode="numeric"
              required
              autoFocus
              value={totpKod}
              onChange={(e) => setTotpKod(e.target.value)}
            />
          </label>
          {fel && <p className="auth__fel">{fel}</p>}
          <button type="submit" className="knapp" disabled={laddar}>
            {laddar ? "Verifierar..." : "Verifiera"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main id="huvudinnehall" className="sida sida--auth" tabIndex={-1}>
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
    </main>
  );
}
