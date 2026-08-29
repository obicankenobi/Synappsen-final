// Cloud Functions för Synappsen.
//
// Etapp 61a (ETAPPLAN12.md): den här filen var tidigare ~4700 rader med ~93 exports.
// Koden ligger nu i domänfiler bredvid (se listan nedan) och den här filen är BARA en
// tunn skarv som åter-exporterar dem. Två saker beror på att den fortsätter göra det:
// (1) functions/package.json pekar hit ("main"), så firebase deploy hittar varje Cloud
// Function genom att läsa exports här, och (2) varje test i tests/functions/*.test.cjs
// gör require("../../functions/index.js") och anropar funktionerna direkt härifrån.
//
// Namnen listas MEDVETET explicit i stället för en svepande Object.assign: listan är
// exakt den uppsättning exports den odelade filen hade, varken mer eller mindre.
// firebase-functions letar rekursivt igenom det här objektet efter Cloud Functions, så
// interna delade värden (db, admin, bucket …) ska inte synas här.

// ── gemensamt.js – delade grundstenar (onCall-omslag, db, hemligheter, hjälpfunktioner)
const gemensamt = require("./gemensamt");
exports.kravModul = gemensamt.kravModul;
exports.skickaEpost = gemensamt.skickaEpost;
exports.kontrolleraOchOkaHastighet = gemensamt.kontrolleraOchOkaHastighet;
exports.okaSokkvot = gemensamt.okaSokkvot;
exports.reserveraBudget = gemensamt.reserveraBudget;
exports.loggaRevision = gemensamt.loggaRevision;
exports.verifieraRevisionskedja = gemensamt.verifieraRevisionskedja;
exports.skickaPush = gemensamt.skickaPush;
exports.hamtaAnvandareMedPushPreferens = gemensamt.hamtaAnvandareMedPushPreferens;
exports.hamtaAnvandareForEpostPaminnelse = gemensamt.hamtaAnvandareForEpostPaminnelse;
exports.koaEpostPaminnelse = gemensamt.koaEpostPaminnelse;

// ── ai-import.js – AI-import (Gemini)
const ai_import = require("./ai-import");
exports.tolkaForradsbild = ai_import.tolkaForradsbild;
exports.tolkaDokument = ai_import.tolkaDokument;
exports.foreslaChecklistSteg = ai_import.foreslaChecklistSteg;
exports.foreslaKvissfragor = ai_import.foreslaKvissfragor;

// ── klinikstod.js – klinikstöd och källbevakning
const klinikstod = require("./klinikstod");
exports.kontrolleraKallbevakning = klinikstod.kontrolleraKallbevakning;
exports.kallbevakningSchemalagt = klinikstod.kallbevakningSchemalagt;
exports.fragaKlinisktStod = klinikstod.fragaKlinisktStod;
exports.testaBeroenden = klinikstod.testaBeroenden;
exports.verifieraKlinikstod = klinikstod.verifieraKlinikstod;
exports.verifieraKlinikstodSchemalagt = klinikstod.verifieraKlinikstodSchemalagt;

// ── organisationsadmin.js – administration inom en organisation
const organisationsadmin = require("./organisationsadmin");
exports.tvingaUtloggning = organisationsadmin.tvingaUtloggning;
exports.uppdateraAnvandarRoll = organisationsadmin.uppdateraAnvandarRoll;
exports.satAnvandareAvstangd = organisationsadmin.satAnvandareAvstangd;
exports.raderaAnvandare = organisationsadmin.raderaAnvandare;
exports.satKioskPin = organisationsadmin.satKioskPin;
exports.verifieraKioskPin = organisationsadmin.verifieraKioskPin;
exports.uppdateraModuler = organisationsadmin.uppdateraModuler;
exports.uppdateraMfaPolicy = organisationsadmin.uppdateraMfaPolicy;
exports.uppdateraGeminiBudgetTak = organisationsadmin.uppdateraGeminiBudgetTak;
exports.skapaKommentar = organisationsadmin.skapaKommentar;
exports.skickaFeedback = organisationsadmin.skickaFeedback;

// ── backup.js – backup, gallring och återställning
const backup = require("./backup");
exports.veckovisBackupSchemalagt = backup.veckovisBackupSchemalagt;
exports.backupaOrganisation = backup.backupaOrganisation;
exports.gallraGamlaBackuper = backup.gallraGamlaBackuper;
exports.backupGallringSchemalagt = backup.backupGallringSchemalagt;
exports.aterstallOrganisation = backup.aterstallOrganisation;
exports.aterstallOrganisationCallable = backup.aterstallOrganisationCallable;
exports.listaBackuper = backup.listaBackuper;

