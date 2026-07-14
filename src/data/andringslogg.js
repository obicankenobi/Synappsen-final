// Användarvänd ändringslogg, visas på sidan "Nyheter" (/nyheter).
// Nyast först. Lägg till en ny post högst upp varje gång en release görs.
// Håll texterna korta och begripliga för slutanvändare (inga filnamn/tekniska detaljer).
export const ANDRINGSLOGG = [
  {
    version: "5.5.0",
    datum: "2026-07-14",
    andringar: [
      "Extra skydd mot personnummer nu även direkt i databasen, inte bara i formulären",
      "Kommentarer och feedback skickas nu genom ett extra serversteg som stoppar spam och kontrollerar personuppgifter en gång till",
      "@omnämnande-förslag när du skriver @ i en kommentar, istället för att behöva komma ihåg exakt användarnamn",
      "Anslag kan nu få en \"kräver kvittering senast\"-deadline, med översikt i adminpanelen över vilka som inte kvitterat i tid",
      "Notis till redaktörer när en rutin snart behöver granskas igen, inte bara efter att fristen redan gått ut",
      "Möjlighet att ta bort en tagg från flera markerade rutiner samtidigt (inte bara lägga till)",
      "Sökresultaten kan nu filtreras per kategori (t.ex. bara Logistik eller bara Kontakter)",
      "Snabbare uppstart av appen tack vare omstrukturerad laddning",
    ],
  },
  {
    version: "5.4.1",
    datum: "2026-07-14",
    andringar: [
      "Säkerhetsgenomgång av hela appen: stoppat en sparbar länk-sårbarhet i länkbiblioteket, lagt till budgetspärr på klinikstöd-sökningen och samma patientuppgifts-varning på anslag som redan fanns på rutiner/kommentarer/skiftrapport",
    ],
  },
  {
    version: "5.4.0",
    datum: "2026-07-14",
    andringar: [
      "Nämn en kollega i en kommentar med @användarnamn – de får en notis",
      "Egna genvägar på startsidan – välj själv vilka snabblänkar som visas (inställning under Min profil)",
      "Superadmin kan nu svara på och sätta status på inskickad feedback – avsändaren ser svaret under Feedback",
      "Läskvittering på anslag, precis som för rutiner",
      "Ny knapp \"Skriv ut hela sektionen\" för att skriva ut/spara alla rutiner i ett område som PDF",
      "Enkel formateringsverktygsrad (fet/kursiv/rubrik/lista) ovanför rutinernas innehållsfält",
      "Bulk-taggning – markera flera rutiner och lägg till samma tagg på alla samtidigt",
      "Återställ en tidigare version av en rutin direkt från versionshistoriken",
      "Adminpanelen: systemstatus-översikt, sökbar/filtrerbar ändringslogg, konfigurerbar auto-utloggningstid och möjlighet att tvinga utloggning av en användare",
      "Tydlig banner när appen tappar internetanslutningen",
      "Varning vid skapande av en kontakt/länk med samma namn som en befintlig",
    ],
  },
  {
    version: "5.3.5",
    datum: "2026-07-14",
    andringar: [
      "Klinikstöd-sökningen är tillfälligt pausad – vi kunde inte få den att pålitligt hålla sig till enbart godkända medicinska källor, och vill hellre stänga av den än riskera opålitliga svar",
    ],
  },
  {
    version: "5.3.4",
    datum: "2026-07-14",
    andringar: [
      "Fix: klinikstöd-sökningen blockerade felaktigt alla svar – källänkarna löses nu upp till sin riktiga webbadress innan de kontrolleras mot de godkända källorna",
    ],
  },
  {
    version: "5.3.3",
    datum: "2026-07-14",
    andringar: [
      "Klinikstöd-sökningen instrueras nu att söka med site:-begränsning mot varje godkänd källa, och gör ett andra försök med skarpare instruktion om första svaret hänvisade till fel källor",
      "Om ett svar ändå blockeras visas nu vilka källor det faktiskt försökte använda",
    ],
  },
  {
    version: "5.3.2",
    datum: "2026-07-14",
    andringar: [
      "Klinikstöd-sökningen försöker nu automatiskt igen om Gemini svarar att den är tillfälligt överbelastad, med ett tydligare felmeddelande om det ändå inte går",
    ],
  },
  {
    version: "5.3.1",
    datum: "2026-07-14",
    andringar: ["Fix: klinikstöd-sökningen misslyckades alltid – bytt sökmetod under huven"],
  },
  {
    version: "5.3.0",
    datum: "2026-07-14",
    andringar: [
      "Skydd mot att personnummer sparas i rutiner, kommentarer, anteckningar, skiftrapporter och feedback – sparning blockeras om ett personnummer upptäcks",
      "Extra varning (ej blockering) om en text verkar innehålla ett namn – kontrollera alltid att det inte gäller en patient",
      "Ny klinikstöd-sökning under Kliniskt stöd: ställ en generell fråga om sjukdomstillstånd/läkemedel, får ett källhänvisat svar hämtat live från internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS vårdpersonal och Läkemedelsverket",
    ],
  },
  {
    version: "5.2.0",
    datum: "2026-07-13",
    andringar: [
      "Rutinkort visar nu vilka som INTE kvitterat läsning ännu, inte bara vilka som gjort det",
      "Ny QR-kod-knapp på rutiner för att skriva ut och sätta upp fysiskt, länkar direkt till rutinen",
      "Ny 'Mina uppgifter' på startsidan – samlad lista över utkast att godkänna, rutiner att granska och olästa notiser",
      "Versionshistorik visar nu en visuell jämförelse (vad som lagts till/tagits bort) mot nuvarande version",
      "Tryck på \"/\" var som helst på startsidan för att hoppa direkt till sökfältet",
      "Rutiner kan nu få ett giltighetsdatum – om ett foto som laddas upp innehåller ett sådant datum fylls det i automatiskt, och rutinen döljs automatiskt för personal (men inte för redaktörer) när datumet passerat",
    ],
  },
  {
    version: "5.1.0",
    datum: "2026-07-13",
    andringar: [
      "Mörkt läge – välj ljust, mörkt eller följ systemet under Min profil",
      "Kontakter och länkbibliotek är nu sökbara direkt från startsidans sökfält",
      "Sökträffar visar nu vilken del av titeln som matchade din sökning",
      "Rutiner kan taggas med nyckelord och filtreras per tagg",
      "Nya rutiner kan utgå från en mall (t.ex. Behandlingsrutin, Checklista, Larmrutin)",
      "Kommentarer på rutiner kan nu besvaras i trådar",
      "Sektionsledare/VEC/förrådsansvarig ser nu statistik för sitt eget område i adminpanelen",
      "Sökningar utan träffar visas nu även som en trend över tid i adminpanelen",
      "Förbättrad kontrast i texten för bättre läsbarhet",
      "Notisklockan och sökresultaten går nu att styra med tangentbordet (Escape, piltangenter)",
    ],
  },
  {
    version: "5.0.0",
    datum: "2026-07-07",
    andringar: [
      "Ny kontaktlista (/kontakter) med telefonnummer till viktiga funktioner – numren visas som text, ingen ring-knapp",
      "Nytt länkbibliotek (/lankbibliotek) för externa och interna länkar, sorterat per kategori",
      "Rutiner visar nu vem som godkänt/granskat dem och när (signatur)",
      "Rutiner kan länkas ihop som \"relaterade\" och få ett källor/referenser-fält",
      "Ny notisklocka i sidhuvudet – se nya anslag och rutiner sedan ditt senaste besök",
      "Privata anteckningar på en rutin – bara du ser dina egna anteckningar",
      "Ny papperskorg (/papperskorg) – borttaget innehåll kan återställas istället för att försvinna direkt",
      "Tvåfaktorsautentisering (engångskod via autentiseringsapp) kan aktiveras på profilsidan",
      "Hela det grafiska utseendet har setts över: enhetligare färger, mjukare skuggor och tydligare knappar/navigering",
    ],
  },
  {
    version: "4.1.0",
    datum: "2026-07-07",
    andringar: [
      "Sökningen hittar nu även riktiga rutiner i Kliniskt stöd och Administration, inte bara förråd",
      "Ny skiftrapport för praktisk drift-info mellan skift (t.ex. \"slut på sutur-set\") – aldrig patientinformation",
      "Bulk-godkänn/neka av utkast-rutiner, samma som redan fanns för förrådsartiklar",
      "Anslag kan nu markeras som \"Viktigt\" med tydlig visuell varning",
      "Ny statistik i adminpanelen: mest aktiva användare och mest kvitterade rutiner",
      "Skriv ut eller spara en enskild rutin som PDF direkt från rutinkortet",
      "Rutiner stödjer nu flera bilagor (bilder och PDF), inte bara en bild",
      "Ny profilsida: byt lösenord och se dina favoriter samlat",
      "Automatisk utloggning efter inaktivitet, med varning innan – för delade datorer/surfplattor",
    ],
  },
  {
    version: "4.0.0",
    datum: "2026-07-03",
    andringar: [
      "Ny anslagstavla där ledningen kan lägga upp meddelanden till all personal",
      "Kommentarer på rutiner – ställ frågor direkt på en rutin",
      "Läskvittering – markera att du läst och förstått en rutin",
      "Favoriter – stjärnmärk rutiner och förrådsartiklar för snabb åtkomst",
      "Ny sektion på hemsidan: dina favoriter och de mest använda rutinerna",
      "Sökningar utan träffar loggas nu så att ledningen ser vilket innehåll som saknas",
      "Appen fungerar bättre vid dåligt nät genom lokal cachning",
      "Rutiner flaggas för granskning efter en tid och kan markeras som granskade",
      "Versionshistorik på rutiner – se och jämför tidigare ändringar",
      "Ändringslogg i adminpanelen – se vem som gjort vad",
      "Rutinernas innehåll stödjer nu enkel textformatering (rubriker, punktlistor, fetstil)",
      "Ny feedback-funktion – tipsa eller rapportera problem direkt till superadmin",
      "Ny hjälpsida med vanliga frågor och svar",
      "Den här sidan – se vad som ändrats i varje uppdatering",
    ],
  },
  {
    version: "3.2.0",
    datum: "2026-06-27",
    andringar: [
      "Mer tillförlitlig batch-uppladdning av foton på mobil",
      "AI-tolkning av förrådslistor genererar nu synonymer, så en sökning på t.ex. \"KAD\" hittar rätt artikel även om den heter något annat",
    ],
  },
  {
    version: "3.1.0",
    datum: "2026-06-20",
    andringar: [
      "Logistik delas nu upp i sex namngivna förråd med skåp- och hyllangivelse",
      "Fota en inventarielista eller en hylla – AI:n skapar sökbara förrådsartiklar automatiskt",
    ],
  },
  {
    version: "3.0.0",
    datum: "2026-06-20",
    andringar: [
      "Ny funktion: fota en whiteboard, ett papper eller en anteckning – Gemini AI tolkar innehållet och skapar ett utkast automatiskt",
      "Utkast måste alltid granskas och godkännas innan de publiceras",
      "Adminpanelen visar och styr budgeten för AI-tolkning",
    ],
  },
  {
    version: "2.0.0",
    datum: "2026-06-20",
    andringar: [
      "Adminpanel för att hantera användarroller",
      "Möjlighet att skapa, redigera och godkänna rutiner med bilder",
    ],
  },
  {
    version: "1.0.0",
    datum: "2026-06-20",
    andringar: [
      "Första versionen av Synappsen: inloggning, sökning och de tre huvudsektionerna Kliniskt stöd, Logistik och Administration",
      "Fungerar som installerbar app (PWA)",
    ],
  },
];
