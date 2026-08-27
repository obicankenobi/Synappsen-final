// Baskatalog av återanvändbara kvissfrågor.
//
// BAKGRUND. Mikrokvissen (KvissModal.jsx, Etapp 19b) visas innan en läskvittering räknas.
// Öva-läget (Etapp 65d) och Veckans repetition (Etapp 41b) plockar båda ur samma fält
// (`rutin.kviss`) och kräver `kviss.length > 0` för att visa något alls. Konsekvensen är att
// en ny organisation, som får 8–10 rutinmallar ur startbiblioteket men noll kvissfrågor, har
// TVÅ byggda funktioner som är helt tomma dag ett. Den här katalogen är svaret på det.
//
// DEN AVGÖRANDE AVGRÄNSNINGEN. Startbibliotekets doktrin (functions/verksamhetsmallar.js) är
// att aldrig påstå kliniskt sakinnehåll: mallarna är strukturella skelett, inte färdig
// vägledning. En kvissfråga har till skillnad från en mall ett RÄTT SVAR – den är därför per
// definition ett faktapåstående, och en fråga som "vilken kompressionsfrekvens gäller vid
// HLR?" vore klinisk vägledning oavsett hur den formuleras. Det passerar både
// MDR-gränsdragningen (se granskningar/JURIDISK-GRANSKNING.md) och projektets egen regel om
// att aldrig påstå något som inte är verifierat.
//
// Därför innehåller katalogen ENDAST frågor om hur systemet och processen fungerar – sådant
// som är sant för varje organisation oavsett medicinskt innehåll, och som är verifierat mot
// faktisk kod (se kvissbank.test.js, som binder de mest driftkänsliga svaren till koden).
// Kliniska frågor ska skrivas av verksamheten själv, om den egna godkända rutintexten,
// eventuellt med hjälp av foreslaKvissfragor (functions/ai-import.js) som uttryckligen bara
// får pröva förståelse av text som redan finns.
//
// KRAV 14 gäller här som överallt annars: inga svar sparas någonstans. Katalogen är statisk
// data, den läser och skriver ingenting.

export const KVISS_KATEGORIER = {
  KVITTERING: "kvittering",
  ANSVAR: "ansvar",
  ANVANDNING: "anvandning",
  FARSKHET: "farskhet",
  PATIENTUPPGIFTER: "patientuppgifter",
  MALLAR: "mallar",
};

export const KVISS_KATEGORI_LABEL = {
  [KVISS_KATEGORIER.KVITTERING]: "Läskvittering och godkännande",
  [KVISS_KATEGORIER.ANSVAR]: "Ansvar och ägarskap",
  [KVISS_KATEGORIER.ANVANDNING]: "Hitta och använda",
  [KVISS_KATEGORIER.FARSKHET]: "Innehållets färskhet",
  [KVISS_KATEGORIER.PATIENTUPPGIFTER]: "Patientuppgifter",
  [KVISS_KATEGORIER.MALLAR]: "Mallar och startbibliotek",
};

/**
 * Varje post har samma fält som en rutins egna kvissfrågor (fraga, alternativ, rattIndex,
 * hanvisning) plus `id` och `kategori` som bara används i banken. Använd tillRutinKviss()
 * innan posterna sparas på en rutin.
 */
