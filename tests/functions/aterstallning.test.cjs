// Etapp 33a/33b: bevisar att aterstallOrganisation() faktiskt kan läsa tillbaka en backup som
// backupaOrganisation() skrev – seeda → backup → radera → återställ → verifiera att allt är
// identiskt, inklusive att Timestamp-fält blir riktiga Timestamps igen, inte bara vanliga
// maps. Utan detta test är 33a bara mer otestad kod.
//
// Körs mot Firestore- OCH Storage-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/aterstallning.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
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

async function vantaSigKastar(lofte, meddelande) {
  try {
    await lofte;
    throw new Error(meddelande);
  } catch (fel) {
    if (fel.message === meddelande) throw fel;
  }
}

async function main() {
  const ORG = "org33bAterstall";
  const ANNAN_ORG = "org33bAnnan";

  await db.collection("rutiner").doc("rutin33b").set({
    titel: "En rutin värd att spara",
    organisationId: ORG,
    omrade: "kliniskt-stod",
    status: "godkand",
    skapad: admin.firestore.Timestamp.now(),
  });
  await db.collection("kontakter").doc("kontakt33b").set({
    namn: "Larm",
    nummer: "112",
    organisationId: ORG,
  });
  // En annan organisations dokument, av misstag i samma backup-JSON (simulerar en
  // manipulerad eller felskriven fil) – ska INTE återställas, oavsett vad filen påstår.
  const forfalskadBackup = {
    orgId: ORG,
    datum: "2026-07-31",
    samlingar: {
      rutiner: [
        {
          id: "rutin33bForfalskad",
          titel: "Hör inte hemma här",
          organisationId: ANNAN_ORG,
          omrade: "kliniskt-stod",
          status: "godkand",
        },
      ],
    },
  };

  console.log("\nbackupaOrganisation → radera → aterstallOrganisation – identiskt innehåll");
  let backupPath;
  await test("backupaOrganisation skriver en fil", async () => {
    backupPath = await funcs.backupaOrganisation(ORG);
    vantaSig(backupPath.startsWith(`backups/${ORG}/`), `oväntad path: ${backupPath}`);
  });

  await db.collection("rutiner").doc("rutin33b").delete();
  await db.collection("kontakter").doc("kontakt33b").delete();

  await test("efter radering finns dokumenten inte längre", async () => {
    const snap = await db.collection("rutiner").doc("rutin33b").get();
    vantaSig(!snap.exists, "dokumentet fanns kvar trots radering");
  });

  await test("aterstallOrganisation skriver tillbaka exakt samma innehåll", async () => {
    const antal = await funcs.aterstallOrganisation(ORG, backupPath);
    vantaSig(antal === 2, `förväntade 2 återställda dokument, fick ${antal}`);

    const rutinSnap = await db.collection("rutiner").doc("rutin33b").get();
    vantaSig(rutinSnap.exists, "rutinen återställdes inte");
    const rutinData = rutinSnap.data();
    vantaSig(rutinData.titel === "En rutin värd att spara", "fel titel efter återställning");
    vantaSig(
      rutinData.skapad instanceof admin.firestore.Timestamp,
      "skapad-fältet är inte en riktig Timestamp efter återställning (bara en vanlig map)"
    );

    const kontaktSnap = await db.collection("kontakter").doc("kontakt33b").get();
    vantaSig(kontaktSnap.exists && kontaktSnap.data().nummer === "112", "kontakten återställdes inte korrekt");
  });

  console.log("\naterstallOrganisation – säkerhetsspärrar");
  await test("vägrar en sökväg som INTE ligger under organisationens egen mapp", async () => {
    await vantaSigKastar(
      funcs.aterstallOrganisation(ORG, `backups/${ANNAN_ORG}/2026-07-31.json`),
      "borde ha kastat invalid-argument"
    );
  });

  const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");
  const forfalskadPath = `backups/${ORG}/forfalskad.json`;
  await bucket.file(forfalskadPath).save(JSON.stringify(forfalskadBackup), { contentType: "application/json" });

  await test("hoppar över dokument vars organisationId inte matchar, trots att filen påstår det", async () => {
    await funcs.aterstallOrganisation(ORG, forfalskadPath);
    const snap = await db.collection("rutiner").doc("rutin33bForfalskad").get();
    vantaSig(!snap.exists, "ett dokument från en ANNAN organisation skrevs in trots skyddet");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
