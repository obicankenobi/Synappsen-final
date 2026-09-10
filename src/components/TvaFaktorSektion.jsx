import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  startaTotpRegistrering,
  slutforTotpRegistrering,
  taBortTotp,
  hamtaInskrivnaFaktorer,
} from "../firebase/mfa";
import { useDialog } from "../hooks/useDialog";
import "./TvaFaktorSektion.css";

export default function TvaFaktorSektion({ currentUser }) {
  const { confirm } = useDialog();
  const [steg, setSteg] = useState("vila"); // vila | reauth | registrera
  const [nuvarandeLosenord, setNuvarandeLosenord] = useState("");
  const [registreringsdata, setRegistreringsdata] = useState(null);
  const [kod, setKod] = useState("");
  const [meddelande, setMeddelande] = useState(null);
  const [laddar, setLaddar] = useState(false);

  const inskrivnaFaktorer = hamtaInskrivnaFaktorer(currentUser);

  async function hanteraReauth(e) {
    e.preventDefault();
    setMeddelande(null);
    setLaddar(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, nuvarandeLosenord);
      await reauthenticateWithCredential(currentUser, cred);
      const data = await startaTotpRegistrering(currentUser);
      setRegistreringsdata(data);
      setSteg("registrera");
    } catch {
      setMeddelande({ typ: "fel", text: "Fel lösenord. Försök igen." });
    } finally {
      setLaddar(false);
    }
  }

  async function hanteraSlutforRegistrering(e) {
    e.preventDefault();
    setMeddelande(null);
    setLaddar(true);
    try {
      await slutforTotpRegistrering(currentUser, registreringsdata.secret, kod);
      setMeddelande({ typ: "ok", text: "Tvåfaktorsautentisering är nu aktiverad." });
      setSteg("vila");
      setRegistreringsdata(null);
      setKod("");
      setNuvarandeLosenord("");
    } catch {
      setMeddelande({ typ: "fel", text: "Fel kod. Kontrollera i autentiseringsappen och försök igen." });
    } finally {
      setLaddar(false);
    }
  }

  async function hanteraTaBort(faktorUid) {
    if (!(await confirm("Inaktivera tvåfaktorsautentisering?"))) return;
    await taBortTotp(currentUser, faktorUid);
    setMeddelande({ typ: "ok", text: "Tvåfaktorsautentisering är inaktiverad." });
  }

  return (
    <section className="profil-sektion">
      <h2><span aria-hidden="true">🔐</span> Tvåfaktorsautentisering</h2>

      {meddelande && (
        <p className={meddelande.typ === "ok" ? "profil-meddelande--ok" : "profil-meddelande--fel"}>
          {meddelande.text}
        </p>
      )}

      {inskrivnaFaktorer.length > 0 && (
        <div>
          <p>Aktiverad via {inskrivnaFaktorer[0].displayName || "en autentiseringsapp"}.</p>
          <button className="knapp knapp--farlig" onClick={() => hanteraTaBort(inskrivnaFaktorer[0].uid)}>
            Inaktivera
          </button>
        </div>
      )}

      {inskrivnaFaktorer.length === 0 && steg === "vila" && (
        <button className="knapp" onClick={() => setSteg("reauth")}>
          Aktivera tvåfaktorsautentisering
        </button>
      )}

      {steg === "reauth" && (
        <form className="tva-faktor-formular" onSubmit={hanteraReauth}>
          <p className="sida__beskrivning">Bekräfta ditt lösenord för att fortsätta.</p>
          <label>
            Lösenord
            <input
              type="password"
              required
              value={nuvarandeLosenord}
              onChange={(e) => setNuvarandeLosenord(e.target.value)}
            />
          </label>
          <button type="submit" className="knapp" disabled={laddar}>
            {laddar ? "Kontrollerar..." : "Fortsätt"}
          </button>
        </form>
      )}

      {steg === "registrera" && registreringsdata && (
        <form className="tva-faktor-formular" onSubmit={hanteraSlutforRegistrering}>
          <p className="sida__beskrivning">
            Skanna QR-koden med en autentiseringsapp (t.ex. Google Authenticator), eller
            mata in nyckeln manuellt.
          </p>
          <img className="tva-faktor-qr" src={registreringsdata.qrDataUrl} alt="QR-kod för tvåfaktorsautentisering" />
          <p className="tva-faktor-nyckel">Nyckel: {registreringsdata.delningsnyckel}</p>
          <label>
            Kod från appen
            <input
              type="text"
              inputMode="numeric"
              required
              autoFocus
              value={kod}
              onChange={(e) => setKod(e.target.value)}
            />
          </label>
          <button type="submit" className="knapp" disabled={laddar}>
            {laddar ? "Bekräftar..." : "Bekräfta"}
          </button>
        </form>
      )}
    </section>
  );
}
