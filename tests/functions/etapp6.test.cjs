// Etapp 6 (kund nummer två): bevisar plattformsadmin-bootstrap/utnämning, organisations-
// etablering, leverantörsöversikten, pausning/export och hela inbjudningsflödet
// (skapaInbjudan → granskaInbjudan → losInInbjudan) end-to-end mot Firestore/Storage-
// emulatorerna.
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/etapp6.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

const db = admin.firestore();

let antalKlarade = 0;
let antalMisslyckade = 0;

async function test(namn, fn) {
  try {
    await fn();
    antalKlarade++;
    console.log(`  OK   ${namn}`);
  } catch (fel) {
    antalMisslyckade++;
    console.error(`  FEL  ${namn}`);
    console.error(`       ${fel.stack || fel.message}`);
  }
}

function vantaSig(villkor, meddelande) {
  if (!villkor) {
    throw new Error(meddelande);
  }
}

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  await db.collection("users").doc("vanligSuperadmin").set({ role: "superadmin", organisationId: "orgVanlig" });
  await db.collection("users").doc("vanligPersonal").set({ role: "personal", organisationId: "orgVanlig" });
  await db.collection("organisationer").doc("orgVanlig").set({ namn: "Vanlig org", moduler: {} });

  console.log("\nblibForstaPlattformsadmin – bootstrap");
  await test("en vanlig personal (inte superadmin) kan INTE bootstrappa sig till plattformsadmin", () =>
    forvantaFel("permission-denied", () =>
      funcs.blibForstaPlattformsadmin.run({ data: {}, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("en superadmin KAN bootstrappa sig till den första plattformsadmin (ingen finns än)", () =>
    funcs.blibForstaPlattformsadmin.run({ data: {}, auth: { uid: "vanligSuperadmin" } })
  );
  await test("en ANDRA superadmin kan INTE bootstrappa sig själv när en plattformsadmin redan finns", async () => {
    await db.collection("users").doc("annanSuperadmin").set({ role: "superadmin", organisationId: "orgVanlig" });
    await forvantaFel("failed-precondition", () =>
      funcs.blibForstaPlattformsadmin.run({ data: {}, auth: { uid: "annanSuperadmin" } })
    );
  });

  console.log("\ngorTillPlattformsadmin – utnämning av fler");
  await test("en icke-plattformsadmin kan INTE utse en till", () =>
    forvantaFel("permission-denied", () =>
      funcs.gorTillPlattformsadmin.run({ data: { uid: "annanSuperadmin" }, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("en befintlig plattformsadmin KAN utse en till", () =>
    funcs.gorTillPlattformsadmin.run({ data: { uid: "annanSuperadmin" }, auth: { uid: "vanligSuperadmin" } })
  );

  console.log("\nskapaOrganisation – Etapp 6b");
  let nyOrgId;
  await test("en icke-plattformsadmin kan INTE skapa en organisation", () =>
    forvantaFel("permission-denied", () =>
      funcs.skapaOrganisation.run({
        data: { namn: "Otillåten org" },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("en plattformsadmin KAN skapa en ny organisation med standardinställningar", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Ny Kund AB", moduler: { operations: true, intelligence: false } },
      auth: { uid: "vanligSuperadmin" },
    });
    nyOrgId = resultat.orgId;
    vantaSig(Boolean(nyOrgId), "inget orgId returnerades");
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().namn === "Ny Kund AB", "fel namn sparades");
    vantaSig(orgSnap.data().status === "aktiv", "ny organisation ska starta som aktiv");
    vantaSig(orgSnap.data().moduler.operations === true, "operations-modulen sattes inte");
    const budgetSnap = await orgSnap.ref.collection("installningar").doc("geminiBudget").get();
    vantaSig(budgetSnap.exists, "standardbudget skapades inte för den nya organisationen");
  });
  await test("skapaOrganisation utan namn nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skapaOrganisation.run({ data: { namn: "  " }, auth: { uid: "vanligSuperadmin" } })
    )
  );

  console.log("\nskapaOrganisation – Etapp 15a etableringsguide");
  await test("org.nr, kontaktperson och användartak sparas, avtalsstatus börjar som 'offert'", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: {
        namn: "Etableringstest AB",
        orgnr: "556677-8899",
        kontaktperson: { namn: "Kim Testsson", epost: "kim@etableringstest.se" },
        anvandartak: 25,
      },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(resultat.orgId).get();
    const data = orgSnap.data();
    vantaSig(data.orgnr === "556677-8899", "org.nr sparades inte");
    vantaSig(data.kontaktperson?.epost === "kim@etableringstest.se", "kontaktpersonens e-post sparades inte");
    vantaSig(data.anvandartak === 25, "användartaket sparades inte");
    vantaSig(data.avtalsstatus === "offert", "avtalsstatus ska starta som 'offert'");
    vantaSig(data.provperiodSlut === null, "provperiodSlut ska vara null tills 15e sätter den");
  });
  await test("en kontaktperson-e-post skapar automatiskt en superadmin-inbjudan för den nya organisationen", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Autoinbjudan AB", kontaktperson: { epost: "ny.kund@autoinbjudan.se" } },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(Boolean(resultat.inbjudanToken), "ingen inbjudanToken returnerades trots kontakt-e-post");
    const inbjudanSnap = await db.collection("inbjudningar").doc(resultat.inbjudanToken).get();
    vantaSig(inbjudanSnap.exists, "inbjudan skapades inte i Firestore");
    vantaSig(inbjudanSnap.data().organisationId === resultat.orgId, "inbjudan pekar på fel organisation");
    vantaSig(inbjudanSnap.data().roll === "superadmin", "första inbjudan ska vara rollen superadmin");
    vantaSig(inbjudanSnap.data().epost === "ny.kund@autoinbjudan.se", "fel e-post på inbjudan");
  });
  await test("ingen kontaktperson → ingen inbjudanToken (bakåtkompatibelt)", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Utan Kontakt AB" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(resultat.inbjudanToken === null, "inbjudanToken ska vara null utan kontaktperson");
  });
  await test("ett ogiltigt användartak (0) nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skapaOrganisation.run({
        data: { namn: "Ogiltigt Tak AB", anvandartak: 0 },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en ny organisation får ett välkomstchecklista-dokument med alla steg obockade", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Checklista Test AB" },
      auth: { uid: "vanligSuperadmin" },
    });
    const checklistaSnap = await db
      .collection("organisationer")
      .doc(resultat.orgId)
      .collection("installningar")
      .doc("valkomstchecklista")
      .get();
    vantaSig(checklistaSnap.exists, "välkomstchecklistan skapades inte");
    const steg = checklistaSnap.data().steg;
    vantaSig(Object.keys(steg).length > 0, "checklistan saknar steg");
    vantaSig(
      Object.values(steg).every((klar) => klar === false),
      "alla checklistesteg ska börja obockade"
    );
  });

  console.log("\nskapaOrganisation – Etapp 10d verksamhetsmallar");
  await test("en organisation med verksamhetstyp='akutmottagning' får startbibliotekets rutiner, redan godkända", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Akutmottagning Test", verksamhetstyp: "akutmottagning" },
      auth: { uid: "vanligSuperadmin" },
    });
    // Etapp 56a: utökat från 2 till 8 startmallar för akutmottagning (spridda över kliniskt-
    // stod/logistik/administration) – se functions/verksamhetsmallar.js. Etapp 59a
    // (ETAPPLAN12.md, bugfynd): de 2 logistik-mallarna togs bort igen samma dag (ingen vy,
    // ingen sökning, ingen godkännandekö kunde nå dem – men de räknades in i hälsosiffran).
    // 8 → 6.
    vantaSig(resultat.antalMallrutiner === 6, `förväntade 6 mallrutiner, fick ${resultat.antalMallrutiner}`);
    const rutinSnap = await db
      .collection("rutiner")
      .where("organisationId", "==", resultat.orgId)
      .get();
    vantaSig(rutinSnap.size === 6, `förväntade 6 sparade rutiner, fick ${rutinSnap.size}`);
    rutinSnap.forEach((doc) => {
      vantaSig(doc.data().status === "godkand", "mallrutiner ska vara direkt godkända/synliga");
      vantaSig(doc.data().titel.includes("(mall)"), "mallrutinens titel ska vara märkt som mall");
      // Etapp 60c: krävs för att useRutiner.js:s where("borttagen", "==", false) ska hitta dem.
      vantaSig(doc.data().borttagen === false, "mallrutiner ska ha borttagen:false explicit satt");
    });
  });
  await test("en organisation UTAN verksamhetstyp får inga mallrutiner (bakåtkompatibelt)", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Utan Mall Test" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(resultat.antalMallrutiner === 0, "förväntade 0 mallrutiner utan verksamhetstyp");
  });
  await test("ett okänt verksamhetstyp-värde ger inga mallrutiner (fail closed, ingen krasch)", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Okänd Typ Test", verksamhetstyp: "finns-inte" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(resultat.antalMallrutiner === 0, "förväntade 0 mallrutiner för okänd verksamhetstyp");
  });

  console.log("\nskapaOrganisation – Etapp 56b startbibliotek för allt som INTE är en rutin");
  let etapp56bResultat;
  await test("en organisation med verksamhetstyp får förråd/kontakter/introduktionsspår/kompetenskrav", async () => {
    etapp56bResultat = await funcs.skapaOrganisation.run({
      data: { namn: "Etapp56b Test", verksamhetstyp: "akutmottagning" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(etapp56bResultat.antalForradsartiklar === 3, `förväntade 3 förrådsartiklar, fick ${etapp56bResultat.antalForradsartiklar}`);
    vantaSig(etapp56bResultat.antalKontakter === 5, `förväntade 5 kontakter, fick ${etapp56bResultat.antalKontakter}`);
    vantaSig(!!etapp56bResultat.introduktionssparId, "inget introduktionsspår skapades");
    vantaSig(!!etapp56bResultat.kompetenskravId, "inget kompetenskrav skapades");
  });
  await test("de seedade förrådsartiklarna är direkt godkända/synliga", async () => {
    const snap = await db
      .collection("forradsartiklar")
      .where("organisationId", "==", etapp56bResultat.orgId)
      .get();
    vantaSig(snap.size === 3, `förväntade 3 sparade förrådsartiklar, fick ${snap.size}`);
    snap.forEach((doc) => vantaSig(doc.data().status === "godkand", "förrådsartikeln ska vara direkt godkänd"));
  });
  await test("introduktionsspåret pekar på RIKTIGA rutin-id:n bland de nyss seedade mallrutinerna", async () => {
    const sparSnap = await db.collection("introduktionsspar").doc(etapp56bResultat.introduktionssparId).get();
    const data = sparSnap.data();
    vantaSig(data.malRoll === "personal", "fel målroll");
    vantaSig(data.etapper.length >= 1, "inga etapper i spåret");
    const forstaRutinId = data.etapper[0].poster[0].id;
    const rutinSnap = await db.collection("rutiner").doc(forstaRutinId).get();
    vantaSig(rutinSnap.exists, "introduktionsspårets referens pekar på en rutin som inte finns");
    vantaSig(rutinSnap.data().organisationId === etapp56bResultat.orgId, "rutinen tillhör fel organisation");
  });
  await test("kompetenskravet pekar på en riktig kliniskt-stod-rutin", async () => {
    const kravSnap = await db.collection("kompetenskrav").doc(etapp56bResultat.kompetenskravId).get();
    const data = kravSnap.data();
    vantaSig(data.omrade === "kliniskt-stod", "fel område på kompetenskravet");
    const rutinSnap = await db.collection("rutiner").doc(data.rutinId).get();
    vantaSig(rutinSnap.exists && rutinSnap.data().omrade === "kliniskt-stod", "kompetenskravets rutinreferens stämmer inte");
  });
  await test("en organisation UTAN verksamhetstyp får INGET av 56b:s icke-rutininnehåll", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Utan Mall 56b Test" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(resultat.antalForradsartiklar === 0, "förväntade 0 förrådsartiklar utan verksamhetstyp");
    vantaSig(resultat.antalKontakter === 0, "förväntade 0 kontakter utan verksamhetstyp");
    vantaSig(resultat.introduktionssparId === null, "förväntade inget introduktionsspår utan verksamhetstyp");
    vantaSig(resultat.kompetenskravId === null, "förväntade inget kompetenskrav utan verksamhetstyp");
  });

  console.log("\nlistaOrganisationer – Etapp 6a leverantörsöversikt");
  await test("en icke-plattformsadmin kan INTE lista organisationer", () =>
    forvantaFel("permission-denied", () =>
      funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("en plattformsadmin ser BÅDE den gamla och den nya organisationen", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const ids = resultat.organisationer.map((o) => o.orgId);
    vantaSig(ids.includes("orgVanlig"), "orgVanlig saknas i listan");
    vantaSig(ids.includes(nyOrgId), "den nyskapade organisationen saknas i listan");
    const vanlig = resultat.organisationer.find((o) => o.orgId === "orgVanlig");
    vantaSig(vanlig.antalAnvandare >= 2, `förväntade minst 2 användare i orgVanlig, fick ${vanlig.antalAnvandare}`);
  });

  console.log("\nmanadsrapportOrganisationer – Etapp 15c faktureringsunderlag");
  await test("en icke-plattformsadmin kan INTE hämta månadsrapporten", () =>
    forvantaFel("permission-denied", () =>
      funcs.manadsrapportOrganisationer.run({ data: {}, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("rapporten räknar rutiner (exkl. borttagna), AI-kostnad/anrop och Storage-lagring korrekt", async () => {
    const rapportOrg = await funcs.skapaOrganisation.run({
      data: { namn: "Rapportorganisation" },
      auth: { uid: "vanligSuperadmin" },
    });
    const rapportOrgId = rapportOrg.orgId;

    await db.collection("rutiner").doc("rapportRutin1").set({
      titel: "Räknas",
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: rapportOrgId,
    });
    await db.collection("rutiner").doc("rapportRutin2").set({
      titel: "Räknas INTE (borttagen)",
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: rapportOrgId,
      borttagen: true,
    });

    // En "AI-anrop" via reserveraBudget – samma mekanism som tolkaDokument/tolkaForradsbild
    // använder (se kostnadshistorik.test.cjs för samma mönster).
    await funcs.reserveraBudget(rapportOrgId, "nagonAnvandare");

    const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");
    const filInnehall = Buffer.from("x".repeat(1000));
    await bucket.file(`rutiner/kliniskt-stod/rapportRutin1/bild.png`).save(filInnehall);

    const resultat = await funcs.manadsrapportOrganisationer.run({
      data: {},
      auth: { uid: "vanligSuperadmin" },
    });
    const rad = resultat.organisationer.find((o) => o.orgId === rapportOrgId);
    vantaSig(Boolean(rad), "rapportorganisationen saknas i månadsrapporten");
    vantaSig(rad.antalRutiner === 1, `förväntade 1 icke-borttagen rutin, fick ${rad.antalRutiner}`);
    vantaSig(rad.anvantOre === 50, `förväntade 50 öre använt, fick ${rad.anvantOre}`);
    vantaSig(rad.antalAnropUppskattat === 1, `förväntade 1 uppskattat AI-anrop, fick ${rad.antalAnropUppskattat}`);
    vantaSig(rad.lagringBytes === 1000, `förväntade 1000 bytes lagring, fick ${rad.lagringBytes}`);
  });

  console.log("\nsatAvtalsstatus – Etapp 15d avtals-/betalningsflöde (statusflagga)");
  await test("en icke-plattformsadmin kan INTE ändra avtalsstatus", () =>
    forvantaFel("permission-denied", () =>
      funcs.satAvtalsstatus.run({
        data: { orgId: nyOrgId, avtalsstatus: "signerat" },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("en plattformsadmin KAN ändra avtalsstatus till ett giltigt värde", async () => {
    await funcs.satAvtalsstatus.run({
      data: { orgId: nyOrgId, avtalsstatus: "signerat" },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().avtalsstatus === "signerat", "avtalsstatus uppdaterades inte");
  });
  await test("ett ogiltigt avtalsstatus-värde nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satAvtalsstatus.run({
        data: { orgId: nyOrgId, avtalsstatus: "hittepå" },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en okänd organisation ger not-found", () =>
    forvantaFel("not-found", () =>
      funcs.satAvtalsstatus.run({
        data: { orgId: "finns-inte", avtalsstatus: "aktiv" },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("listaOrganisationer visar den uppdaterade avtalsstatusen", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === nyOrgId);
    vantaSig(rad.avtalsstatus === "signerat", `förväntade avtalsstatus 'signerat', fick ${rad.avtalsstatus}`);
  });
  await test("en organisation UTAN avtalsstatus-fält (etablerad före Etapp 15a) antas vara 'aktiv'", async () => {
    // orgVanlig sattes upp längst upp i filen utan något avtalsstatus-fält alls - simulerar
    // en organisation etablerad innan Etapp 15a fanns.
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgVanlig");
    vantaSig(rad.avtalsstatus === "aktiv", `förväntade fallback-avtalsstatus 'aktiv', fick ${rad.avtalsstatus}`);
  });

  console.log("\navtalsstatusAndrad/skapad – Etapp 67 beslutspunkt 2 (ETAPPLAN16.md)");
  await test("satAvtalsstatus sätter avtalsstatusAndrad, synlig via listaOrganisationer", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === nyOrgId);
    vantaSig(
      typeof rad.avtalsstatusAndrad === "string" && !Number.isNaN(Date.parse(rad.avtalsstatusAndrad)),
      `avtalsstatusAndrad ska vara en ISO-tidsstämpel efter satAvtalsstatus, fick ${rad.avtalsstatusAndrad}`
    );
  });
  await test("en organisation vars avtalsstatus ALDRIG ändrats visar null för avtalsstatusAndrad", async () => {
    // orgVanlig har aldrig gått genom satAvtalsstatus i den här testfilen - null betyder
    // "aldrig ändrad sedan Etapp 67 infördes fältet", inte att anropet skulle ha misslyckats.
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgVanlig");
    vantaSig(rad.avtalsstatusAndrad === null, `förväntade null, fick ${rad.avtalsstatusAndrad}`);
  });
  await test("listaOrganisationer returnerar skapad som en ISO-tidsstämpel för en nyetablerad organisation", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === nyOrgId);
    vantaSig(
      typeof rad.skapad === "string" && !Number.isNaN(Date.parse(rad.skapad)),
      `skapad ska vara en ISO-tidsstämpel, fick ${rad.skapad}`
    );
  });

  console.log("\nsatAvtaladArsavgift – Etapp 48c manuellt inmatat avtalat årspris");
  await test("en icke-plattformsadmin kan INTE ändra avtalad årsavgift", () =>
    forvantaFel("permission-denied", () =>
      funcs.satAvtaladArsavgift.run({
        data: { orgId: nyOrgId, avtaladArsavgiftKr: 50000 },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("ett negativt belopp nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satAvtaladArsavgift.run({
        data: { orgId: nyOrgId, avtaladArsavgiftKr: -1 },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en plattformsadmin KAN sätta ett avtalat pris", async () => {
    await funcs.satAvtaladArsavgift.run({
      data: { orgId: nyOrgId, avtaladArsavgiftKr: 75000 },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().avtaladArsavgiftKr === 75000, "avtaladArsavgiftKr uppdaterades inte");
  });
  await test("avtaladArsavgiftKr kan tas bort igen genom att sätta null", async () => {
    await funcs.satAvtaladArsavgift.run({
      data: { orgId: nyOrgId, avtaladArsavgiftKr: null },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().avtaladArsavgiftKr === null, "avtaladArsavgiftKr togs inte bort");
  });
  await test("listaOrganisationer visar null för en organisation som aldrig fått ett pris satt", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgVanlig");
    vantaSig(rad.avtaladArsavgiftKr === null, `förväntade null, fick ${rad.avtaladArsavgiftKr}`);
  });

  console.log("\nsatSokkvotTakPerDygn – Etapp 48d konfigurerbart tak för den delade sökkvoten");
  await test("en icke-plattformsadmin kan INTE ändra sökkvottaket", () =>
    forvantaFel("permission-denied", () =>
      funcs.satSokkvotTakPerDygn.run({
        data: { orgId: nyOrgId, sokkvotTakPerDygn: 20 },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("noll avvisas med invalid-argument (måste vara minst 1)", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satSokkvotTakPerDygn.run({
        data: { orgId: nyOrgId, sokkvotTakPerDygn: 0 },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("ett tak över den delade dygnskvoten (100) avvisas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satSokkvotTakPerDygn.run({
        data: { orgId: nyOrgId, sokkvotTakPerDygn: 101 },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en plattformsadmin KAN sätta ett giltigt tak", async () => {
    await funcs.satSokkvotTakPerDygn.run({
      data: { orgId: nyOrgId, sokkvotTakPerDygn: 20 },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().sokkvotTakPerDygn === 20, "sokkvotTakPerDygn uppdaterades inte");
  });
  await test("sokkvotTakPerDygn kan återställas till standard genom att sätta null", async () => {
    await funcs.satSokkvotTakPerDygn.run({
      data: { orgId: nyOrgId, sokkvotTakPerDygn: null },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().sokkvotTakPerDygn === null, "sokkvotTakPerDygn återställdes inte");
  });

  console.log("\nsatHuvudman – Etapp 54b huvudmannagruppering (ren visning, ingen ny läsväg)");
  await test("en icke-plattformsadmin kan INTE sätta en huvudman", () =>
    forvantaFel("permission-denied", () =>
      funcs.satHuvudman.run({
        data: { orgId: nyOrgId, huvudman: "Regionsjukhuset" },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("en tom text avvisas med invalid-argument (använd null för att ta bort)", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satHuvudman.run({
        data: { orgId: nyOrgId, huvudman: "   " },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en plattformsadmin KAN sätta en huvudman, trimmad", async () => {
    await funcs.satHuvudman.run({
      data: { orgId: nyOrgId, huvudman: "  Regionsjukhuset  " },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().huvudman === "Regionsjukhuset", "huvudman sattes inte (trimmad)");
  });
  await test("huvudman kan tas bort igen genom att sätta null", async () => {
    await funcs.satHuvudman.run({
      data: { orgId: nyOrgId, huvudman: null },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().huvudman === null, "huvudman togs inte bort");
  });
  await test("listaOrganisationer visar null för en organisation utan huvudman", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "vanligSuperadmin" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgVanlig");
    vantaSig(rad.huvudman === null, `förväntade null, fick ${rad.huvudman}`);
  });

  console.log("\nsatProvperiod / kontrolleraProvperioder – Etapp 15e provperiod och automatisk pausning");
  await test("en icke-plattformsadmin kan INTE sätta en provperiod", () =>
    forvantaFel("permission-denied", () =>
      funcs.satProvperiod.run({
        data: { orgId: nyOrgId, provperiodSlut: "2030-01-01" },
        auth: { uid: "vanligPersonal" },
      })
    )
  );
  await test("ett ogiltigt datumformat nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satProvperiod.run({
        data: { orgId: nyOrgId, provperiodSlut: "imorgon" },
        auth: { uid: "vanligSuperadmin" },
      })
    )
  );
  await test("en plattformsadmin KAN sätta en provperiod", async () => {
    await funcs.satProvperiod.run({
      data: { orgId: nyOrgId, provperiodSlut: "2030-01-01" },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().provperiodSlut === "2030-01-01", "provperiodSlut uppdaterades inte");
  });
  await test("provperiodSlut kan tas bort igen genom att sätta null", async () => {
    await funcs.satProvperiod.run({
      data: { orgId: nyOrgId, provperiodSlut: null },
      auth: { uid: "vanligSuperadmin" },
    });
    const orgSnap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(orgSnap.data().provperiodSlut === null, "provperiodSlut togs inte bort");
  });
  await test("kontrolleraProvperioder pausar en aktiv organisation vars provperiod gått ut IGÅR", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Utgången Provperiod AB" },
      auth: { uid: "vanligSuperadmin" },
    });
    const igar = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await funcs.satProvperiod.run({
      data: { orgId: resultat.orgId, provperiodSlut: igar },
      auth: { uid: "vanligSuperadmin" },
    });
    await funcs.kontrolleraProvperioder();
    const orgSnap = await db.collection("organisationer").doc(resultat.orgId).get();
    vantaSig(orgSnap.data().status === "pausad", "organisationen pausades inte trots utgången provperiod");
  });
  await test("kontrolleraProvperioder rör INTE en organisation vars provperiod gäller till IMORGON", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Aktiv Provperiod AB" },
      auth: { uid: "vanligSuperadmin" },
    });
    const imorgon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await funcs.satProvperiod.run({
      data: { orgId: resultat.orgId, provperiodSlut: imorgon },
      auth: { uid: "vanligSuperadmin" },
    });
    await funcs.kontrolleraProvperioder();
    const orgSnap = await db.collection("organisationer").doc(resultat.orgId).get();
    vantaSig(orgSnap.data().status === "aktiv", "organisationen pausades felaktigt trots gällande provperiod");
  });
  await test("kontrolleraProvperioder rör INTE en organisation UTAN provperiodSlut", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Ingen Provperiod AB" },
      auth: { uid: "vanligSuperadmin" },
    });
    await funcs.kontrolleraProvperioder();
    const orgSnap = await db.collection("organisationer").doc(resultat.orgId).get();
    vantaSig(orgSnap.data().status === "aktiv", "organisationen pausades felaktigt utan någon provperiod satt");
  });

  console.log("\npausaOrganisation – Etapp 6d");
  await test("en icke-plattformsadmin kan INTE pausa en organisation", () =>
    forvantaFel("permission-denied", () =>
      funcs.pausaOrganisation.run({ data: { orgId: nyOrgId, pausad: true }, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("en plattformsadmin KAN pausa en organisation", async () => {
    await funcs.pausaOrganisation.run({ data: { orgId: nyOrgId, pausad: true }, auth: { uid: "vanligSuperadmin" } });
    const snap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(snap.data().status === "pausad", "status blev inte 'pausad'");
  });
  await test("en plattformsadmin KAN återaktivera samma organisation", async () => {
    await funcs.pausaOrganisation.run({ data: { orgId: nyOrgId, pausad: false }, auth: { uid: "vanligSuperadmin" } });
    const snap = await db.collection("organisationer").doc(nyOrgId).get();
    vantaSig(snap.data().status === "aktiv", "status blev inte 'aktiv' igen");
  });

  console.log("\nexporteraOrganisation – Etapp 6d GDPR-/uppsägningsexport");
  await test("en icke-plattformsadmin kan INTE exportera en organisation", () =>
    forvantaFel("permission-denied", () =>
      funcs.exporteraOrganisation.run({ data: { orgId: "orgVanlig" }, auth: { uid: "vanligPersonal" } })
    )
  );
  await test("en plattformsadmin KAN exportera en organisation (återanvänder backupaOrganisation)", async () => {
    const resultat = await funcs.exporteraOrganisation.run({
      data: { orgId: "orgVanlig" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(typeof resultat.path === "string" && resultat.path.includes("orgVanlig"), `oväntad path: ${resultat.path}`);
  });

  console.log("\nskapaInbjudan / granskaInbjudan / losInInbjudan – Etapp 6c");
  await test("en icke-superadmin kan INTE skapa en inbjudan", () =>
    forvantaFel("permission-denied", () =>
      funcs.skapaInbjudan.run({
        data: { epost: "ny@exempel.se", roll: "personal" },
        auth: { uid: "vanligPersonal" },
      })
    )
  );

  let token;
  await test("en superadmin KAN skapa en inbjudan till sin EGEN organisation", async () => {
    const resultat = await funcs.skapaInbjudan.run({
      data: { epost: "Ny@Exempel.se", roll: "personal" },
      auth: { uid: "vanligSuperadmin" },
    });
    token = resultat.token;
    vantaSig(typeof token === "string" && token.length > 10, "inget rimligt token returnerades");
  });

  await test("granskaInbjudan (utan inloggning) visar epost/roll/organisationsnamn, inte organisationId", async () => {
    const resultat = await funcs.granskaInbjudan.run({ data: { token }, auth: undefined });
    vantaSig(resultat.epost === "ny@exempel.se", "e-post normaliserades inte till gemener");
    vantaSig(resultat.roll === "personal", "fel roll");
    vantaSig(resultat.organisationsNamn === "Vanlig org", "fel organisationsnamn");
  });

  await test("granskaInbjudan med okänt token ger not-found", () =>
    forvantaFel("not-found", () => funcs.granskaInbjudan.run({ data: { token: "finns-inte" }, auth: undefined }))
  );

  await test("losInInbjudan nekas om inloggad e-post inte matchar inbjudans e-post", () =>
    forvantaFel("permission-denied", () =>
      funcs.losInInbjudan.run({
        data: { token, namn: "Ny Person" },
        auth: { uid: "nyttKontoFelEpost", token: { email: "annan@exempel.se" } },
      })
    )
  );

  await test("losInInbjudan lyckas när e-post matchar – skapar users/{uid} med rätt roll/org", async () => {
    await funcs.losInInbjudan.run({
      data: { token, namn: "Ny Person" },
      auth: { uid: "nyttKontoRattEpost", token: { email: "ny@exempel.se" } },
    });
    const userSnap = await db.collection("users").doc("nyttKontoRattEpost").get();
    vantaSig(userSnap.exists, "users/{uid} skapades inte");
    vantaSig(userSnap.data().role === "personal", "fel roll");
    vantaSig(userSnap.data().organisationId === "orgVanlig", "fel organisationId");
  });

  console.log("\nlosInInbjudan – Etapp 19a: automatisk tilldelning av introduktionsspår");
  await test("ett konto UTAN matchande introduktionsspår för sin roll får INGEN tilldelning", async () => {
    const tilldelningSnap = await db.collection("introduktionstilldelningar").doc("nyttKontoRattEpost").get();
    vantaSig(!tilldelningSnap.exists, "en tilldelning skapades trots att inget spår för rollen 'personal' fanns än");
  });
  await test("ett konto vars roll HAR ett introduktionsspår får en automatisk tilldelning", async () => {
    await db.collection("introduktionsspar").doc("sparPersonalOrgVanlig").set({
      namn: "Introduktion för personal",
      malRoll: "personal",
      organisationId: "orgVanlig",
      etapper: [{ namn: "Dag 1", poster: [] }],
    });
    const { token: nyttToken } = await funcs.skapaInbjudan.run({
      data: { epost: "spar-test@exempel.se", roll: "personal" },
      auth: { uid: "vanligSuperadmin" },
    });
    await funcs.losInInbjudan.run({
      data: { token: nyttToken, namn: "Spårtest Personsson" },
      auth: { uid: "sparTestUid", token: { email: "spar-test@exempel.se" } },
    });
    const tilldelningSnap = await db.collection("introduktionstilldelningar").doc("sparTestUid").get();
    vantaSig(tilldelningSnap.exists, "ingen automatisk tilldelning skapades trots matchande spår");
    vantaSig(tilldelningSnap.data().sparId === "sparPersonalOrgVanlig", "fel sparId på tilldelningen");
    vantaSig(tilldelningSnap.data().malRoll === "personal", "fel malRoll på tilldelningen");
  });

  await test("samma token kan INTE lösas in en andra gång", () =>
    forvantaFel("failed-precondition", () =>
      funcs.losInInbjudan.run({
        data: { token, namn: "Någon annan" },
        auth: { uid: "annatKonto", token: { email: "ny@exempel.se" } },
      })
    )
  );

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
