import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSkal from "../components/AuthSkal";
import { useAuth } from "../hooks/useAuth";
import { granskaInbjudan } from "../firebase/functions";
import { ROLE_LABELS } from "../firebase/roles";

// Etapp 6c: registrering kräver numera alltid en giltig inbjudan (?bjudan=token i länken),
// skickad av en superadmin från adminpanelen. Den tidigare öppna självbetjänings-
// registreringen (vem som helst fick ett konto i standardorganisationen) stängdes – se
// firestore.rules users/{userId} och UTVECKLINGSLOGG.md Fas 24.
export default function Registrera() {
  const [sokparametrar] = useSearchParams();
  const token = sokparametrar.get("bjudan");

  const [granskar, setGranskar] = useState(() => Boolean(token));
  const [inbjudan, setInbjudan] = useState(null);
  const [granskningsfel, setGranskningsfel] = useState("");

  const [namn, setNamn] = useState("");
  const [losenord, setLosenord] = useState("");
  const [fel, setFel] = useState("");
  const [laddar, setLaddar] = useState(false);
  const { registrera } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    granskaInbjudan(token)
      .then(({ data }) => setInbjudan(data))
      .catch((e) => setGranskningsfel(e.message ?? "Inbjudan kunde inte kontrolleras."))
      .finally(() => setGranskar(false));
  }, [token]);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel("");

    if (losenord.length < 6) {
      setFel("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    setLaddar(true);
    try {
      await registrera(inbjudan.epost, losenord, namn, token);
      navigate("/");
    } catch (e2) {
      setFel(e2.message ?? "Kunde inte skapa konto. E-postadressen kan redan vara registrerad.");
    } finally {
      setLaddar(false);
    }
  }

  if (!token || granskningsfel) {
    return (
      <AuthSkal
        rubrik="Skapa konto"
        undertext="Registrering kräver en inbjudan från din organisations administratör. Be en superadmin bjuda in dig från adminpanelen."
        foten={
          <p className="auth__bytlank">
            Har du redan ett konto? <Link to="/logga-in">Logga in</Link>
          </p>
        }
      >
        {granskningsfel && <p className="auth__fel">{granskningsfel}</p>}
      </AuthSkal>
    );
  }

  if (granskar) {
    return (
      <AuthSkal rubrik="Skapa konto" undertext="Kontrollerar inbjudan..." />
    );
  }

  return (
    <AuthSkal
      rubrik="Skapa konto"
      undertext={
        <>
          Du bjöds in till <strong>{inbjudan.organisationsNamn}</strong> med rollen{" "}
          <strong>{ROLE_LABELS[inbjudan.roll] ?? inbjudan.roll}</strong> ({inbjudan.epost}).
        </>
      }
      foten={
        <p className="auth__bytlank">
          Har du redan ett konto? <Link to="/logga-in">Logga in</Link>
        </p>
      }
    >
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
    </AuthSkal>
  );
}