// ── revisionslogg.js – revisionsloggens kedjekontroll
const revisionslogg = require("./revisionslogg");
exports.verifieraRevisionskedjor = revisionslogg.verifieraRevisionskedjor;
exports.verifieraRevisionskedjorSchemalagt = revisionslogg.verifieraRevisionskedjorSchemalagt;
exports.verifieraRevisionsloggAdmin = revisionslogg.verifieraRevisionsloggAdmin;
exports.exporteraRevisionslogg = revisionslogg.exporteraRevisionslogg;

// ── notiser.js – notiser, triggers och påminnelser
const notiser = require("./notiser");
exports.loggaRutinSkapadTrigger = notiser.loggaRutinSkapadTrigger;
exports.hanteraRutinSkapad = notiser.hanteraRutinSkapad;
exports.loggaRutinAndradTrigger = notiser.loggaRutinAndradTrigger;
exports.hanteraRutinAndrad = notiser.hanteraRutinAndrad;
exports.hanteraBristanmalningSkapad = notiser.hanteraBristanmalningSkapad;
exports.hanteraBristanmalningSkapadTrigger = notiser.hanteraBristanmalningSkapadTrigger;
exports.hanteraGranskningsrundaSkapad = notiser.hanteraGranskningsrundaSkapad;
exports.hanteraGranskningsrundaSkapadTrigger = notiser.hanteraGranskningsrundaSkapadTrigger;
exports.kontrolleraKvitteringsfrister = notiser.kontrolleraKvitteringsfrister;
exports.kvitteringsfristerSchemalagt = notiser.kvitteringsfristerSchemalagt;
exports.kontrolleraForslagPaminnelser = notiser.kontrolleraForslagPaminnelser;
exports.forslagPaminnelserSchemalagt = notiser.forslagPaminnelserSchemalagt;
exports.skickaEpostPaminnelser = notiser.skickaEpostPaminnelser;
exports.skickaEpostPaminnelserSchemalagt = notiser.skickaEpostPaminnelserSchemalagt;

// ── matvarden.js – mätvärden och rapportering
const matvarden = require("./matvarden");
exports.beraknaHalsaServer = matvarden.beraknaHalsaServer;
exports.kvitteringsgradServer = matvarden.kvitteringsgradServer;
exports.skapaMatvardenSnapshot = matvarden.skapaMatvardenSnapshot;
exports.matvardenSnapshotSchemalagt = matvarden.matvardenSnapshotSchemalagt;
exports.skickaManadssammanfattningar = matvarden.skickaManadssammanfattningar;
exports.skickaManadssammanfattningarSchemalagt = matvarden.skickaManadssammanfattningarSchemalagt;
exports.beraknaKvartal = matvarden.beraknaKvartal;
exports.svaraPersonalpuls = matvarden.svaraPersonalpuls;
exports.exporteraReferensunderlag = matvarden.exporteraReferensunderlag;

// ── plattformsdrift.js – plattformsdrift och support
const plattformsdrift = require("./plattformsdrift");
exports.angeEpostAvstangd = plattformsdrift.angeEpostAvstangd;
exports.hamtaBackupstatus = plattformsdrift.hamtaBackupstatus;
exports.hamtaOrganisationsdiagnostik = plattformsdrift.hamtaOrganisationsdiagnostik;
exports.migreraTillOrganisation = plattformsdrift.migreraTillOrganisation;
exports.backfillaBorttagenFalt = plattformsdrift.backfillaBorttagenFalt;
exports.blibForstaPlattformsadmin = plattformsdrift.blibForstaPlattformsadmin;
exports.gorTillPlattformsadmin = plattformsdrift.gorTillPlattformsadmin;
exports.skapaLeverantorskonto = plattformsdrift.skapaLeverantorskonto;
exports.flyttaTillPlattformskonto = plattformsdrift.flyttaTillPlattformskonto;
exports.hamtaLeverantorsAtgardslogg = plattformsdrift.hamtaLeverantorsAtgardslogg;
exports.hamtaKundensLeverantorshistorik = plattformsdrift.hamtaKundensLeverantorshistorik;

