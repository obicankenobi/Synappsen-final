// Etapp 10d: startbibliotek av rutiner per verksamhetstyp, så att en ny kundorganisation
// inte möts av en helt tom app direkt efter etablering (se skapaOrganisation i index.js).
// Innehållet är MEDVETET strukturella exempel/platshållare, inte färdig klinisk vägledning –
// varje rutin är tydligt märkt som mall och ska granskas/ersättas av verksamheten innan den
// litas på. Att låtsas att AI-genererat eller hårdkodat exempelinnehåll är verifierad klinisk
// praxis vore både medicinskt och juridiskt oansvarigt.
//
// Etapp 56a: utökat 2026-08-10 från 2 till 8-10 mallar per verksamhetstyp, spridda över alla
// tre områdena (kliniskt-stod/logistik/administration – tidigare täcktes bara kliniskt-stod,
// vilket lämnade Logistik och Administration helt tomma dag ett). Samma strukturella
// skelett-disciplin som originalmallarna – rubriker och frågor att besvara, aldrig påhittat
// sakinnehåll.
//
// Etapp 59a (ETAPPLAN12.md, bugfynd): 56a:s logistik-mallar (omrade: "logistik") togs bort
// igen samma dag de infördes. /logistik-sidan visar bara förråd (SektionsKort per förråd),
// inte en Sektionssida som kliniskt-stod/administration – det fanns alltså ingen vy där en
// logistik-rutin kunde läsas, den var inte sökbar (useSokindex monterar bara
// useRutiner("kliniskt-stod"/"administration")) och kunde inte godkännas
// (useGodkannandeKo() slår ihop samma två områden). Ändå räknades den in i hälsosiffran och
// ledningsrapporten (InnehallshalsaSektion/Ledningsrapport läser useRutiner("logistik")
// explicit) – en ny organisation fick alltså osynliga rutiner som drog ned sin egen
// hälsosiffra. Tas bort tills logistik faktiskt blir ett läsbart rutinområde (se
// ETAPPLAN12.md §59a alternativ A) eller en konkret kund efterfrågar det.
const MALL_ANMARKNING =
  "\n\n---\n_Detta är en startmall, inte en färdig rutin. Ersätt innehållet med er egen " +
  "verksamhets faktiska rutin och låt den granskas/godkännas enligt er vanliga process " +
  "innan personalen förlitar sig på den._";

// Etapp 19b/41b/65d: mikrokvissen (KvissModal.jsx) visas innan en läskvittering räknas, och
// BÅDE öva-läget och Veckans repetition kräver rutin.kviss.length > 0 för att visa något alls.
// En ny organisation fick tidigare 8-10 rutinmallar med tomma kvissfält – alltså två byggda
// funktioner som var helt tomma dag ett. Varje startmall får därför två frågor.
//
// Frågorna handlar MEDVETET om att rutinen är en mall och inte får följas som färdig rutin,
// inte om dess kliniska innehåll. Skälet är detsamma som gör att mallarna själva bara är
// skelett: en kvissfråga har ett rätt svar och är därmed ett faktapåstående, och påhittad
// klinisk vägledning skulle passera både MDR-gränsdragningen och projektets regel om att
// aldrig påstå overifierat sakinnehåll. Att i stället lära ut att seedat innehåll inte är
// verifierat gör startbibliotekets största risk – att någon litar på en platshållare – till
// det första personalen får bekräfta att de förstått.
//
// En återanvändbar bank av samma slags frågor (systemkunskap, process, ansvar) finns i
// src/data/kvissbank.js för redaktörer som vill lägga till fler.
const MALL_KVISS = [
  {
    fraga: 'Den h\u00e4r rutinen \u00e4r m\u00e4rkt "(mall)". Vad inneb\u00e4r det?',
    alternativ: [
      "Inneh\u00e5llet \u00e4r ett skelett som er verksamhet ska ers\u00e4tta med sin egen rutin",
      "Att rutinen \u00e4r granskad och godk\u00e4nd av leverant\u00f6ren",
      "Att rutinen g\u00e4ller tills en egen skrivits, och kan f\u00f6ljas under tiden",
    ],
    rattIndex: 0,
    hanvisning:
      "Se noteringen sist i rutintexten. Startbibliotekets mallar \u00e4r strukturella exempel \u2013 " +
      "rubriker och fr\u00e5gor att besvara \u2013 aldrig f\u00e4rdig klinisk v\u00e4gledning.",
  },
  {
    fraga: "Vad g\u00f6r du om inneh\u00e5llet inte st\u00e4mmer med hur ni faktiskt arbetar?",
    alternativ: [
      "F\u00f6resl\u00e5r en \u00e4ndring, s\u00e5 att rutinens \u00e4gare f\u00e5r den till granskning",
      "\u00c4ndrar direkt i texten sj\u00e4lv",
      "F\u00f6ljer rutinen \u00e4nd\u00e5 tills n\u00e5gon annan r\u00e4ttar den",
    ],
    rattIndex: 0,
    hanvisning:
      "Alla kan f\u00f6resl\u00e5 en \u00e4ndring. F\u00f6rslaget g\u00e5r till rutinens \u00e4gare och blir synligt " +
      "f\u00f6rst n\u00e4r det godk\u00e4nts, s\u00e5 att ingen rutin \u00e4ndras utan sp\u00e5rbarhet.",
  },
];

