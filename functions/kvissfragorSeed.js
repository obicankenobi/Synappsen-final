// Etapp 71: startinnehållet i den globala frågebanken (kvissfragor).
//
// Två paket fylls här:
//
//   yrkeskunskap  – "spår 1" i granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §7. Sådant
//                   som FÖLJER AV LAG och därför gäller all vårdpersonal oavsett verksamhet,
//                   region och arbetsgivare. Varje svar är kontrollerat mot författningstexten,
//                   inte mot minnet – se `kalla` på varje fråga.
//   systemkunskap – de 19 frågor som tidigare låg statiskt i src/data/kvissbank.js. Ägaren har
//                   påpekat att de är av lågt värde för vårdpersonal; de flyttas hit i stället
//                   för att raderas, eftersom paketet nu går att stänga av i adminvyn. Beslutet
//                   om de ska behållas står öppet i OPPNA-PUNKTER.md.
//
// Paketet "kliniskt" (spår 2) fylls INTE här. Maskineriet finns, men innehållet väntar på den
// externa juridiska bedömningen (se bedömningens §9 och OPPNA-PUNKTER.md).
//
// VARFÖR VARJE FRÅGA HAR kalla + kallaDatum. Under arbetet med just den här filen upptäcktes
// att SOSFS 1997:14 om delegering – den föreskrift varje svensk delegeringsutbildning har
// hänvisat till i snart trettio år – UPPHÄVDES 2026-01-01 genom HSLF-FS 2025:5. Ett facit
// skrivet ur minnet hade alltså varit fel från dag ett. Det är exakt den färskhetsrisk
// bedömningens §5.1 pekar ut, demonstrerad på första innehållsomgången. Delegeringsfrågan
// nedan vilar därför på patientsäkerhetslagen, som bär regeln oavsett föreskriftsläget.
//
// ID:na är DETERMINISTISKA och används som dokument-ID i Firestore. Att köra seedningen igen
// uppdaterar alltså befintliga frågor i stället för att skapa dubbletter – och en kund som
// skrivit om en fråga behåller sin överlagring, eftersom den är nycklad på samma id.

const KALLDATUM = "2026-08-27";

