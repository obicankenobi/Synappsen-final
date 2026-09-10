import { Link } from "react-router-dom";
import "./Hjalp.css";

// Statisk hjälp- och FAQ-innehåll. Uppdatera löpande när nya funktioner tillkommer.
export default function Hjalp() {
  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">❓</span> Hjälp</h1>
      <p className="sida__beskrivning">
        En snabb guide till hur Synappsen fungerar, samt svar på vanliga frågor.
      </p>

      <section className="hjalp-sektion">
        <h2>Kom igång</h2>
        <ul>
          <li>
            <strong>Sök</strong> – sökfältet på startsidan hittar rutiner och förrådsartiklar även
            om du inte söker på exakt rätt ord (t.ex. "kad" hittar "urinkateter").
          </li>
          <li>
            <strong>Kliniskt stöd, Logistik, Administration</strong> – de tre huvudsektionerna med
            rutiner, förråd respektive policys.
          </li>
          <li>
            <strong>Ladda upp dokument</strong> – fota en whiteboard, ett papper eller en
            förrådslista. Gemini AI tolkar bilden och skapar ett utkast som måste granskas och
            godkännas innan det syns för andra.
          </li>
          <li>
            <strong>Anslagstavla</strong> – meddelanden från ledningen till all personal.
          </li>
          <li>
            <strong>Favoriter</strong> – tryck på stjärnan på en rutin eller artikel för att spara
            den under "Mina favoriter" på startsidan.
          </li>
        </ul>
      </section>

      <section className="hjalp-sektion">
        <h2>Roller och behörigheter</h2>
        <ul>
          <li><strong>Personal</strong> – kan läsa allt godkänt innehåll, söka, ladda upp foton, kommentera och favoritmarkera.</li>
          <li><strong>Sektionsledare / VÖL</strong> – skapar och godkänner rutiner inom Kliniskt stöd.</li>
          <li><strong>Förrådsansvarig</strong> – hanterar förrådsartiklar i Logistik.</li>
          <li><strong>VEC</strong> – hanterar innehåll i Administration.</li>
          <li><strong>Superadmin</strong> – full behörighet, hanterar användarroller, budget för AI-tolkning och läser feedback.</li>
        </ul>
      </section>

      <section className="hjalp-sektion">
        <h2>Vanliga frågor (FAQ)</h2>

        <details>
          <summary>Varför syns inte min uppladdade rutin/artikel?</summary>
          <p>
            AI-tolkat innehåll skapas alltid som ett <em>utkast</em> och måste godkännas av
            behörig person innan det blir synligt för andra. Du ser dina egna utkast markerade
            med "Utkast".
          </p>
        </details>

        <details>
          <summary>Jag valde flera bilder men bara en laddades upp – vad hände?</summary>
          <p>
            Vissa mobiler öppnar galleriet i enval-läge trots att appen tillåter flerval. Tryck på
            "Välj bilder från galleri" en gång per bild om det händer – de läggs till i samma kö.
          </p>
        </details>

        <details>
          <summary>Vad händer om AI-tolkningen misslyckas?</summary>
          <p>
            Ett felmeddelande visas i listan. Det finns ett månatligt kostnadstak för
            AI-tolkning – om det är nått måste en superadmin höja det i adminpanelen innan fler
            bilder kan tolkas.
          </p>
        </details>

        <details>
          <summary>Hur rapporterar jag ett fel eller ger ett förslag?</summary>
          <p>
            Använd <Link to="/feedback">Feedback</Link>-sidan – den går till DIN ORGANISATIONS
            EGEN superadmin, inte till Synappsen. Vill du i stället kontakta Synappsen
            (leverantören av appen) direkt, använd{" "}
            <Link to="/kontakta-leverantoren">Kontakta Synappsen</Link>.
          </p>
        </details>

        <details>
          <summary>Fungerar appen utan internet?</summary>
          <p>
            Innehåll du redan öppnat cachas lokalt och går att läsa igen även vid dåligt nät.
            Nytt innehåll och sökresultat kräver dock uppkoppling.
          </p>
        </details>

        <details>
          <summary>Vad betyder den röda "Bör granskas"-flaggan på en rutin?</summary>
          <p>
            Rutiner ska granskas regelbundet. Flaggan visas när det gått lång tid sedan rutinen
            senast markerades som granskad av en behörig redaktör.
          </p>
        </details>

        <details>
          <summary>Hur tillgänglig är Synappsen för mig som använder tangentbord eller skärmläsare?</summary>
          <p>
            Läs vår{" "}
            <a href="https://synappsen.se/tillganglighet.html" target="_blank" rel="noreferrer">
              tillgänglighetsredogörelse
            </a>{" "}
            – den beskriver vad som är kontrollerat, kända kvarstående brister och hur du
            rapporterar ett problem.
          </p>
        </details>
      </section>
    </div>
  );
}