export const KVISSBANK = [
  // --- Läskvittering och godkännande -------------------------------------------------
  {
    id: "kvittering-innebord",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga: "Vad intygar du när du kvitterar en rutin som läst?",
    alternativ: [
      "Att du har läst och förstått innehållet",
      "Att du håller med om innehållet",
      "Att du har utfört rutinen minst en gång",
      "Att du ansvarar för att rutinen är korrekt",
    ],
    rattIndex: 0,
    hanvisning:
      "Kvitteringen är en bekräftelse på att du tagit del av och förstått innehållet. " +
      "Ansvaret för att rutinen är korrekt ligger hos rutinens ägare och den som godkänner den.",
  },
  {
    id: "kvittering-godkand-status",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga: "Vad betyder det att en rutin har status \"godkänd\"?",
    alternativ: [
      "Att någon med behörighet att godkänna har granskat och släppt den",
      "Att alla i personalen har kvitterat den",
      "Att den är nyare än ett år",
      "Att den har granskats av en extern part",
    ],
    rattIndex: 0,
    hanvisning:
      "Godkännandeflödet innebär att en behörig roll granskar innehållet innan det blir " +
      "synligt som gällande rutin. Ett utkast syns inte för personalen.",
  },
  {
    id: "kvittering-vasentlig-andring",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga:
      "En rutin du kvitterade för ett halvår sedan har ändrats, och redaktören markerade " +
      "ändringen som väsentlig. Vad händer med din kvittering?",
    alternativ: [
      "Den räknas inte längre – du behöver läsa och kvittera på nytt",
      "Den gäller fortfarande tills den årliga omkvitteringen",
      "Den raderas ur revisionsloggen",
      "Ingenting, kvitteringar påverkas aldrig av ändringar",
    ],
    rattIndex: 0,
    hanvisning:
      "En ändring som redaktören markerar som väsentlig ogiltigförklarar tidigare " +
      "kvitteringar i kompetensöversikten. Din gamla kvittering finns kvar i historiken, " +
      "men du räknas som att du behöver läsa den nya versionen.",
  },
  {
    id: "kvittering-vem-har-inte-last",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga: "Vad kan en chef se om läskvitteringar?",
    alternativ: [
      "Vilka som ännu inte har kvitterat en viss rutin",
      "Hur snabbt varje person läste rutinen",
      "Hur många frågor var och en svarade fel på i mikrokvissen",
      "Vilka avsnitt varje person läste noggrannast",
    ],
    rattIndex: 0,
    hanvisning:
      "Systemet visar vilka som inte kvitterat, så att påminnelser kan riktas rätt. " +
      "Inga svar från mikrokvissen sparas någonstans – den finns för förståelse, inte betyg.",
  },
  {
    id: "kvittering-mikrokviss-sparas-ej",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga: "Sparas dina svar i mikrokvissen som visas innan du kvitterar en rutin?",
    alternativ: [
      "Nej, aldrig – den är bara till för din egen förståelse",
      "Ja, men bara om du svarar fel",
      "Ja, dina chefer kan se resultatet",
      "Ja, men bara ditt sista svar sparas",
    ],
    rattIndex: 0,
    hanvisning:
      "Ingen mikrokviss i appen sparar rätt eller fel någonstans. Det som sparas är att du " +
      "kvitterat rutinen – inte hur du svarade på vägen dit.",
  },
  {
    id: "kvittering-introduktion-progress",
    kategori: KVISS_KATEGORIER.KVITTERING,
    fraga: "Hur räknas hur långt en person kommit i sitt introduktionsspår?",
    alternativ: [
      "Automatiskt, utifrån vilka rutiner i spåret personen redan kvitterat",
      "Genom att en handledare manuellt bockar av varje steg",
      "Utifrån hur många dagar personen varit anställd",
      "Det syns inte förrän hela spåret är klart",
    ],
    rattIndex: 0,
    hanvisning:
      "Introduktionsspårets framsteg beräknas alltid live utifrån befintliga läskvitteringar " +
      "– det finns ingen separat \"klar\"-status att glömma bocka av.",
  },

  // --- Ansvar och ägarskap -----------------------------------------------------------
  {
    id: "ansvar-rutinagare",
    kategori: KVISS_KATEGORIER.ANSVAR,
    fraga: "Vad är rutinägarens uppgift?",
    alternativ: [
      "Att hålla rutinen aktuell och svara när den behöver granskas",
      "Att godkänna alla andras rutiner i samma område",
      "Att kvittera rutinen åt dem som glömt",
      "Att utbilda ny personal i rutinen",
    ],
    rattIndex: 0,
    hanvisning:
      "Varje rutin kan ha en namngiven ägare som får granskningspåminnelser. En rutin utan " +
      "ägare flaggas i innehållshälsan, eftersom ingen då bevakar att den är aktuell.",
  },
  {
    id: "ansvar-fel-innehall",
    kategori: KVISS_KATEGORIER.ANSVAR,
    fraga:
      "Du upptäcker att en godkänd rutin beskriver något som inte stämmer med hur ni " +
      "faktiskt arbetar. Vad gör du?",
    alternativ: [
      "Föreslår en ändring, så att rutinens ägare får den till granskning",
      "Ändrar direkt i texten själv",
      "Struntar i rutinen och gör som ni brukar",
      "Väntar till nästa APT och tar upp det muntligt",
    ],
    rattIndex: 0,
    hanvisning:
      "Alla kan föreslå en ändring. Förslaget går till rutinens ägare, och ändringen blir " +
      "synlig först när den godkänts – så att ingen rutin ändras utan spårbarhet.",
  },
  {
    id: "ansvar-brist-forrad",
    kategori: KVISS_KATEGORIER.ANSVAR,
    fraga: "Vem kan anmäla att något är slut eller trasigt i förrådet?",
    alternativ: [
      "Vem som helst som upptäcker det",
      "Bara förrådsansvarig",
      "Bara den som har beställningsbehörighet",
      "Bara sektionsledare och uppåt",
    ],
    rattIndex: 0,
    hanvisning:
      "Bristanmälan görs i två klick av vem som helst. Den som upptäcker en brist är sällan " +
      "den som beställer, och tröskeln ska därför vara så låg som möjligt.",
  },
  {
    id: "ansvar-ta-bort-kommentar",
    kategori: KVISS_KATEGORIER.ANSVAR,
    fraga: "Vem kan ta bort en kommentar på en rutin?",
    alternativ: [
      "Den som skrev kommentaren, eller den som har särskild behörighet att ta bort alla",
      "Bara rutinens ägare",
      "Ingen – kommentarer går inte att ta bort",
      "Bara den som godkände rutinen",
    ],
    rattIndex: 0,
    hanvisning:
      "En kommentar kan tas bort av den som skrev den. Utöver det finns en behörighet som " +
      "får ta bort vilken kommentar som helst, för de fall en kommentar behöver städas bort " +
      "av någon annan än författaren.",
  },

  // --- Hitta och använda -------------------------------------------------------------
  {
    id: "anvandning-akutlage",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad innehåller akutläget?",
    alternativ: [
      "Ett urval tidskritiska rutiner som er egen ansvariga har valt ut",
      "Alla rutiner i verksamheten, sorterade efter hur ofta de används",
      "De rutiner du själv besökt senast",
      "Rutiner som en algoritm bedömt som brådskande",
    ],
    rattIndex: 0,
    hanvisning:
      "Akutlägets innehåll kureras av en behörig roll i er egen verksamhet – inte av " +
      "leverantören och inte automatiskt. Det når du med en knapptryckning från startsidan.",
  },
  {
    id: "anvandning-offline",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad fungerar i appen när du saknar nätverk?",
    alternativ: [
      "Du kan läsa godkänt innehåll som hunnit sparas lokalt",
      "Allt fungerar som vanligt, inklusive att skapa nya rutiner",
      "Ingenting – appen kräver uppkoppling",
      "Bara sökfunktionen, men inte rutinernas innehåll",
    ],
    rattIndex: 0,
    hanvisning:
      "Godkänt innehåll cachas för läsning utan nät, med en tydlig banner när uppkopplingen " +
      "tappats. Läskvittering och bristanmälan köas och skickas när nätet är tillbaka. " +
      "Att skapa eller redigera innehåll kräver uppkoppling.",
  },
  {
    id: "anvandning-checklistlage",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad är skillnaden mellan att läsa en rutin och att köra den i checklistläge?",
    alternativ: [
      "Checklistläget visar ett steg i taget, för den som står mitt i momentet",
      "Checklistläget innehåller mer information än rutintexten",
      "Checklistläget kvitterar rutinen automatiskt när du är klar",
      "Checklistläget kan bara användas av sektionsledare",
    ],
    rattIndex: 0,
    hanvisning:
      "Samma rutin, men körd i stället för läst – ett steg i taget, med bild och " +
      "varningstext där det behövs. Byggt för den som utför momentet, inte för den som " +
      "läser i förväg vid ett skrivbord.",
  },
  {
    id: "anvandning-qr",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad händer när du skannar en QR-etikett på en förrådshylla?",
    alternativ: [
      "Du kommer direkt till artikeln i appen",
      "Artikeln markeras automatiskt som förbrukad",
      "En beställning skickas till leverantören",
      "Hyllan markeras som inventerad",
    ],
    rattIndex: 0,
    hanvisning:
      "QR-etiketten är en genväg till rätt artikel – inget skannande registrerar uttag " +
      "eller beställningar.",
  },
  {
    id: "anvandning-sok-stavfel",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad händer om du stavar lite fel i sökrutan?",
    alternativ: [
      "Sökningen hittar ändå relevanta träffar – den kräver inte exakt stavning",
      "Du får inga träffar alls",
      "Sökningen rättar automatiskt din stavning och visar det rättade ordet",
      "Du måste skriva om hela sökningen från början",
    ],
    rattIndex: 0,
    hanvisning:
      "Sökfunktionen tolererar en del avvikelse i stavningen, så en enstaka felskriven " +
      "bokstav behöver inte betyda noll träffar.",
  },
  {
    id: "anvandning-veckans-repetition-vs-ova",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad är skillnaden mellan \"Veckans repetition\" och \"Öva\"?",
    alternativ: [
      "Veckans repetition visar samma fråga hela veckan om en rutin du kvitterat för länge " +
        "sedan – Öva slumpar ett nytt urval varje gång du startar",
      "Veckans repetition sparar dina resultat, Öva gör det inte",
      "Öva är bara tillgängligt för chefer",
      "Det är samma funktion, bara under två olika namn",
    ],
    rattIndex: 0,
    hanvisning:
      "Ingen av dem sparar svar (samma princip som mikrokvissen). Veckans repetition är en " +
      "liten påminnelse om något du redan kvitterat länge sedan; Öva är ett självvalt " +
      "övningspass du kan köra så ofta du vill.",
  },
  {
    id: "anvandning-kommentar-mention",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vad kan du göra med \"@\" när du skriver en kommentar på en rutin?",
    alternativ: [
      "Nämna en kollega – du får förslag på namn medan du skriver",
      "Skicka kommentaren direkt till chefen, förbi alla andra",
      "Markera kommentaren som brådskande",
      "Dölja kommentaren för alla utom dig själv",
    ],
    rattIndex: 0,
    hanvisning: "Skriv @ följt av några bokstäver för att få upp förslag på vem du menar.",
  },
  {
    id: "anvandning-feedback-vem-laser",
    kategori: KVISS_KATEGORIER.ANVANDNING,
    fraga: "Vem kan läsa den feedback du skickar in via Feedback-sidan i appen?",
    alternativ: [
      "Endast superadmin",
      "Alla i din organisation",
      "Ingen – den är helt anonym och läses aldrig",
      "Bara den du själv väljer att dela den med",
    ],
    rattIndex: 0,
    hanvisning: "Feedback-sidan är tydlig med detta redan när du skriver: bara superadmin ser vad du skickar in.",
  },

  // --- Innehållets färskhet ----------------------------------------------------------
  {
    id: "farskhet-varfor-granskning",
    kategori: KVISS_KATEGORIER.FARSKHET,
    fraga: "Varför har rutiner ett granskningsdatum?",
    alternativ: [
      "För att någon regelbundet ska pröva om innehållet fortfarande stämmer",
      "För att rutinen ska sluta visas när datumet passerats",
      "För att personalen ska behöva kvittera om varje år",
      "För att uppfylla ett krav från leverantören",
    ],
    rattIndex: 0,
    hanvisning:
      "En rutin som ingen har prövat på flera år ser exakt likadan ut som en välskött – " +
      "ända tills någon följer den. Granskningsdatumet gör åldrandet synligt.",
  },
  {
    id: "farskhet-utgangen-rutin",
    kategori: KVISS_KATEGORIER.FARSKHET,
    fraga: "En rutin har passerat sitt granskningsdatum. Vad betyder det?",
    alternativ: [
      "Att den behöver granskas – den är inte automatiskt fel, men ingen har prövat den",
      "Att den inte längre gäller och inte får följas",
      "Att den raderas automatiskt",
      "Att den blir synlig bara för redaktörer",
    ],
    rattIndex: 0,
    hanvisning:
      "Ett passerat granskningsdatum är en signal om att ingen bekräftat att innehållet " +
      "fortfarande stämmer. Rutinen finns kvar och flaggas i innehållshälsan.",
  },
  {
    id: "farskhet-versionshistorik",
    kategori: KVISS_KATEGORIER.FARSKHET,
    fraga: "Går det att se vad som stod i en rutin tidigare?",
    alternativ: [
      "Ja, varje rutin har en versionshistorik med skillnadsvisning",
      "Nej, bara den senaste versionen sparas",
      "Bara om redaktören valde att spara en kopia",
      "Bara de senaste sju dagarna",
    ],
    rattIndex: 0,
    hanvisning:
      "Versionshistoriken visar vad som ändrats, av vem och när, och en tidigare version " +
      "kan återställas. Det är också det som gör revisionsloggen meningsfull.",
  },

  // --- Patientuppgifter --------------------------------------------------------------
  {
    id: "pii-aldrig-patientuppgifter",
    kategori: KVISS_KATEGORIER.PATIENTUPPGIFTER,
    fraga: "Vad gäller för patientuppgifter i den här appen?",
    alternativ: [
      "De ska aldrig skrivas in – appen är inte avsedd att innehålla dem",
      "De får skrivas in i kommentarer men inte i rutiner",
      "De får skrivas in om de avidentifieras först",
      "De får skrivas in av den som har superadminbehörighet",
    ],
    rattIndex: 0,
    hanvisning:
      "Systemet är byggt för verksamhetens rutiner och kunskap, inte för patientdata. " +
      "Hela dess riskprofil bygger på att patientuppgifter inte finns här.",
  },
  {
    id: "pii-sparrarnas-granser",
    kategori: KVISS_KATEGORIER.PATIENTUPPGIFTER,
    fraga:
      "Appen varnar om något som liknar ett personnummer skrivs in. Vad betyder det för " +
      "ditt eget ansvar?",
    alternativ: [
      "Spärrarna är ett skyddsnät – du måste ändå aldrig skriva in patientuppgifter",
      "Ingenting, tekniken hindrar allt som är känsligt",
      "Du kan skriva in uppgifter så länge varningen inte visas",
      "Ansvaret ligger helt hos den som godkänner rutinen",
    ],
    rattIndex: 0,
    hanvisning:
      "Inget textfilter kan hindra någon som aktivt kringgår varningarna, och en uppgift " +
      "kan vara känslig utan att se ut som ett personnummer. Spärren är ett skyddsnät, " +
      "inte en garanti.",
  },
  {
    id: "pii-var-hor-det-hemma",
    kategori: KVISS_KATEGORIER.PATIENTUPPGIFTER,
    fraga: "Var hör uppgifter om en enskild patient hemma?",
    alternativ: [
      "I journalsystemet, aldrig i rutin- eller kunskapsbanken",
      "I en kommentar på den rutin som användes",
      "I skiftrapporten, om det är brådskande",
      "I en bilaga till rutinen",
    ],
    rattIndex: 0,
    hanvisning:
      "Appen har medvetet ingen journalintegration. Allt som rör en identifierbar patient " +
      "hör hemma i journalsystemet.",
  },
  {
    id: "pii-kommentar-feedback-sparr",
    kategori: KVISS_KATEGORIER.PATIENTUPPGIFTER,
    fraga:
      "Vad händer om du skriver något som liknar en patientuppgift i en kommentar eller ett " +
      "feedback-meddelande?",
    alternativ: [
      "Appen varnar och kan blockera att det skickas in",
      "Det skickas in som vanligt – ingen kontroll görs där",
      "Det skickas in men markeras automatiskt som känsligt",
      "Det går bara igenom om du är superadmin",
    ],
    rattIndex: 0,
    hanvisning:
      "Samma kontroll som varnar vid rutintext körs även på kommentarer och feedback, " +
      "eftersom en patientuppgift kan dyka upp var som helst i fritext.",
  },

  // --- Mallar och startbibliotek -----------------------------------------------------
  {
    id: "mall-innebord",
    kategori: KVISS_KATEGORIER.MALLAR,
    fraga: "En rutin är märkt \"(mall)\". Vad innebär det?",
    alternativ: [
      "Innehållet är ett skelett som er verksamhet ska ersätta med sin egen rutin",
      "Att rutinen är godkänd av leverantören",
      "Att rutinen gäller tills en egen skrivits, och kan följas under tiden",
      "Att den är en kopia av en nationell riktlinje",
    ],
    rattIndex: 0,
    hanvisning:
      "Startbibliotekets mallar är strukturella exempel – rubriker och frågor att besvara. " +
      "De innehåller aldrig färdig klinisk vägledning och ska inte följas som rutin.",
  },
  {
    id: "mall-far-den-foljas",
    kategori: KVISS_KATEGORIER.MALLAR,
    fraga: "Får en rutin som fortfarande är märkt \"(mall)\" följas i det praktiska arbetet?",
    alternativ: [
      "Nej – den måste först fyllas med er egen verksamhets innehåll och godkännas",
      "Ja, den är granskad och säker att använda",
      "Ja, om ingen annan rutin finns för samma sak",
      "Ja, men bara av erfaren personal",
    ],
    rattIndex: 0,
    hanvisning:
      "En mall beskriver vilka frågor er rutin behöver besvara, inte vad svaret är. Att " +
      "följa den som om den vore en färdig rutin är precis det den är byggd för att undvika.",
  },
];

