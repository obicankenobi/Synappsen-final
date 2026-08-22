import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthSkal from "../components/AuthSkal";
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
      <AuthSkal rubrik="Verifieringskod" undertext="Ange koden från din autentiseringsapp.">
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
      </AuthSkal>
    );
  }

  return (
    <AuthSkal
      rubrik="Logga in"
      undertext="Logga in för att nå avdelningens rutiner."
      foten={
        <p className="auth__bytlank">
          Inget konto? <Link to="/registrera">Skapa konto</Link>
        </p>
      }
    >
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
    </AuthSkal>
  );
}
