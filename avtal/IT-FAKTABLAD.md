# Tekniskt faktablad till kundens IT-avdelning

**Status:** Färdigt faktablad – avsett att kunna skickas rakt av till en IT-avdelning som
en del av ett upphandlings- eller granskningsunderlag, utan att ägaren behöver skriva något
nytt. Uppdatera vid varje förändring av det som beskrivs nedan (särskilt App Check-status,
se punkt 3).

**Upprättat:** 2026-07-26, som en del av Etapp 13d (`ETAPPLAN3.md`).

---

## 1. Arkitekturöversikt

Synappsen är en installerbar webbapp (Progressive Web App) byggd på:

- **Frontend:** React, byggd som statiska filer, levererade via Firebase Hosting (Googles
  globala CDN). Ingen serverkomponent renderar sidor – all logik körs i klientens
  webbläsare/PWA och i separata serverfunktioner (se nedan).
- **Backend:** Google Cloud Functions ("serverless" – ingen egen server att patcha eller
  övervaka), samtliga körande i regionen **europe-west1** (Belgien), verifierat direkt i
  koden.
- **Databas:** Google Cloud Firestore (dokumentdatabas) för strukturerad data, Google Cloud
  Storage för uppladdade filer/bilder. Regionen för dessa två sätts vid projektskapande –
  **se punkt 7 för hur ni får ett bekräftat svar på var databasen fysiskt ligger.**
- **Autentisering:** Google Firebase Authentication (e-post/lösenord, med valfri
  tvåfaktorsautentisering).
- **Multi-tenant:** varje kundorganisation är logiskt helt avskild från andra kunder i
  samma databas, inte fysiskt separerade databaser – isoleringen sker i databasens
  behörighetsregler (Firestore Security Rules), verifierad med en egen automatiserad
  testsvit som körs vid varje ny version.

Ingen del av systemet kräver att er organisation driftar egen infrastruktur, VPN eller
egna servrar. All åtkomst sker över vanlig HTTPS.

## 2. Autentisering och behörighet

- **Inloggning:** e-post och lösenord.
- **Tvåfaktorsautentisering (TOTP, t.ex. Google Authenticator/Microsoft Authenticator):**
  frivillig per konto, men kan **göras obligatorisk per roll** av er egen superadmin
  (t.ex. kräva 2FA för samtliga superadmin- och VOL-konton) – detta enforceras i
  databasreglerna, inte bara som en inställning i gränssnittet.
- **SSO/Microsoft Entra ID:** planerat men **inte byggt ännu** (se `ETAPPLAN3.md`, Etapp
  13f). Fråga leverantören om aktuell status om detta är ett hårt krav hos er.
- **Sessionshantering:** automatisk utloggning vid inaktivitet (konfigurerbar tid). En
  superadmin hos er kan omedelbart återkalla en enskild användares aktiva session
  ("force-logout"), t.ex. vid en misstänkt komprometterad inloggning eller när någon
  slutar.
- **Rollmodell:** sju roller (superadmin, VOL, sektionsledare, VEC, förrådsansvarig,
  personal, kiosk), var och en med ett tydligt avgränsat redigeringsområde, enforcerat i
  databasreglerna – inte bara döljande av knappar i gränssnittet.
- **Kioskläge (delad enhet):** ett valfritt sjunde kontotyp för en delad platta (t.ex. i en
  foajé), inte en person. Läser godkänt innehåll, söker och kör checklistor, men kan i
  grunden aldrig kvittera, kommentera, föreslå en ändring eller bristanmäla – rollen är
  spärrad från allt som skulle göra en spårbarhetssiffra (t.ex. kvitteringsgrad) missvisande.
  Låses upp med en PIN-kod (hashad server-side, aldrig läsbar av klienten) istället för ett
  personligt lösenord; er superadmin kan byta PIN-koden omedelbart vid förlust eller stöld.

## 3. App Check (skydd mot obehöriga klienter)

