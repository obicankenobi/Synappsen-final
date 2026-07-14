# Synappsen – Rapport: funktionsöversikt och säkerhetsgenomgång

**Datum:** 2026-07-14
**Version vid rapporttillfället:** 5.4.1
**Omfattning:** Hela kodbasen (Firestore-regler, Storage-regler, Cloud Functions, samtliga
React-sidor/komponenter/hooks).

Denna rapport har två delar:

1. En sammanfattning av **allt som är implementerat i Synappsen hittills** (version 1.0.0 →
   5.4.1).
2. Resultatet av en **fullständig säkerhets- och buggenomgång** av hela kodbasen, med vad som
   åtgärdades och vad som medvetet lämnas kvar som en känd, dokumenterad begränsning.

Detaljerad teknisk logg per fas finns i `UTVECKLINGSLOGG.md`. Den här rapporten är en kondenserad
helhetsbild.

---

## Del 1 – Vad Synappsen gör idag

Synappsen är en installerbar webbapp (PWA) för en akutmottagning, byggd med React + Firebase.
Den samlar rutiner, förrådsinformation, kontakter och driftinformation på ett ställe, med
rollstyrd behörighet och flera lager av kvalitets- och säkerhetskontroller.

### Kärnfunktioner

- **Tre huvudsektioner:** Kliniskt stöd, Logistik (sex namngivna förråd) och Administration,
  med sökbara rutiner och förrådsartiklar.
- **AI-tolkning (Gemini):** foto på en whiteboard/anteckning/inventarielista skapar automatiskt
  ett utkast till rutin respektive förrådsartikel. Utkast måste alltid granskas och godkännas av
  en redaktör innan de publiceras. En budget (kronor/månad, både globalt och per användare)
  begränsar kostnaden.
- **Klinikstöd-sökning:** en fråga om t.ex. ett sjukdomstillstånd besvaras med källhänvisning
  från fem godkända medicinska källor (internetmedicin.se, 1177.se, Nationella kliniska
  kunskapsstödet, FASS vårdpersonal, Läkemedelsverket). **Denna funktion är för närvarande
  pausad** i användargränssnittet (se avsnitt "Pausad funktion" nedan).
- **Rollstyrd behörighet:** superadmin, vol, sektionsledare, VEC, förrådsansvarig, personal –
  varje roll har ett tydligt avgränsat redigeringsområde, kontrollerat både i gränssnittet och
  (avgörande) i Firestore-reglerna.

### Samarbete och kommunikation

- Anslagstavla med prioritet ("Viktigt"), fastnålning, utgångsdatum och läskvittering.
- Kommentarer (trådade) på rutiner, med @omnämnanden som ger notiser.
- Skiftrapport för praktisk drift-info mellan skift (t.ex. "vattenläcka i taket") – **aldrig
  patientinformation**, se säkerhetsavsnittet.
- Feedback-funktion med status (ny/under utredning/åtgärdad/avvisad) och svar från superadmin.
- In-app notisflöde, notisklocka med tangentbordsnavigering.
- Kontaktlista med telefonnummer som **ren text, ingen ring-funktion**.
- Länkbibliotek för externa/interna resurser.

### Kvalitet och spårbarhet

- Läskvittering på rutiner och anslag, med påminnelse om vilka som INTE läst än.
- Versionshistorik med visuell diff, återställning av tidigare version.
- Granskad-av-signatur, revideringsdatum och "granska igen"-flagga.
- Privata anteckningar (bara ägaren ser sina egna).
- Papperskorg – borttaget innehåll kan återställas.
- Sökbar/filtrerbar ändringslogg (audit trail) i adminpanelen.
- Bulk-taggning och bulk-godkänn/neka.
- Statistik i adminpanelen: mest aktiva användare, mest kvitterade rutiner, sökningar utan
  träffar (även som trend över tid), områdesscopad statistik för sektionsledare/VEC/
  förrådsansvarig, systemstatus-översikt.

### Personlig anpassning och tillgänglighet

- Mörkt läge (ljust/mörkt/följ system).
- Egna genvägar på startsidan, favoriter, "Mina uppgifter"-widget.
- Tangentbordsnavigering i notisklocka/dropdowns, "/"-genväg till sökfältet.
- Förbättrad kontrast, enhetlig visuell design.

### Säkerhet och drift

- E-post/lösenord-inloggning med valfri tvåfaktorsautentisering (TOTP).
- Automatisk utloggning vid inaktivitet, med konfigurerbar tid och förvarning.
- Force-logout: superadmin kan omedelbart återkalla en användares session.
- Offline-cachning (fungerar vid dåligt nät) med tydlig banner när anslutningen tappas.
- PII-filter: hård spärr mot personnummer, varning vid misstänkt namn – i formulär och i
  AI-tolkningen (se säkerhetsavsnittet för fullständiga detaljer och kvarvarande begränsning).
- Dubblettvarning vid skapande av kontakt/länk med samma namn som en befintlig.

### Pausad funktion

Klinikstöd-sökningen byggdes, testades och släpptes i flera iterationer (5.3.0–5.3.4), men
visade sig – trots upprepade fixar av modell/verktygsval, källvalidering och
redirect-upplösning – fortfarande kunna citera källor utanför den godkända listan i vissa fall.
Istället för att fortsätta lappa en lösning med osäker tillförlitlighet togs det medvetna
beslutet att **pausa funktionen** (v5.3.5) tills en mer robust lösning (t.ex. en riktig
domänbegränsad sökmotor via extern infrastruktur) kan byggas. All kod finns kvar och kan
återaktiveras.

---

## Del 2 – Säkerhets- och buggenomgång (denna rapport)

### Metod

