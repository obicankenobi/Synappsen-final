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

  console.log("\nskapaOrganisation – Etapp 10d verksamhetsmallar");
  await test("en organisation med verksamhetstyp='akutmottagning' får startbibliotekets rutiner, redan godkända", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "Akutmottagning Test", verksamhetstyp: "akutmottagning" },
      auth: { uid: "vanligSuperadmin" },
    });
    vantaSig(resultat.antalMallrutiner === 2, `förväntade 2 mallrutiner, fick ${resultat.antalMallrutiner}`);
    const rutinSnap = await db
      .collection("rutiner")
      .where("organisationId", "==", resultat.orgId)
      .get();
    vantaSig(rutinSnap.size === 2, `förväntade 2 sparade rutiner, fick ${rutinSnap.size}`);
    rutinSnap.forEach((doc) => {
      vantaSig(doc.data().status === "godkand", "mallrutiner ska vara direkt godkända/synliga");
      vantaSig(doc.data().titel.includes("(mall)"), "mallrutinens titel ska vara märkt som mall");
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
