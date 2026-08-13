// Användarvänd ändringslogg, visas på sidan "Nyheter" (/nyheter).
// Nyast först. Lägg till en ny post högst upp varje gång en release görs.
// Håll texterna korta och begripliga för slutanvändare (inga filnamn/tekniska detaljer).
//
// Etapp 45e: vid en release som UTESLUTANDE är CSS/UI-polish utan ny funktion (t.ex. ren
// scoping-/densitets-/kontrastjustering) – led med EN sammanfattande, användarvänd rad om
// VAD som känns annorlunda ("Nytt utseende i hela appen – tätare listor, samlad
// godkännandekö, Akut-knappen alltid nåbar") snarare än att bara lista tekniska delfixar
// rad för rad. En medarbetare som läser /nyheter bryr sig om vad hon möter, inte vilken CSS-
// klass som scopades om. Gäller FRAMÅT – ingen retroaktiv omskrivning av redan publicerade
// poster, ändringsloggen är en logg, inte ett levande dokument som redigeras i efterhand.
export const ANDRINGSLOGG = [
  {
    version: "5.102.0",
    datum: "2026-08-13",
    andringar: [
      "Ny funktion: Öva – ett kort övningspass med slumpade frågor från flera rutiner i följd, hittas under 'Mer' eller genom att söka på 'Öva'. Inget svar sparas eller syns för någon annan, det är bara till för dig",
    ],
  },
  {
    version: "5.101.0",
    datum: "2026-08-13",
    andringar: [
      "Sökningen förstår nu fler av vårdens vanliga förkortningar och synonymer – en sökning på till exempel 'PVK' hittar även innehåll som bara skriver 'perifer venkateter', och tvärtom",
    ],
  },
  {
    version: "5.100.0",
    datum: "2026-08-13",
    andringar: [
      "Ny funktion: en rutin du redan kvitterat visar nu en tydlig markering om innehållet ändrats på ett viktigt sätt sedan du läste den – klicka för att se exakt vad som lagts till eller tagits bort, utan att behöva läsa om hela texten",
    ],
  },
  {
    version: "5.99.0",
    datum: "2026-08-13",
    andringar: [
      "Ny funktion: lyssna på en rutin eller ett checklistesteg istället för att läsa den – en högtalarknapp läser texten högt på svenska direkt i webbläsaren (finns på rutinkort och i checklistläget)",
    ],
  },
  {
    version: "5.98.0",
    datum: "2026-08-11",
    andringar: [
      "Bred säkerhets- och kvalitetsgenomgång: bättre skydd av dina data vid delad dator (rensas nu ordentligt vid utloggning), tydligare felmeddelanden i formulär och adminpanelen istället för att sparningar tystnar, och flera förbättringar för tangentbordsnavigering och skärmläsare (bland annat i snabbsöket)",
    ],
  },
  {
    version: "5.97.0",
    datum: "2026-08-11",
    andringar: [
      "Ny struktur för ett framtida 'baspaket' av nationella referenser börjar byggas – ännu inget innehåll eller synligt för någon kund, bara ett internt arbetsverktyg för leverantören under juridisk granskning",
    ],
  },
  {
    version: "5.96.0",
    datum: "2026-08-11",
    andringar: [
      "Skapa en rutin direkt från en sökning som inte gav träff, med sökordet redan ifyllt",
      "Ny 'Veckopuls' i adminpanelen – de mest angelägna sakerna att göra just nu, samlade på ett ställe",
      "Innehållshälsan går nu att åtgärda direkt: tilldela ägare eller starta en granskningsrunda utan att lämna listan",
    ],
  },
  {
    version: "5.95.0",
    datum: "2026-08-10",
    andringar: [
      "Städning under huven, ingen synlig ändring",
    ],
  },
  {
    version: "5.94.0",
    datum: "2026-08-10",
    andringar: [
      "Ytterligare snabbare sidladdning för organisationer med många rutiner",
    ],
  },
  {
    version: "5.93.0",
    datum: "2026-08-10",
    andringar: [
      "Snabbare sidladdning för organisationer med många rutiner",
    ],
  },
  {
    version: "5.92.0",
    datum: "2026-08-10",
    andringar: [
      "Kioskläget kräver nu Operations-modulen precis som resten av det paketet – syns bara som ett tillval om er organisation har den",
      "Städat bort ett fåtal startmallar för Logistik som av misstag inte gick att läsa i appen",
      "Säkerhetsuppdateringar under huven (ingen synlig ändring)",
    ],
  },
  {
    version: "5.91.0",
    datum: "2026-08-10",
    andringar: [
      "Nytt kioskläge för en delad enhet (t.ex. en surfplatta i förrådet eller akutrummet) – ett eget kontotyp som kan läsa godkänt innehåll, söka och köra checklistor, men aldrig kvittera, kommentera eller skriva något i en persons namn. Låses upp med en PIN-kod, återgår automatiskt till startsidan efter en kort stunds inaktivitet",
    ],
  },
  {
    version: "5.90.0",
    datum: "2026-08-10",
    andringar: [
      "Mycket mer startinnehåll för en nyetablerad organisation – fler rutinmallar per verksamhetstyp (nu även för Logistik och Administration, inte bara Kliniskt stöd), samt ett startförslag för förråd, kontakter, ett introduktionsspår och ett kompetenskrav",
      "'Kom igång'-checklistan på startsidan visar nu verkligt läge – varje steg bockas av automatiskt när handlingen faktiskt utförs, inte längre en egen kryssruta",
    ],
  },
  {
    version: "5.89.0",
    datum: "2026-08-10",
    andringar: [
      "Leverantörsvyn kan nu gruppera flera organisationer under samma huvudman (t.ex. flera enheter på samma sjukhus) – ren visning, ingen ändring av hur data isoleras mellan organisationer",
    ],
  },
  {
    version: "5.88.0",
    datum: "2026-08-10",
    andringar: [
      "Superadmin får nu en kort månadssammanfattning via e-post (kvitteringsgrad, innehållshälsa, obesvarade ändringsförslag) med länk till ledningsrapporten – går att stänga av i profilen",
    ],
  },
  {
    version: "5.87.0",
    datum: "2026-08-10",
    andringar: [
      "Ny inställning i profilen: e-postpåminnelser om ett anslag eller ändringsförslag som väntar på dig, sammanslaget till högst ett mejl per dag – går att stänga av",
    ],
  },
  {
    version: "5.86.0",
    datum: "2026-08-10",
    andringar: [
      "Inbjudningar skickas nu direkt till e-postadressen, inte bara som en länk att kopiera – den kopierbara länken finns kvar som reserv",
    ],
  },
  {
    version: "5.85.0",
    datum: "2026-08-10",
    andringar: [
      "Ny infrastruktur för utgående e-post börjar byggas – ännu inget skickas till någon användare, men leverantören kan nu se och stänga av kanalen globalt från leverantörsvyn",
    ],
  },
  {
    version: "5.84.0",
    datum: "2026-08-09",
    andringar: [
      "Leverantörsvyn har fått en ärendehistorik per organisation ('vad hände, när, vad gjordes') och en ny demo-/övningsmiljö som kan bjudas in till på begäran",
    ],
  },
  {
    version: "5.83.0",
    datum: "2026-08-09",
    andringar: [
      "Ny funktion i adminpanelen: bevilja leverantören tillfällig, 6-timmars läsåtkomst till organisationens innehåll för att lösa en supportfråga – syns hela tiden den är aktiv, går att avsluta när som helst",
    ],
  },
  {
    version: "5.82.0",
    datum: "2026-08-09",
    andringar: [
      "Leverantörsvyn har fått en ny 'Diagnostik'-knapp per organisation – strukturell hälsa (antal dokument, senaste händelse, backupstatus) utan att någonsin visa kundens faktiska innehåll",
    ],
  },
  {
    version: "5.81.0",
    datum: "2026-08-08",
    andringar: [
      "Superadmin kan nu begära permanent radering av sin organisation direkt i appen – med en 48-timmars ångerfrist innan något faktiskt raderas",
    ],
  },
  {
    version: "5.80.0",
    datum: "2026-08-06",
    andringar: [
      "Organisationers backup och dataexport täcker nu betydligt mer – bl.a. kompetenskrav, checklistkörningar, bristanmälningar och introduktionsspår, som tidigare saknades helt",
    ],
  },
  {
    version: "5.79.0",
    datum: "2026-08-06",
    andringar: [
      "En enskild organisation kan inte längre förbruka hela den delade sökkvoten för klinikstöd själv – konfigurerbart tak per organisation, förvalt till hälften av dygnskvoten",
    ],
  },
  {
    version: "5.78.0",
    datum: "2026-08-06",
    andringar: [
      "Leverantörsvyn: nytt fält 'Avtalat pris (kr/år)' per organisation, visat bredvid den kända AI-kostnaden",
    ],
  },
  {
    version: "5.77.0",
    datum: "2026-08-06",
    andringar: [
      "Leverantörsvyn visar nu den delade sökkvoten för klinikstöd (dagsförbrukning mot tak, totalt och per organisation) med en tydlig varning innan taket nås",
    ],
  },
  {
    version: "5.76.0",
    datum: "2026-08-04",
    andringar: [
      "Rutinformuläret föreslår nu automatiskt relaterade rutiner som delar en tagg med den du redigerar",
      "'Sedan ditt förra pass' visar nu även väsentligt uppdaterade rutiner, inte bara helt nya",
    ],
  },
  {
    version: "5.75.0",
    datum: "2026-08-04",
    andringar: [
      "Ny sektion i adminpanelen: 'Incidentberedskap' (superadmin) – visar revisionsloggens senaste automatiska kontroll och senaste backup, utan att behöva leta i Firebase-konsolen",
    ],
  },
  {
    version: "5.74.0",
    datum: "2026-08-04",
    andringar: [
      "Fixat: den flytande Akut-knappen och navigeringen var svårare att hitta med skärmläsare än de borde vara",
      "Fixat: 'Mer'-menyn i mobilnavet stängs nu med Esc och håller kvar tangentbordsfokus korrekt",
      "Fixat: inloggnings- och registreringssidorna, samt akutläget och checklistläget, saknade en tydlig sidstruktur för skärmläsare",
      "Mindre fixar av rubrikordning på Logistik, Kompetensmatris och Papperskorg",
    ],
  },
  {
    version: "5.73.0",
    datum: "2026-08-04",
    andringar: [
      "Ny uppmaning att installera Synappsen på hemskärmen (Android/Chrome/Desktop samt en instruktion för iPhone)",
      "En ny version av appen laddas nu bara om du själv väljer det, istället för att göra det utan förvarning",
      "Fixat: appikonen på hemskärmen kunde bli fel på iPhone",
      "Mindre polish: appen känns nu mer som en riktig app vid touch (ingen gummistuds vid rullning)",
    ],
  },
  {
    version: "5.72.0",
    datum: "2026-08-03",
    andringar: [
      "Fixat: Leverantörsvyn kunde krascha vid vissa nätverksfel istället för att visa ett felmeddelande",
    ],
  },
  {
    version: "5.71.0",
    datum: "2026-08-03",
    andringar: [
      "Adminpanelens ~26 sektioner går nu att fälla ihop och ut var för sig, istället för att alla visas i en enda lång lista",
    ],
  },
  {
    version: "5.70.0",
    datum: "2026-08-03",
    andringar: [
      "Fixat: en fristående knapp i checklisteläget ('checka av'-vyn) kunde tidigare bli felaktigt stor",
    ],
  },
  {
    version: "5.69.0",
    datum: "2026-08-03",
    andringar: [
      "Startsidans genvägsrad visar nu bara de fyra vanligaste länkarna direkt, med en \"Fler\"-knapp för resten – mindre skrollning innan sökfältet syns",
    ],
  },
  {
    version: "5.68.0",
    datum: "2026-08-03",
    andringar: [
      "Inloggnings- och registreringssidan har nu ett tydligare, upphöjt kort istället för att flyta fritt mot bakgrunden",
      "Nedrullningsbara listor (t.ex. i Introduktion) har nu samma utseende som appens övriga fält",
    ],
  },
  {
    version: "5.67.0",
    datum: "2026-08-03",
    andringar: [
      "Nedre navigeringen är nu tydligare på smala skärmar – de fyra vanligaste sidorna syns direkt, resten samlas i en ny \"Mer\"-meny",
      "Fixat: innehåll längst ner på en sida kunde tidigare hamna bakom nedre navigeringen på mobil",
    ],
  },
  {
    version: "5.66.0",
    datum: "2026-08-02",
    andringar: [
      "Startsidan visar nu en tydlig banderoll när något väntar på din granskning, med en genväg dit",
      "\"Senast besökta\" och \"Mest använda\" visas nu sida vid sida på startsidan",
    ],
  },
  {
    version: "5.65.0",
    datum: "2026-08-02",
    andringar: [
      "Ny samlad sida \"Godkännanden\" för redaktörer – allt som väntar på granskning, oavsett område, samlat på en skärm",
      "Nyheter finns nu som en egen flik i navigeringen",
      "Akutläges-knappen är nu synlig på alla sidor, inte bara på startsidan",
      "I Kliniskt stöd/Administration kan man nu markera flera utkast och godkänna eller ta bort dem tillsammans",
    ],
  },
  {
    version: "5.64.0",
    datum: "2026-08-02",
    andringar: [
      "Nyhetssidan visar nu \"Ni sa, vi gjorde\" – en lista över ändringsförslag från personalen som faktiskt införts",
      "Ny frivillig \"Veckans repetition\" på startsidan – en kort fråga om en rutin du kvitterade för länge sedan, inget svar sparas",
      "Förrådsartiklar kan nu ha ett foto på hyllplatsen, inte bara på artikeln själv",
    ],
  },
  {
    version: "5.63.0",
    datum: "2026-08-02",
    andringar: [
      "Ny anonym \"Personalpuls\" på startsidan – tre snabba frågor per kvartal, inget enskilt svar sparas, bara ett sammanlagt resultat per område för VÖL/VEC",
      "Superadmin kan generera ett anonymiserat referensunderlag för säljmaterial från ledningsrapporten",
    ],
  },
  {
    version: "5.62.0",
    datum: "2026-08-02",
    andringar: [
      "Ledningsrapporten visar nu en veckovis trend för kvitteringsgrad, sökträffar och innehållshälsa, istället för bara dagens värde",
      "Superadmin kan markera ett datum (t.ex. en genomförd åtgärd) i trenden för att se förändringen omkring det",
    ],
  },
  {
    version: "5.61.0",
    datum: "2026-08-01",
    andringar: [
      "Nu syns status på dina ändringsförslag (väntar/godkänt/avvisat) direkt på startsidan, och redaktörer ser en samlad kö med alla väntande utkast och förslag",
      "Redaktörer kan visa exakt vad ett ändringsförslag skulle ändra innan de öppnar det, och infoga färdiga textmallar (varning, kontakt, materiallista) när de skriver en rutin",
    ],
  },
  {
    version: "5.60.0",
    datum: "2026-08-01",
    andringar: [
      "Rutiner kan nu markeras \"gäller inte längre\" (arkiverad) istället för att bara tas bort – syns fortfarande i sökningen men kräver ingen kvittering",
    ],
  },
  {
    version: "5.59.0",
    datum: "2026-08-01",
    andringar: [
      "Pilot i Kliniskt stöd: appen kan nu flagga rutiner som verkar likna varandra misstänkt mycket, som en fråga till redaktören – inget slås ihop automatiskt",
    ],
  },
  {
    version: "5.58.0",
    datum: "2026-08-01",
    andringar: [
      "Nytt för superadmin: starta en riktad granskningsrunda för äldre rutiner i ett område, med deadline och automatisk påminnelse till ägaren",
    ],
  },
  {
    version: "5.57.0",
    datum: "2026-08-01",
    andringar: [
      "Ny innehållshälsopanel i administrationen: se på en gång vilka rutiner som är gamla, saknar ägare eller aldrig kvitterats av någon",
    ],
  },
  {
    version: "5.56.0",
    datum: "2026-08-01",
    andringar: [
      "Gamla säkerhetskopior rensas nu bort automatiskt efter 90 dagar, i stället för att sparas för alltid",
    ],
  },
  {
    version: "5.55.0",
    datum: "2026-08-01",
    andringar: [
      "Stärkt säkerhet under huven: striktare gränser för filuppladdningar och extra skyddande webbläsarinställningar",
    ],
  },
  {
    version: "5.54.0",
    datum: "2026-07-31",
    andringar: [
      "Backuper kan nu återställas vid dataförlust, inte bara tas – testat och verifierat end-to-end",
    ],
  },
  {
    version: "5.53.0",
    datum: "2026-07-31",
    andringar: [
      "Vi upptäcker nu automatiskt om en organisations AI-budget snabbt håller på att ta slut, istället för att bara stoppa tolkningen tyst när taket är nått",
    ],
  },
  {
    version: "5.52.0",
    datum: "2026-07-31",
    andringar: [
      "Bättre spårbarhet i administrationen: ändringar av roller, moduler och säkerhetsinställningar registreras nu alltid",
      "En automatisk kontroll varje natt kontrollerar att revisionsloggen inte har manipulerats",
    ],
  },
  {
    version: "5.51.0",
    datum: "2026-07-31",
    andringar: [
      "Vi upptäcker nu automatiskt om något tekniskt hindrar dig från att se innehåll du borde få se, istället för att det bara syns som en tom sida",
    ],
  },
  {
    version: "5.50.0",
    datum: "2026-07-31",
    andringar: [
      "Viktig rättning: personal-rollen kunde av ett tekniskt fel inte se rutiner, förrådsartiklar eller akutläget – nu synligt igen som väntat",
      "Automatiska tester som varnar oss om samma typ av fel skulle uppstå igen i framtiden",
    ],
  },
  {
    version: "5.49.0",
    datum: "2026-07-30",
    andringar: [
      "Offline-centret laddar nu även ner kontakter och förrådsartiklar, inte bara rutiner – och bilder på rutiner går att ladda ner separat för den som vill",
      "Ser tydligt vad som finns tillgängligt offline och hur gammalt det är när nätet försvinner",
      "Läskvittering och bristanmälning gjorda utan internetanslutning skickas nu automatiskt så fort täckningen är tillbaka, med en tydlig \"väntar på att skickas\"-status",
      "Snabbare start av appen och en tydligare fokusmarkering på alla knappar för dig som navigerar med tangentbord",
    ],
  },
  {
    version: "5.48.0",
    datum: "2026-07-30",
    andringar: [
      "Superadmin kan nu lägga in sin verksamhets egen logotyp, en accentfärg och en kort välkomsttext under Admin → Vår profil",
      "Accentfärgen kontrolleras automatiskt för tillräcklig kontrast innan den sparas, så appen alltid går att läsa – akutläget behåller alltid sin egen färgsättning",
    ],
  },
  {
    version: "5.47.0",
    datum: "2026-07-29",
    andringar: [
      "Nytt i Logistik: skanna en QR-kod med kameran för att komma direkt till rätt hylla eller artikel",
      "Skriv ut QR-etiketter att sätta upp i skåp och på hyllor – skanna hyllan för att se vad som ska stå där",
      "Förrådsartiklar visar nu en tydlig väg till platsen (Förråd → Skåp → Hylla) istället för en textrad",
    ],
  },
  {
    version: "5.46.0",
    datum: "2026-07-29",
    andringar: [
      "Nytt: föreslå en ändring direkt i en rutin – markera text eller skriv fritt, och skicka in ett konkret förslag till den som ansvarar för området",
      "Redaktörer ser nu inkomna förslag i en egen lista och kan föra in dem i rutinen eller avvisa med en motivering",
      "Den som föreslog en ändring får en notis när förslaget är hanterat, och rutinen visar en kort kredit när ett förslag har förts in",
    ],
  },
  {
    version: "5.45.3",
    datum: "2026-07-28",
    andringar: [
      "Mörkt läge har fått en djupare, mer avslappnad mörk bakgrund, och ljust läge en aning svalare ton",
      "Bytt namn på \"Admin\" i bottennavigeringen (den för policys/anslag/regelverk heter nu \"Regler\") så det inte längre finns två menyval med samma namn",
    ],
  },
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