const YRKESKUNSKAP = [
  {
    id: "yrke-inre-sekretess",
    kategori: "sekretess",
    fraga: "Du arbetar hos en vårdgivare. Vems journaluppgifter får du läsa?",
    alternativ: [
      "Bara för patienter du deltar i vården av, eller där du annars behöver uppgifterna för ditt arbete",
      "Alla patienter hos samma vårdgivare, eftersom du omfattas av samma sekretess",
      "Alla patienter på din egen avdelning",
      "Alla patienter, så länge du inte för uppgifterna vidare",
    ],
    rattIndex: 0,
    hanvisning:
      "Det kallas inre sekretess: sekretessen gäller även mellan kollegor hos samma " +
      "vårdgivare. Att du har behörighet i systemet betyder inte att du har rätt att läsa.",
    kalla: "Patientdatalagen (2008:355) 4 kap. 1 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-tystnadsplikt-efterat",
    kategori: "sekretess",
    fraga: "Vad händer med din tystnadsplikt när du slutar din anställning?",
    alternativ: [
      "Den gäller vidare – den upphör inte när anställningen gör det",
      "Den upphör när anställningen upphör",
      "Den gäller i två år efter att du slutat",
      "Den gäller vidare bara om du skrivit på ett särskilt avtal",
    ],
    rattIndex: 0,
    hanvisning:
      "Lagtexten omfattar uttryckligen den som tillhör ELLER HAR TILLHÖRT hälso- och " +
      "sjukvårdspersonalen. Det du fick veta i tjänsten får du inte röja efteråt heller.",
    kalla: "Patientsäkerhetslagen (2010:659) 6 kap. 12 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-journal-rattelse",
    kategori: "dokumentation",
    fraga: "En uppgift i en patientjournal visar sig vara felaktig. Vad gäller?",
    alternativ: [
      "Den rättas, men den felaktiga uppgiften får inte utplånas eller göras oläslig",
      "Den raderas, så att ingen läser fel uppgift av misstag",
      "Den lämnas orörd och rättas bara i nästa anteckning",
      "Den får bara ändras av verksamhetschefen",
    ],
    rattIndex: 0,
    hanvisning:
      "Journalen ska gå att följa i efterhand. En rättelse läggs till, med uppgift om när den " +
      "gjordes och av vem – den gamla uppgiften ska fortfarande gå att läsa.",
    kalla: "Patientdatalagen (2008:355) 3 kap. 14 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-eget-ansvar",
    kategori: "ansvar",
    fraga:
      "Du utför en arbetsuppgift på uppdrag av en kollega, och det blir fel. Vem bär ansvaret " +
      "för hur du utförde den?",
    alternativ: [
      "Du själv – var och en i hälso- och sjukvårdspersonalen bär ansvaret för hur den egna arbetsuppgiften fullgörs",
      "Den som gav dig uppgiften",
      "Verksamhetschefen",
      "Vårdgivaren, eftersom du är anställd",
    ],
    rattIndex: 0,
    hanvisning:
      "Det egna yrkesansvaret försvinner inte för att någon annan bett dig göra något. Det är " +
      "också därför du får – och ska – säga ifrån om du inte anser dig kunna utföra uppgiften säkert.",
    kalla: "Patientsäkerhetslagen (2010:659) 6 kap. 2 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-delegering-villkor",
    kategori: "ansvar",
    fraga: "När får en arbetsuppgift delegeras till någon annan?",
    alternativ: [
      "Endast när det är förenligt med kravet på en god och säker vård",
      "När den ordinarie personalen inte räcker till",
      "När den som tar emot uppgiften känner sig trygg med den",
      "När chefen har godkänt det skriftligt",
    ],
    rattIndex: 0,
    hanvisning:
      "Bemanningsläget är aldrig i sig ett skäl för delegering. Att mottagaren känner sig trygg " +
      "räcker inte heller – bedömningen gäller om vården blir god och säker.",
    kalla: "Patientsäkerhetslagen (2010:659) 6 kap. 3 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-lex-maria-vem",
    kategori: "avvikelse",
    fraga:
      "En händelse har medfört, eller hade kunnat medföra, en allvarlig vårdskada. Vem ska " +
      "anmäla den till IVO?",
    alternativ: [
      "Vårdgivaren",
      "Den medarbetare som var inblandad",
      "Verksamhetschefen personligen",
      "Patienten eller en närstående",
    ],
    rattIndex: 0,
    hanvisning:
      "Anmälningsskyldigheten ligger på vårdgivaren, inte på den enskilda medarbetaren. Din " +
      "uppgift är att rapportera händelsen internt så att den kan utredas. Patienten kan " +
      "dessutom alltid göra en egen anmälan, men det ersätter inte vårdgivarens skyldighet.",
    kalla: "Patientsäkerhetslagen (2010:659) 3 kap. 5 §",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-avvikelse-syfte",
    kategori: "avvikelse",
    fraga: "Vad är huvudsyftet med att rapportera en avvikelse?",
    alternativ: [
      "Att hitta vad i arbetssättet som gjorde felet möjligt, så att det inte upprepas",
      "Att dokumentera vem som gjorde fel",
      "Att skydda verksamheten juridiskt",
      "Att uppfylla ett formkrav inför nästa inspektion",
    ],
    rattIndex: 0,
    hanvisning:
      "Patientsäkerhetsarbetet bygger på ett systemperspektiv. En avvikelserapport som bara " +
      "letar skyldig gör att nästa person tvekar att rapportera – och då försvinner det som " +
      "faktiskt hade kunnat rättas.",
    kalla: "Patientsäkerhetslagen (2010:659) 3 kap.",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-samtycke-aterta",
    kategori: "samtycke",
    fraga: "En patient har samtyckt till en behandling men ändrar sig halvvägs. Vad gäller?",
    alternativ: [
      "Patienten får när som helst ta tillbaka sitt samtycke",
      "Samtycket gäller tills behandlingen är slutförd",
      "Samtycket kan bara tas tillbaka skriftligt",
      "Samtycket gäller tills en läkare bedömt annat",
    ],
    rattIndex: 0,
    hanvisning:
      "Vård ska som huvudregel inte ges utan patientens samtycke, och samtycket kan tas " +
      "tillbaka när som helst. Patienten ska då få veta vad det innebär.",
    kalla: "Patientlagen (2014:821) 4 kap.",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-basal-hygien-nar",
    kategori: "hygien",
    fraga: "När gäller de basala hygienrutinerna?",
    alternativ: [
      "Vid allt vård- och omsorgsarbete med fysisk kontakt, oavsett om smitta är känd",
      "Bara när en patient har en konstaterad smitta",
      "Bara vid ingrepp som bryter hudbarriären",
      "Bara på vårdavdelningar, inte i hemmet",
    ],
    rattIndex: 0,
    hanvisning:
      "Poängen med basala rutiner är just att de inte förutsätter att man vet vem som bär " +
      "smitta. De gäller även i hemtjänst och särskilt boende.",
    kalla: "Socialstyrelsens föreskrifter (SOSFS 2015:10) om basal hygien i vård och omsorg",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-tillbud",
    kategori: "arbetsmiljo",
    fraga:
      "Något går nästan fel på arbetsplatsen, men ingen skadas och ingen patient påverkas. " +
      "Vad gör du?",
    alternativ: [
      "Rapporterar det som ett tillbud – det är just sådant som visar var risken finns",
      "Låter det vara, eftersom ingenting hände",
      "Nämner det muntligt till närmaste kollega",
      "Rapporterar bara om det händer igen",
    ],
    rattIndex: 0,
    hanvisning:
      "Ett tillbud är en gratis varning. Arbetstagaren ska medverka i arbetsmiljöarbetet och " +
      "underrätta arbetsgivaren om risker som upptäcks.",
    kalla: "Arbetsmiljölagen (1977:1160) 3 kap.",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-journalforing-skyldighet",
    kategori: "dokumentation",
    fraga: "Vad är syftet med patientjournalen i första hand?",
    alternativ: [
      "Att vara underlag för en god och säker vård av patienten",
      "Att skydda personalen om något granskas i efterhand",
      "Att ge underlag för verksamhetens statistik",
      "Att uppfylla ett krav från vårdgivarens försäkringsbolag",
    ],
    rattIndex: 0,
    hanvisning:
      "Journalens främsta ändamål är vården av patienten. Att den också kan användas för " +
      "uppföljning, granskning och forskning är sekundära ändamål – inte skälet till att den förs.",
    kalla: "Patientdatalagen (2008:355) 3 kap.",
    kallaDatum: KALLDATUM,
  },
  {
    id: "yrke-sekretess-narstaende",
    kategori: "sekretess",
    fraga:
      "En närstående ringer och frågar hur det går för en patient. Vad är utgångspunkten?",
    alternativ: [
      "Du får inte lämna ut uppgifter utan att patienten samtyckt till det",
      "Närstående får alltid information, de räknas inte som utomstående",
      "Du får berätta så länge du inte går in på detaljer",
      "Du får berätta om du känner igen personen på rösten",
    ],
    rattIndex: 0,
    hanvisning:
      "Sekretessen gäller även mot närstående. Utgångspunkten är patientens eget samtycke – " +
      "och att du inte kan veta vem som faktiskt är i andra änden av en telefonlinje.",
    kalla: "Patientsäkerhetslagen (2010:659) 6 kap. 12 §, offentlighets- och sekretesslagen (2009:400) 25 kap.",
    kallaDatum: KALLDATUM,
  },
];