/** Alla frågor i en given kategori. */
export function fragorIKategori(kategori) {
  return KVISSBANK.filter((f) => f.kategori === kategori);
}

/**
 * Skalar av bankens `id` (internt, aldrig meningsfullt utanför den här filen) så att posten
 * får den form en rutins `kviss`-array använder. `kategori` behålls som valfri metadata –
 * den används av öva-lägets kategorifilter (src/utils/ovaLage.js) för just de frågor som
 * kommer härifrån, men läses inte av KvissModal.jsx eller firestore.rules och är alltså
 * ofarlig att spara med.
 */
export function tillRutinKviss(fragor) {
  return fragor.map(({ fraga, alternativ, rattIndex, hanvisning, kategori }) => ({
    fraga,
    alternativ,
    rattIndex,
    hanvisning,
    kategori,
  }));
}

/**
 * Max antal frågor en rutin får ha. Speglar taket i RutinFormular.jsx OCH den uppradade
 * PII-kontrollen i firestore.rules (harTroligtPersonnummerIKvissN täcker exakt fyra index).
 * Höj INTE utan att samtidigt utöka regelfunktionen – regelbudgeten på 1 000 deluttryck har
 * redan tagit slut två gånger i den filen.
 */
export const MAX_KVISSFRAGOR_PER_RUTIN = 4;