const VERKSAMHETSMALLAR = {
  akutmottagning: [
    {
      titel: "Mottagande av patient (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Bakgrund\n\nBeskriv er lokala rutin för mottagande och initial bedömning.\n\n" +
        "# Handläggning\n\n1. Triage enligt er valda skala\n2. Registrering\n3. Överlämning till ansvarig läkare/sjuksköterska\n\n" +
        "# Varningstecken\n\nLista era lokala kriterier för akut eskalering." +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Larmrutin – hjärtstopp (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Larmtyp\n\nHjärtstopp/HLR-larm.\n\n# Vid larm\n\n1. Vem larmas och hur\n" +
        "2. Vilken utrustning ska finnas tillgänglig\n3. Ansvarsfördelning under insatsen" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Överlämning mellan skift (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för säker överlämning av pågående patientfall mellan skift.\n\n" +
        "# Handläggning\n\n1. Vad ska ingå i en muntlig/skriftlig överlämning\n" +
        "2. Vem ansvarar för att den genomförs\n3. Hur avvikande/instabila patienter flaggas särskilt" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Smittskydd och isolering (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er lokala rutin för smittskyddsåtgärder och isolering.\n\n" +
        "# Handläggning\n\n1. Kriterier för misstänkt smitta\n2. Skyddsutrustning som ska användas\n" +
        "3. Rengöring/sanering efter vård av en isolerad patient" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Introduktion av ny medarbetare (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er lokala introduktionsprocess för en nyanställd.\n\n" +
        "# Handläggning\n\n1. Vad ska genomgås första dagen/veckan\n" +
        "2. Vem är fadder/handledare\n3. Hur avstäms att introduktionen är klar" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
  ],
  vardcentral: [
    {
      titel: "Telefonrådgivning (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för telefonrådgivning och bedömning av vårdnivå.\n\n" +
        "# Handläggning\n\n1. Vem svarar och när\n2. Bedömningsstöd som används\n" +
        "3. När patienten ska bokas, hänvisas eller uppmanas söka akut vård" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Recept- och läkemedelsrutin (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för receptförnyelse och läkemedelsgenomgång.\n\n" +
        "# Handläggning\n\n1. Vem hanterar inkommande receptförfrågningar\n" +
        "2. Rutin för läkemedelsavstämning\n3. Eskalering vid osäkerhet" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Provtagning och svarshantering (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för provtagning och hantering av provsvar.\n\n" +
        "# Handläggning\n\n1. Vem tar prover och enligt vilken ordination\n" +
        "2. Hur svar granskas och signeras\n3. Hur patienten informeras om avvikande svar" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Vaccination (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för vaccination, inklusive samtycke och journalföring.\n\n" +
        "# Handläggning\n\n1. Vem får vaccinera\n2. Hur biverkningar/reaktioner hanteras direkt efteråt\n" +
        "3. Hur vaccinationen dokumenteras" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Bokningsöverbelastning (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för när bokningsbara tider tar slut för dagen.\n\n" +
        "# Handläggning\n\n1. Hur akuta ärenden prioriteras ändå\n" +
        "2. Vem beslutar om extra insatta tider\n3. Hur patienten informeras" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
  ],
  hemtjanst: [
    {
      titel: "Läkemedelshantering i hemmet (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för läkemedelshantering hos brukare i ordinärt boende.\n\n" +
        "# Handläggning\n\n1. Delegering och ansvar\n2. Dokumentation vid varje besök\n" +
        "3. Vad som ska rapporteras vidare och till vem" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Larmrutin – fallolycka (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Larmtyp\n\nFall hos brukare.\n\n# Vid larm\n\n1. Första bedömning på plats\n" +
        "2. När ambulans ska larmas\n3. Rapportering och uppföljning" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Hygienrutiner vid brukarbesök (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för basala hygienrutiner vid besök hos brukare.\n\n" +
        "# Handläggning\n\n1. Skyddsutrustning som ska bäras\n2. Handhygien före/efter besök\n" +
        "3. Extra åtgärder vid känd smitta hos brukaren" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Schemaändring med kort varsel (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för akut sjukfrånvaro eller schemaändring.\n\n" +
        "# Handläggning\n\n1. Vem kontaktas och när\n2. Hur berörda brukare informeras vid behov\n" +
        "3. Hur ändringen dokumenteras" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
      kviss: MALL_KVISS,
    },
  ],
};

const VERKSAMHETSTYP_NAMN = {
  akutmottagning: "Akutmottagning",
  vardcentral: "Vårdcentral",
  hemtjanst: "Kommunal hemtjänst",
};

// Etapp 56b: startbibliotek för allt som INTE är en rutin. En ny organisation mötte
// tidigare tomma listor för förråd/kontakter/introduktionsspår/kompetenskrav – skillnaden
// mellan "ett tomt system vi måste fylla" och "ett system som är nästan rätt och behöver
// justeras". Namnen är medvetet märkta "(mall, döp om)" – strukturella platshållare, inte
// påstådda verkliga lagerplatser eller telefonnummer.
const FORRADSMALLAR = {
  akutmottagning: [
    { namn: "Handskar, engångs (mall, döp om)", forrad: "Akutförråd", skap: "A", hylla: "1", antal: 0, minAntal: 5 },
    { namn: "Kompresser (mall, döp om)", forrad: "Akutförråd", skap: "A", hylla: "2", antal: 0, minAntal: 5 },
    { namn: "Infartsmaterial (mall, döp om)", forrad: "Akutförråd", skap: "B", hylla: "1", antal: 0, minAntal: 5 },
  ],
  vardcentral: [
    { namn: "Provtagningsmaterial (mall, döp om)", forrad: "Mottagningsförråd", skap: "A", hylla: "1", antal: 0, minAntal: 5 },
    { namn: "Vaccin – förvaras kylt (mall, döp om)", forrad: "Kylskåp", skap: "-", hylla: "-", antal: 0, minAntal: 5 },
    { namn: "Sårvårdsmaterial (mall, döp om)", forrad: "Mottagningsförråd", skap: "A", hylla: "2", antal: 0, minAntal: 5 },
  ],
  hemtjanst: [
    { namn: "Skyddsutrustning, engångs (mall, döp om)", forrad: "Centralförråd", skap: "A", hylla: "1", antal: 0, minAntal: 5 },
    { namn: "Hygienartiklar (mall, döp om)", forrad: "Centralförråd", skap: "A", hylla: "2", antal: 0, minAntal: 5 },
    { namn: "Nycklar/passerbrickor (mall, döp om)", forrad: "Nyckelskåp", skap: "-", hylla: "-", antal: 0, minAntal: 1 },
  ],
};

// Fem generella kategorier, samma oavsett verksamhetstyp – de flesta verksamheter behöver
// exakt de här kontaktvägarna, bara med olika faktiska nummer/namn ifyllda.
const KONTAKTMALLAR = [
  { namn: "Ambulans/SOS Alarm (mall, kontrollera)", nummer: "112", kategori: "Akut", beskrivning: "Vid akut livshotande tillstånd.", akutnummer: true },
  { namn: "Jour/bakjour (mall, fyll i)", nummer: "", kategori: "Läkare", beskrivning: "Fyll i aktuell kontaktväg för er verksamhet." },
  { namn: "Verksamhetschef (mall, fyll i)", nummer: "", kategori: "Ledning", beskrivning: "Fyll i aktuell kontaktväg." },
  { namn: "IT-support (mall, fyll i)", nummer: "", kategori: "IT/Teknik", beskrivning: "Fyll i aktuell kontaktväg." },
  { namn: "Fastighet/vaktmästeri (mall, fyll i)", nummer: "", kategori: "Fastighet", beskrivning: "Fyll i aktuell kontaktväg." },
];

module.exports = { VERKSAMHETSMALLAR, VERKSAMHETSTYP_NAMN, FORRADSMALLAR, KONTAKTMALLAR, MALL_KVISS };
