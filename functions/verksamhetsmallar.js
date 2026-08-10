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
const MALL_ANMARKNING =
  "\n\n---\n_Detta är en startmall, inte en färdig rutin. Ersätt innehållet med er egen " +
  "verksamhets faktiska rutin och låt den granskas/godkännas enligt er vanliga process " +
  "innan personalen förlitar sig på den._";

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
    },
    {
      titel: "Larmrutin – hjärtstopp (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Larmtyp\n\nHjärtstopp/HLR-larm.\n\n# Vid larm\n\n1. Vem larmas och hur\n" +
        "2. Vilken utrustning ska finnas tillgänglig\n3. Ansvarsfördelning under insatsen" +
        MALL_ANMARKNING,
    },
    {
      titel: "Överlämning mellan skift (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för säker överlämning av pågående patientfall mellan skift.\n\n" +
        "# Handläggning\n\n1. Vad ska ingå i en muntlig/skriftlig överlämning\n" +
        "2. Vem ansvarar för att den genomförs\n3. Hur avvikande/instabila patienter flaggas särskilt" +
        MALL_ANMARKNING,
    },
    {
      titel: "Smittskydd och isolering (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er lokala rutin för smittskyddsåtgärder och isolering.\n\n" +
        "# Handläggning\n\n1. Kriterier för misstänkt smitta\n2. Skyddsutrustning som ska användas\n" +
        "3. Rengöring/sanering efter vård av en isolerad patient" +
        MALL_ANMARKNING,
    },
    {
      titel: "Beställning av sjukvårdsmaterial (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för beställning och påfyllning av förbrukningsmaterial.\n\n" +
        "# Handläggning\n\n1. Vem får beställa och från vilken leverantör\n" +
        "2. Hur ofta inventeras lagret\n3. Vad gäller vid akut brist" +
        MALL_ANMARKNING,
    },
    {
      titel: "Kontroll av akututrustning (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för daglig/veckovis kontroll av akutvagn och akututrustning.\n\n" +
        "# Handläggning\n\n1. Vad ska kontrolleras och hur ofta\n2. Var kontrollen dokumenteras\n" +
        "3. Vem åtgärdar en upptäckt brist" +
        MALL_ANMARKNING,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
    },
    {
      titel: "Introduktion av ny medarbetare (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er lokala introduktionsprocess för en nyanställd.\n\n" +
        "# Handläggning\n\n1. Vad ska genomgås första dagen/veckan\n" +
        "2. Vem är fadder/handledare\n3. Hur avstäms att introduktionen är klar" +
        MALL_ANMARKNING,
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
    },
    {
      titel: "Recept- och läkemedelsrutin (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för receptförnyelse och läkemedelsgenomgång.\n\n" +
        "# Handläggning\n\n1. Vem hanterar inkommande receptförfrågningar\n" +
        "2. Rutin för läkemedelsavstämning\n3. Eskalering vid osäkerhet" +
        MALL_ANMARKNING,
    },
    {
      titel: "Provtagning och svarshantering (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för provtagning och hantering av provsvar.\n\n" +
        "# Handläggning\n\n1. Vem tar prover och enligt vilken ordination\n" +
        "2. Hur svar granskas och signeras\n3. Hur patienten informeras om avvikande svar" +
        MALL_ANMARKNING,
    },
    {
      titel: "Vaccination (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för vaccination, inklusive samtycke och journalföring.\n\n" +
        "# Handläggning\n\n1. Vem får vaccinera\n2. Hur biverkningar/reaktioner hanteras direkt efteråt\n" +
        "3. Hur vaccinationen dokumenteras" +
        MALL_ANMARKNING,
    },
    {
      titel: "Beställning av förbrukningsmaterial (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för beställning av mottagningens förbrukningsmaterial.\n\n" +
        "# Handläggning\n\n1. Vem får beställa och från vilken leverantör\n" +
        "2. Hur ofta inventeras lagret\n3. Vad gäller vid akut brist" +
        MALL_ANMARKNING,
    },
    {
      titel: "Kylkedjekontroll för vaccin (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för temperaturkontroll av kylskåp med vaccin/läkemedel.\n\n" +
        "# Handläggning\n\n1. Hur ofta och av vem temperaturen loggas\n" +
        "2. Vad som gäller vid ett avvikande värde\n3. Var loggen sparas" +
        MALL_ANMARKNING,
    },
    {
      titel: "Bokningsöverbelastning (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för när bokningsbara tider tar slut för dagen.\n\n" +
        "# Handläggning\n\n1. Hur akuta ärenden prioriteras ändå\n" +
        "2. Vem beslutar om extra insatta tider\n3. Hur patienten informeras" +
        MALL_ANMARKNING,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
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
    },
    {
      titel: "Larmrutin – fallolycka (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Larmtyp\n\nFall hos brukare.\n\n# Vid larm\n\n1. Första bedömning på plats\n" +
        "2. När ambulans ska larmas\n3. Rapportering och uppföljning" +
        MALL_ANMARKNING,
    },
    {
      titel: "Hygienrutiner vid brukarbesök (mall)",
      omrade: "kliniskt-stod",
      innehall:
        "# Syfte\n\nBeskriv er rutin för basala hygienrutiner vid besök hos brukare.\n\n" +
        "# Handläggning\n\n1. Skyddsutrustning som ska bäras\n2. Handhygien före/efter besök\n" +
        "3. Extra åtgärder vid känd smitta hos brukaren" +
        MALL_ANMARKNING,
    },
    {
      titel: "Nyckelhantering (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för hantering av brukares nycklar/passersystem.\n\n" +
        "# Handläggning\n\n1. Hur nycklar kvitteras ut och in\n2. Var nycklar förvaras mellan pass\n" +
        "3. Vad som gäller vid en förlorad nyckel" +
        MALL_ANMARKNING,
    },
    {
      titel: "Beställning av förbrukningsmaterial (mall)",
      omrade: "logistik",
      innehall:
        "# Syfte\n\nBeskriv er rutin för beställning av hygienartiklar och förbrukningsmaterial.\n\n" +
        "# Handläggning\n\n1. Vem får beställa och från vilken leverantör\n" +
        "2. Hur ofta inventeras förrådet\n3. Vad gäller vid akut brist" +
        MALL_ANMARKNING,
    },
    {
      titel: "Schemaändring med kort varsel (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för akut sjukfrånvaro eller schemaändring.\n\n" +
        "# Handläggning\n\n1. Vem kontaktas och när\n2. Hur berörda brukare informeras vid behov\n" +
        "3. Hur ändringen dokumenteras" +
        MALL_ANMARKNING,
    },
    {
      titel: "Avvikelsehantering (mall)",
      omrade: "administration",
      innehall:
        "# Syfte\n\nBeskriv er rutin för att rapportera och följa upp avvikelser.\n\n" +
        "# Handläggning\n\n1. Var en avvikelse anmäls\n2. Vem utreder den\n" +
        "3. Hur återkoppling sker till den som anmälde" +
        MALL_ANMARKNING,
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

module.exports = { VERKSAMHETSMALLAR, VERKSAMHETSTYP_NAMN, FORRADSMALLAR, KONTAKTMALLAR };