// ── kvissbank.js – Etapp 71: frågebanken bakom Öva-läget (leverantörens globala frågor,
// kundens överlagringar och egna frågor, paketpaus på båda nivåerna)
const kvissbank = require("./kvissbank");
exports.sparaGlobalKvissfraga = kvissbank.sparaGlobalKvissfraga;
exports.taBortGlobalKvissfraga = kvissbank.taBortGlobalKvissfraga;
exports.satGlobaltKvisspaketStopp = kvissbank.satGlobaltKvisspaketStopp;
exports.satKvisspaket = kvissbank.satKvisspaket;
exports.sparaKvissoverlagring = kvissbank.sparaKvissoverlagring;
exports.aterstallKvissoverlagring = kvissbank.aterstallKvissoverlagring;
exports.sparaEgenKvissfraga = kvissbank.sparaEgenKvissfraga;
exports.taBortEgenKvissfraga = kvissbank.taBortEgenKvissfraga;
exports.seedaKvissbank = kvissbank.seedaKvissbank;

// ── atagandekalender.js – Etapp L1o: återkommande leverantörsskyldigheter som signaler
const atagandekalender = require("./atagandekalender");
exports.seedaAtagandekalender = atagandekalender.seedaAtagandekalender;
exports.sattAtagandeUtfort = atagandekalender.sattAtagandeUtfort;

// ── organisationslivscykel.js – etablering av en ny organisation + demo-/övningsmiljön
const organisationslivscykel = require("./organisationslivscykel");
exports.skapaOrganisation = organisationslivscykel.skapaOrganisation;
exports.seedaStartbibliotek = organisationslivscykel.seedaStartbibliotek;
exports.listaOrganisationer = organisationslivscykel.listaOrganisationer;
exports.nollstallDemoOrganisation = organisationslivscykel.nollstallDemoOrganisation;
exports.nollstallDemoOrganisationSchemalagt = organisationslivscykel.nollstallDemoOrganisationSchemalagt;

// ── avtalslivscykel.js – avtal/provperiod, månadsrapport, paus, export, radering, support
const avtalslivscykel = require("./avtalslivscykel");
exports.satAvtalsstatus = avtalslivscykel.satAvtalsstatus;
exports.satProvperiod = avtalslivscykel.satProvperiod;
exports.satAvtaladArsavgift = avtalslivscykel.satAvtaladArsavgift;
exports.satSokkvotTakPerDygn = avtalslivscykel.satSokkvotTakPerDygn;
exports.satHuvudman = avtalslivscykel.satHuvudman;
exports.satPubAvtal = avtalslivscykel.satPubAvtal;
exports.satUnderbitradeUnderrattad = avtalslivscykel.satUnderbitradeUnderrattad;
exports.satOmfattasAvNIS2 = avtalslivscykel.satOmfattasAvNIS2;
exports.satAtagandeblock = avtalslivscykel.satAtagandeblock;
exports.begarReferensunderlag = avtalslivscykel.begarReferensunderlag;

// ── incidentklocka.js – Etapp L1p punkt 3: 72/24-timmarsklockan vid en personuppgiftsincident
const incidentklocka = require("./incidentklocka");
exports.startaIncident = incidentklocka.startaIncident;
exports.kvitteraIncidentunderrattelse = incidentklocka.kvitteraIncidentunderrattelse;
exports.kontrolleraProvperioder = avtalslivscykel.kontrolleraProvperioder;
exports.kontrolleraProvperioderSchemalagt = avtalslivscykel.kontrolleraProvperioderSchemalagt;
exports.manadsrapportOrganisationer = avtalslivscykel.manadsrapportOrganisationer;
exports.pausaOrganisation = avtalslivscykel.pausaOrganisation;
exports.exporteraOrganisation = avtalslivscykel.exporteraOrganisation;
exports.begarRaderingAvOrganisation = avtalslivscykel.begarRaderingAvOrganisation;
exports.avbrytRaderingAvOrganisation = avtalslivscykel.avbrytRaderingAvOrganisation;
exports.beviljaSupportAtkomst = avtalslivscykel.beviljaSupportAtkomst;
exports.avslutaSupportAtkomst = avtalslivscykel.avslutaSupportAtkomst;
exports.raderaOrganisationensData = avtalslivscykel.raderaOrganisationensData;
exports.utforSchemalagdRaderingSchemalagt = avtalslivscykel.utforSchemalagdRaderingSchemalagt;

// ── inbjudningar.js – inbjudningsflödet
const inbjudningar = require("./inbjudningar");
exports.skapaInbjudan = inbjudningar.skapaInbjudan;
exports.granskaInbjudan = inbjudningar.granskaInbjudan;
exports.losInInbjudan = inbjudningar.losInInbjudan;
