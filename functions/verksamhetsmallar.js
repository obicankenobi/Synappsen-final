// Etapp 10d: startbibliotek av rutiner per verksamhetstyp, så att en ny kundorganisation
// inte möts av en helt tom app direkt efter etablering (se skapaOrganisation i index.js).
// Innehållet är MEDVETET strukturella exempel/platshållare, inte färdig klinisk vägledning –
// varje rutin är tydligt märkt som mall och ska granskas/ersättas av verksamheten innan den
// litas på. Att låtsas att AI-genererat eller hårdkodat exempelinnehåll är verifierad klinisk
// praxis vore både medicinskt och juridiskt oansvarigt.
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
  ],
};

const VERKSAMHETSTYP_NAMN = {
  akutmottagning: "Akutmottagning",
  vardcentral: "Vårdcentral",
  hemtjanst: "Kommunal hemtjänst",
};

module.exports = { VERKSAMHETSMALLAR, VERKSAMHETSTYP_NAMN };