Sedan sommaren 2026 skickar den riktiga, installerade appen ett kryptografiskt intyg
(Google App Check, via reCAPTCHA v3) med varje serveranrop, som ett tekniskt skydd mot
att någon bygger en egen klient som pratar direkt med backend-funktionerna.

**Aktuell status: mätfas.** Klienten skickar intyg, men serverfunktionerna kräver dem
ännu inte (enforcement är en separat, medvetet uppskjuten aktivering efter en
mätperiod – se `ETAPPLAN2.md`, Etapp 12c). **Uppdatera denna rad när enforcement har
aktiverats.**

## 4. Nätverkskrav

- Utgående HTTPS (port 443) till Googles/Firebases domäner samt Sentry (felrapportering)
  – standardportar, ingen brandväggsöppning utöver vanlig webbtrafik krävs.
- Ingen inkommande trafik till er organisation krävs – Synappsen initierar aldrig
  anslutningar in till er infrastruktur.
- Fungerar i moderna webbläsare (senaste två versionerna av Chrome, Edge, Firefox,
  Safari) samt som installerad PWA på mobil/dator.
- **Offline-läge:** ett urval godkänt innehåll (rutiner) cachas lokalt och går att läsa
  utan nätverksanslutning, med en tydlig banner när anslutningen tappats. Ny/redigerad
  data kräver nät för att sparas.

## 5. Incident- och driftrutin

- **Felrapportering:** oväntade tekniska fel i både frontend och backend fångas
  automatiskt (Sentry, EU-region – se `avtal/UNDERBITRADEN.md`) och granskas löpande av
  leverantören.
- **Personuppgiftsincident:** underrättelse till er senast inom 72 timmar, se
  `avtal/PUB-AVTAL-MALL.md` punkt 8.
- **Er egen förmåga att agera:** superadmin-rollen kan själv pausa hela organisationens
  åtkomst (t.ex. vid en misstänkt pågående incident) utan att kontakta leverantören
  först, samt exportera all sin data när som helst.
- **Vem hos leverantören kan se era uppgifter, och hur vet ni när de gör det?** Normalt
  ingen – leverantören har ingen stående läsåtkomst till kunders innehåll (rutiner, förråd,
  anslag, kontakter). Er egen superadmin kan, om ni själva väljer det för att lösa en
  supportfråga, öppna ett tillfälligt läsfönster (högst 6 timmar, med en angiven anledning) –
  detta syns i er adminpanel medan det pågår och loggas i revisionsloggen i båda ändar. Ni
  kan avsluta fönstret när som helst, innan det annars upphör automatiskt (Etapp 50b).

## 6. Backup och återställningstid

- **Automatisk veckovis backup** av hela organisationens Firestore-data, schemalagt
  varje måndag 03:00 (svensk tid), verifierat direkt i koden
  (`functions/index.js`, `veckovisBackupSchemalagt`). Omfattar 13 collections plus
  mätvärdeshistoriken (en underkollektion) och revisionsloggens hashkedje-huvud – utökad
  2026-08-06 (Etapp 49d) från en tidigare ofullständig lista på 7. Omfattar MEDVETET INTE
  delad plattforminfrastruktur (t.ex. den globalt delade sökkvoten) som inte är
  organisationens egen data.
- Backupen kan också tas ut manuellt på begäran, när som helst (samma funktion som
  används vid avetablering, se punkt 8).
- **Återställningsfunktion finns** (Etapp 33a, 2026-07-31): en Cloud Function
  (`aterstallOrganisationCallable`) läser en tidigare backupfil och skriver tillbaka
  innehållet för EN namngiven organisation. Endast leverantörens plattformsadmin kan
  anropa den – ingen självbetjänings-knapp i appen, medvetet, då en felriktad
  återställning skriver över levande kunddata. Bevisad end-to-end (seed → backup →
  radera → återställ → verifiera identiskt innehåll) i den automatiska testsviten.
