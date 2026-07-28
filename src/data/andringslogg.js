// Användarvänd ändringslogg, visas på sidan "Nyheter" (/nyheter).
// Nyast först. Lägg till en ny post högst upp varje gång en release görs.
// Håll texterna korta och begripliga för slutanvändare (inga filnamn/tekniska detaljer).
export const ANDRINGSLOGG = [
  {
    version: "5.45.0",
    datum: "2026-07-28",
    andringar: [
      "Tydligare färgsystem: områdesmärkningar (Kliniskt stöd/Logistik/Administration) och statusmärkningar (väntar på godkännande/godkänd/avvisad) har nu helt egna färger, så de aldrig kan förväxlas med varandra i sökresultat eller notiser",
      "\"Väntar på godkännande\" visas nu tydligt med en timglasikon på rutiner och förrådsartiklar",
      "Konsekvent datumformat och sökfältstext överallt i appen",
    ],
  },
  {
    version: "5.44.0",
    datum: "2026-07-28",
    andringar: [
      "Ny startsida-widget och sida \"Sedan ditt förra pass\": se på ett ställe vad som hänt (nya anslag, rutiner och skiftrapporter) sedan du senast var inloggad, och kvittera läsning direkt i listan",
    ],
  },
  {
    version: "5.43.0",
    datum: "2026-07-28",
    andringar: [
      "Push-notiser: få en påminnelse på din enhet om nya rutiner, ett anslag som väntar på kvittering, en bristanmälan eller en källvarning – helt valfritt och avstängt som standard, slås på i Profil",
      "Vägledning för att lägga till appen på hemskärmen (krävs för push på iPhone/iPad)",
    ],
  },
  {
    version: "5.42.0",
    datum: "2026-07-28",
    andringar: [
      "Ny kommandopalett (Ctrl/Cmd+K, eller \"/\", eller sök-knappen längst ner på mobil): sök eller kör en åtgärd direkt, från vilken sida som helst i appen",
    ],
  },
  {
    version: "5.41.0",
    datum: "2026-07-28",
    andringar: [
      "Telefonnummer i kontakter och akutläget är nu klickbara och ringer upp direkt",
      "Möjligt att lägga till en bild per steg i en checklista",
      "Valfri profilbild och accentfärg i Profil",
    ],
  },
  {
    version: "5.40.0",
    datum: "2026-07-28",
    andringar: [
      "Ditt eget namn visas nu istället för e-postadressen vid kvitteringar, godkännanden och i profilen",
    ],
  },
  {
    version: "5.26.0",
    datum: "2026-07-27",
    andringar: [
      "Ny granskningsbar revisionslogg för superadmin i adminpanelen: filtrera på datum, aktör och händelsetyp, exportera som CSV eller JSON, och verifiera att inget i loggen har manipulerats",
    ],
  },
  {
    version: "5.25.1",
    datum: "2026-07-26",
    andringar: [
      "Fyra tillgänglighetsförbättringar för tangentbords- och skärmläsaranvändare: en \"hoppa till innehåll\"-länk, sidtitlar som ändras vid navigering, en tydligare bekräftelsedialog (går att stänga med Esc) och en tydligare rollväljare i adminpanelen",
    ],
  },
  {
    version: "5.25.0",
    datum: "2026-07-26",
    andringar: [
      "Oväntade fel rapporteras nu automatiskt till ett internt felövervakningsverktyg, så driftstörningar kan upptäckas och åtgärdas snabbare",
    ],
  },
  {
    version: "5.24.0",
    datum: "2026-07-26",
    andringar: [
      "Ny mätning: tiden från att en sökning påbörjas till att man klickar på ett resultat visas nu i adminpanelen och ledningsrapporten (\"tid-att-hitta\")",
    ],
  },
  {
    version: "5.23.0",
    datum: "2026-07-26",
    andringar: [
      "Leverantörsvyn kan nu skapa en ny organisation med ett valfritt startbibliotek av rutinmallar (akutmottagning, vårdcentral, kommunal hemtjänst) – en ny kund möts inte av en helt tom app",
    ],
  },
  {
    version: "5.22.0",
    datum: "2026-07-26",
    andringar: [
      "Ny ledningsrapport: en samlad, utskriftsvänlig sammanfattning av kvitteringsgrad, rutiner som bör granskas, klinikstöd-nytta och sökträffar – går att exportera som PDF direkt från sidan",
    ],
  },
  {
    version: "5.21.0",
    datum: "2026-07-26",
    andringar: [
      "Ladda upp-sidan stödjer nu att importera en hel mapp med bilder på en gång (skrivbordsläget)",
      "Nytolkade utkast kan nu godkännas eller tas bort direkt på Ladda upp-sidan, inklusive en \"godkänn alla klara\"-knapp – slipper navigera till varje område för att granska",
    ],
  },
  {
    version: "5.20.0",
    datum: "2026-07-25",
    andringar: [
      "Interna kvalitetsförbättringar: adminpanelens kod är omstrukturerad för enklare underhåll, ingen synlig ändring i appen",
    ],
  },
  {
    version: "5.19.0",
    datum: "2026-07-25",
    andringar: [
      "Interna kvalitetsförbättringar: fler automatiska tester bakom kulisserna, ingen synlig ändring i appen",
    ],
  },
  {
    version: "5.18.0",
    datum: "2026-07-25",
    andringar: [
      "Bekräftelserutor (t.ex. \"radera permanent?\") och meddelanden visas nu i appens egen stil istället för webbläsarens inbyggda rutor",
    ],
  },
  {
    version: "5.17.0",
    datum: "2026-07-25",
    andringar: [
      "Registrering kräver nu en inbjudan från en superadmin – den tidigare öppna sidan för att skapa konto själv är stängd",
      "Superadmin kan bjuda in nya kollegor direkt från adminpanelen, med vald roll och en tidsbegränsad länk",
      "Ny leverantörsvy för att administrera flera kundorganisationer: skapa nya, se användare/kostnad, pausa eller exportera",
      "En pausad organisations konton kan tillfälligt spärras från sitt innehåll, utan att organisationen eller dess data raderas",
    ],
  },
  {
    version: "5.16.0",
    datum: "2026-07-25",
    andringar: [
      "Klinikstöd-sökningen är nu en del av Intelligence-modulen på samma sätt som AI-import – organisationer utan modulen ser en tydlig förklaring istället för sökrutan",
      "Ägarpåminnelser om rutingranskning visas nu bara för organisationer som har Operations-modulen",
      "Ett nytt hastighetstak skyddar klinikstöd-sökningen mot att en enskild felaktig upprepning förbrukar hela den delade sökkvoten",
      "Driftuppdatering: Cloud Functions körs nu på en nyare, stödd Node.js-version",
    ],
  },
  {
    version: "5.15.1",
    datum: "2026-07-25",
    andringar: [
      "Fixat: \"senast nedladdad för offline\"-tiden visade fel person på delade datorer – visar nu rätt tid för den som faktiskt är inloggad",
      "En trasig sida kraschar inte längre hela appen – visar nu ett enkelt felmeddelande med möjlighet att ladda om",
    ],
  },
  {
    version: "5.15.0",
    datum: "2026-07-25",
    andringar: [
      "Adminpanelen visar nu klinikstödets hjälpsamhetsgrad per vecka, så en förändring över tid syns – inte bara ett totalvärde",
      "Ny kostnadsuppföljning för AI-användning – varje avslutad månads kostnad sparas nu så en trend syns över tid",
    ],
  },
  {
    version: "5.14.0",
    datum: "2026-07-25",
    andringar: [
      "Säkerhetsgenomgång av multi-tenant-grunden, en tidigare känd (och avgränsad) lucka i bilduppladdningen är nu täppt",
      "Adminpanelen har en ny sektion med mätvärden inför pilotdrift: andel nollträffar i sökningen, kvitteringsgrad och upplevd nytta från klinikstöd-sökningen",
    ],
  },
  {
    version: "5.13.0",
    datum: "2026-07-25",
    andringar: [
      "Nytt Offline-center på startsidan – ladda ner alla godkända rutiner så de går att läsa även utan internet",
      "Veckovis säkerhetskopiering av innehållet införd (körs automatiskt i bakgrunden)",
      "Adminpanelen sparar nu historik från \"Testa anslutningar\" och den dagliga klinikstöd-kontrollen, så trender syns över tid istället för bara senaste körningen",
      "Superadmin kan nu kräva tvåfaktorsautentisering för valda roller – den som saknar det påminns i appen och blockeras från att ändra roller/organisationsinställningar tills det aktiverats",
    ],
  },
  {
    version: "5.12.0",
    datum: "2026-07-25",
    andringar: [
      "Grunden lagd för att slå på/av hela funktionsgrupper (moduler) per organisation, med en ny sektion i adminpanelen för superadmin",
      "AI-import (fotografering/tolkning av dokument och förrådsartiklar) är först ut och kan nu stängas av per organisation – visar en tydlig förklaring istället för att bara dölja knappen",
    ],
  },
  {
    version: "5.11.1",
    datum: "2026-07-25",
    andringar: [
      "Fixat: dina privata anteckningar på en rutin kunde ibland fastna i \"laddar\" första gången du öppnade rutinen, innan du skrivit något",
    ],
  },
  {
    version: "5.11.0",
    datum: "2026-07-24",
    andringar: [
      "Grunden lagd för att flera kunder/organisationer ska kunna använda samma installation utan att någonsin se varandras data",
      "All befintlig data hör nu till en organisation, och en ny adminfunktion kan (med förhandsgranskning innan något sparas) förbereda befintlig data för detta",
      "AI-budgeten (för klinikstöd och dokumentimport) räknas nu per organisation istället för gemensamt",
      "Bakomliggande säkerhetsregler skärpta och verifierade med automatiska tester som bevisar att data i en organisation aldrig kan nås från en annan",
    ],
  },
  {
    version: "5.10.0",
    datum: "2026-07-14",
    andringar: [
      "Granskningspåminnelser riktas nu till en rutins ansvarige (om angiven) istället för alla redaktörer i området",
      "Ny rad i \"Mina uppgifter\" för rutiner du själv är ansvarig för och som snart behöver granskas",
      "Adminpanelen visar nu hur nöjda användare är med klinikstöd-svaren och vilka frågor som ställs mest",
      "Klinikstöd-sökningens källor kontrolleras nu automatiskt varje morgon, med en varning till superadmin om något avviker",
    ],
  },
  {
    version: "5.9.0",
    datum: "2026-07-14",
    andringar: [
      "Rutiner kan nu få en ansvarig person – antingen en roll (alla med den rollen räknas som ansvariga) eller en specifik namngiven person, oavsett roll",
      "Ny verifieringsfunktion i adminpanelen som kör testfrågor genom klinikstöd-sökningen och visar exakt vilka källor den faktiskt hittar",
      "Adminpanelens anslutningstest visar nu grönt/gult/rött (fungerar / långsamt / fungerar inte) istället för bara grönt/rött, och kontrollerar även klinikstöd-källorna",
    ],
  },
  {
    version: "5.8.0",
    datum: "2026-07-14",
    andringar: [
      "Tumme upp/ner på klinikstöd-svar – hjälp oss se om sökningen faktiskt är till nytta",
      "Ny \"Testa anslutningar\"-knapp i adminpanelen som kontrollerar att AI-tjänsterna faktiskt fungerar",
      "Förhandsgranska hur en rutin kommer se ut innan du sparar den",
      "Ny sektion \"Senast besökta\" på startsidan",
      "Snyggare laddningsanimation istället för ren \"Laddar...\"-text",
    ],
  },
  {
    version: "5.7.0",
    datum: "2026-07-14",
    andringar: [
      "Klinikstöd-svar cachas i 7 dagar – vanliga frågor besvaras direkt och kostar ingen budget",
      "Klinikstöd-frågor loggas (anonymt) så ledningen ser vilka kunskapsluckor som efterfrågas mest",
      "Varning vid uppladdning av bilder större än 8 MB",
      "Kvitteringsläget för anslag med deadline kan exporteras som CSV",
      "Adminpanelen visar konton som inte loggat in på 90 dagar",
    ],
  },
  {
    version: "5.6.0",
    datum: "2026-07-14",
    andringar: [
      "Klinikstöd-sökningen är tillbaka! Byggdes om att söka via en riktig domänbegränsad sökmotor istället för att lita på att AI:n själv höll sig till godkända källor",
      "Källorna är nu internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS vårdpersonal, Läkemedelsverket, Vårdhandboken och Folkhälsomyndigheten",
    ],
  },
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
