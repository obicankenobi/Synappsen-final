import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthSkal from "../components/AuthSkal";
import { hamtaMfaResolver, slutforMfaInloggning } from "../firebase/mfa";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";

export default function LoggaIn() {
  const [email, setEmail] = useState("");
  const [losenord, setLosenord] = useState("");
  const [totpKod, setTotpKod] = useState("");
  const [resolver, setResolver] = useState(null);
  const [fel, setFel] = useState("");
  const [laddar, setLaddar] = useState(false);
  const { loggaIn } = useAuth();
  const navigate = useNavigate();
  const [aterstallning, setAterstallning] = useState(null);

  // Etapp 70b: fanns inte alls fram till 2026-08-26 – en användare som glömt sitt lösenord
  // hade ingen väg tillbaka utan att kontakta superadmin, som i sin tur inte heller kunde
  // göra något. Mejlet skickas av Firebase Auth självt, INTE via Brevo, och fungerar därför
  // även medan BREVO_API_KEY saknas.
  //
  // Svaret är MEDVETET detsamma oavsett om adressen finns eller inte: att svara olika hade
  // gjort inloggningssidan till en kontrollpanel för vilka e-postadresser som har konto hos
  // en namngiven vårdgivare (användaruppräkning). auth/user-not-found sväljs därför tyst.
  async function hanteraAterstallning() {
    const adress = email.trim();
    if (!adress) {
      setAterstallning({ typ: "fel", text: "Fyll i din e-postadress först." });
      return;
    }
    setFel("");
    try {
      await sendPasswordResetEmail(auth, adress);
    } catch (err) {
      if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-email") {
        setAterstallning({ typ: "fel", text: "Kunde inte skicka just nu. Försök igen om en stund." });
        return;
      }
    }
    setAterstallning({
      typ: "ok",
      text: "Om adressen har ett konto har ett mejl med återställningslänk skickats. Kolla även skräpposten.",
    });
  }

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
        <button type="button" className="knapp--lank auth__glomt" onClick={hanteraAterstallning}>
          Glömt lösenordet?
        </button>
        {aterstallning && (
          <p className={aterstallning.typ === "fel" ? "auth__fel" : "auth__info"}>
            {aterstallning.text}
          </p>
        )}
      </form>
    </AuthSkal>
  );
}