- **Återställningstid (RTO):** **uppmätt mot SKARP produktionsmiljö 2026-08-09** (verklig
  nätverkslatens och verklig infrastruktur, inte emulatorn) – en syntetisk testorganisation
  med 100 dokument över fyra collections (rutiner, anslag, kontakter, förrådsartiklar)
  säkerhetskopierades och återställdes på **1 136 ms**. Mätningen körs via ett repeterbart,
  självstädande verktyg (`.github/workflows/rto-matning.yml`,
  `functions/scripts/rto-matning.cjs`) – testorganisationen och dess backupfil raderas
  automatiskt igen innan verktyget avslutas, ingen skarp kunddata rörs. En tidigare mätning
  mot Firestore-emulatorn (1 500 dokument över fem samlingar, under 200 ms ren skrivtid)
  visade att implementationen skalar linjärt; den slutsatsen står sig och bekräftas nu av en
  riktig mätning. För en normalstor kundorganisation (upp till några tusen dokument) är den
  realistiska förväntan fortsatt **under en minut** aktiv bearbetningstid; funktionens
  tekniska timeout är satt till 5 minuter som säkerhetsmarginal. Den faktiska flaskhalsen vid
  en verklig incident är sällan själva återställningen, utan tiden det tar en människa att
  identifiera rätt backupfil och fatta beslutet att återställa (se
  `INCIDENT-CHECKLISTA.md` steg 8).
  **Återkommande övning (Etapp 49c):** en rad i den återkommande säkerhetsgenomgången
  (`CLAUDE.md`) påminner nu om att kontrollera om det är dags att göra om övningen – kör
  helt enkelt om `.github/workflows/rto-matning.yml` manuellt. Senast genomförd 2026-08-09.
- **Återställningspunkt (RPO):** upp till en veckas dataförlust i värsta scenario
  (tiden mellan senaste schemalagda backup och en eventuell incident), utöver vad
  Firestores egen inbyggda redundans inom Google Cloud i sig hanterar för
  infrastrukturfel (skilj på "vi förlorade data" och "vi behöver återställa en tidigare
  version").

## 7. Datalagringsregion

- **Cloud Functions (all serverlogik):** bekräftat **europe-west1** (Belgien),
  konsekvent för samtliga funktioner, verifierat direkt i koden.
- **Firestore-databas och Storage-bucket:** [FYLLS I av leverantören/ägaren – detta
  sätts vid projektskapande i Firebase-konsolen, inte i koden, och måste därför
  bekräftas där. Se `avtal/UNDERBITRADEN.md`, Etapp 13b, för samma öppna punkt.] Svara
  med den faktiska regionen, inte en formulering – det är den vanligaste frågan från en
  IT-säkerhetsgranskning.
- **AI-bildtolkning (Gemini):** går för närvarande via Googles publika Gemini API, vars
  regionsgaranti skiljer sig från Google Vertex AI. Se `avtal/UNDERBITRADEN.md` för
  detaljer om detta är relevant för er.

## 8. Vad händer när avtalet avslutas

- Er organisations åtkomst kan pausas omedelbart (läsbehörighet till egen data kvarstår
  för er, ingen ny skrivning tillåts).
- En fullständig exportfil av all er data kan tas ut när som helst, av er egen
  superadmin eller på begäran till leverantören.
- **Känd begränsning:** permanent radering av data efter avslutat avtal är i dagsläget
  en **manuell process** hos leverantören på skriftlig begäran, inte automatiserad – se
  `avtal/PUB-AVTAL-MALL.md` punkt 6 för den fullständiga, ärliga beskrivningen och den
  avtalade tidsfristen för radering.

---

*Detta faktablad refererar till, men ersätter inte, `avtal/PUB-AVTAL-MALL.md` (juridiska
villkor), `avtal/UNDERBITRADEN.md` (fullständig underbiträdeslista) och
`avtal/DPIA-UNDERLAG.md` (dataskyddsbedömning).*
