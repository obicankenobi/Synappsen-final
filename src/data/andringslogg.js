// Användarvänd ändringslogg, visas på sidan "Nyheter" (/nyheter).
// Nyast först. Lägg till en ny post högst upp varje gång en release görs.
// Håll texterna korta och begripliga för slutanvändare (inga filnamn/tekniska detaljer).
export const ANDRINGSLOGG = [
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