- Fullständig manuell genomläsning av `firestore.rules` och `storage.rules`.
- Fullständig genomläsning av `functions/index.js` (alla Cloud Functions).
- Grep-genomsökning av hela `src/`-katalogen efter kända riskmönster: `dangerouslySetInnerHTML`,
  `eval`, `innerHTML=`, `document.write`, `tel:`-länkar, hårdkodade API-nycklar, känslig
  `console.log`.
- Riktad genomgång av varje `href`/`src`-bindning i JSX mot dess datakälla, för att avgöra om
  användarstyrd data kunde nå en länk osanerad.
- En bred genomgång av samtliga filer under `src/hooks`, `src/pages`, `src/components`,
  `src/utils` och `src/firebase` som inte redan omfattades av tidigare säkerhetsgenomgångar.

### Åtgärdat i denna genomgång

| # | Fynd | Fil | Åtgärd |
|---|------|-----|--------|
| 1 | Lagrad självriktad XSS: en sparad länk kunde innehålla ett `javascript:`-URI eftersom `<input type="url">`s inbyggda validering inte tillförlitligt blockerar det | `src/components/LankFormular.jsx`, `src/pages/Lankbibliotek.jsx` | Explicit kontroll att URL:en börjar med `http://`/`https://`, både innan sparning och innan den renderas som klickbar länk |
| 2 | Klinikstöd-sökningens Cloud Function saknade budgetspärr – kunde i teorin anropas direkt, obegränsat antal gånger, förbi den pausade knappen i gränssnittet | `functions/index.js` (`fragaKlinisktStod`) | Samma `reserveraBudget()`-spärr som de två andra Gemini-anropande funktionerna |
| 3 | Anslagstavlan (meddelanden till ALL personal) saknade helt patientuppgiftskontroll, till skillnad från alla andra fritextytor i appen | `src/components/AnslagFormular.jsx` | Samma `kontrolleraPatientuppgifter()`-kontroll som redan fanns i Skiftrapport/Kommentarer/Rutiner/Anteckningar/Feedback |

Samtliga tre är verifierade med grönt `npm run build`, `npm run lint` och `node -c
functions/index.js`.

### Granskat och redan säkert (inga ändringar behövdes)

- `MarkdownInnehall.jsx` – enda användningen av `dangerouslySetInnerHTML`, alltid föregången av
  `DOMPurify.sanitize()`.
- Länkar i `KlinikfragaSok.jsx` och `RutinKort.jsx` – kommer från server-validerad respektive
  Firebase Storage-genererad URL, aldrig direkt från användarinmatning.
- Kontaktlistan renderar telefonnummer som text, ingen `tel:`-länk – uppfyller kravet.
- Samtliga CRUD-hooks litar aldrig på klientens egen uppfattning om roll/ägarskap för
  auktorisering – Firestore-reglerna är den faktiska spärren i varje enskilt fall.
- Ingen `eval`, `innerHTML=`, hårdkodad hemlighet, eller känslig data i `console.log`/
  `localStorage` hittades någonstans i kodbasen.

### Kvarvarande, medvetet accepterade begränsningar

Dessa är kända och bedöms, men är arkitekturbeslut som bör tas av verksamheten – de har därför
**inte** ändrats i denna genomgång:

1. **PII-filtret för direkta Firestore-skrivningar är enbart klientsidigt.** Den juridiskt
   bindande spärren mot personnummer (validerad med datumkontroll + Luhn-checksumma) finns bara
   på serversidan för text som passerar en Cloud Function (AI-tolkning, klinikstöd-frågan). För
   rutiner, kommentarer, skiftrapport, anteckningar, feedback och anslag körs kontrollen bara i
   webbläsaren innan sparning – en teoretisk angripare med giltig inloggning som pratar direkt
   med Firestore-API:et kan kringgå den. Att stänga luckan helt kräver antingen en förenklad
   (mer trubbig, fler falska positiva) regex-spärr i `firestore.rules`, eller att flytta alla
   skrivningar via en Cloud Function. **Rekommendation:** ta ett medvetet beslut om detta är
   värt avvägningen, snarare än att anta att klientkontrollen räcker som juridiskt skydd.
2. Rå, ej AI-tolkad bild i `inkommande/{uid}/` kan läsas av vem som helst med en icke-
   "personal"-roll, inte bara den som laddade upp den – avsiktlig design för
   granskningsarbetsflödet, men innebär att PII-skanningen (som bara körs på extraherad text,
   aldrig på själva bilden) inte skyddar mot att en annan redaktör ser bilden innan tolkning.
3. `omnamnda`-fältet på en kommentar kan i teorin sättas till godtyckliga användar-ID:n av
   skaparen, utan validering mot texten – ger i värsta fall en missvisande @omnämnande-notis,
   exponerar ingen data.
4. `ForradArtikelFormular.jsx` saknar samma patientuppgiftskontroll som övriga formulär, men
   fälten (artikelnamn, skåp, hylla, antal) är korta strukturerade logistikuppgifter där
   patientinformation osannolikt hamnar av misstag.

### Sammanfattande bedömning

Ingen kritisk, direkt utnyttjningsbar sårbarhet (t.ex. IDOR mot annan användares data, förbikopp-
ling av rollbaserad åtkomst, XSS som drabbar andra användare utan interaktion) hittades i denna
genomgång. De tre åtgärdade punkterna var verkliga men begränsade i räckvidd (kräver antingen att
en användare klickar på en specifikt sparad skadlig länk, eller direkt anrop till en pausad
funktion, eller att anslagstavlan används felaktigt). Den kvarstående, mest relevanta punkten att
ta ställning till är #1 ovan – den klientsidiga PII-kontrollens begränsning – eftersom den rör
appens uttryckliga hårda krav om att aldrig lagra patientuppgifter.