// De 17 frågor som tidigare låg i src/data/kvissbank.js. Innehållet är oförändrat – bara
// flyttat till den redigerbara banken, med `paket` och utan bankens gamla kategorinamn som
// nyckelkonstanter (kategorin är nu en fri sträng, satt av den som skriver frågan).
const SYSTEMKUNSKAP = [
  {
    id: "kvittering-innebord",
    kategori: "kvittering",
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
    kategori: "kvittering",
    fraga: 'Vad betyder det att en rutin har status "godkänd"?',
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
    kategori: "kvittering",
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
    kategori: "kvittering",
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
    id: "ansvar-rutinagare",
    kategori: "ansvar",
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
    kategori: "ansvar",
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
    kategori: "ansvar",
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
    id: "anvandning-akutlage",
    kategori: "anvandning",
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
    kategori: "anvandning",
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
    kategori: "anvandning",
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
    kategori: "anvandning",
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
    id: "farskhet-varfor-granskning",
    kategori: "farskhet",
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
    kategori: "farskhet",
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
    kategori: "farskhet",
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
  {
    id: "pii-aldrig-patientuppgifter",
    kategori: "patientuppgifter",
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
    kategori: "patientuppgifter",
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
    kategori: "patientuppgifter",
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
    id: "mall-innebord",
    kategori: "mallar",
    fraga: 'En rutin är märkt "(mall)". Vad innebär det?',
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
    kategori: "mallar",
    fraga: 'Får en rutin som fortfarande är märkt "(mall)" följas i det praktiska arbetet?',
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

exports.SEED = [
  ...YRKESKUNSKAP.map((f) => ({ ...f, paket: "yrkeskunskap" })),
  ...SYSTEMKUNSKAP.map((f) => ({ ...f, paket: "systemkunskap", kalla: null, kallaDatum: null })),
];
