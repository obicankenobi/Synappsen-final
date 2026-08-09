#!/usr/bin/env node
// Etapp 49b: mäter en riktig återställningstid (RTO) mot SKARP Firestore/Storage, inte
// emulatorn – körs ENDAST via .github/workflows/rto-matning.yml (workflow_dispatch, manuellt
// triggad), aldrig lokalt eller vid en vanlig push/deploy. Skapar en tydligt märkt, syntetisk
// testorganisation ("_rto_matning_<tidsstämpel>", samma "_"-konvention som "_plattform" redan
// använder i loggaRevision för att markera "detta är inte en riktig kund"), fyller den med en
// representativ mängd data, tar en backup, tidsätter en riktig återställning, och städar bort
// ALLT den skapade – inklusive backupfilen – innan skriptet avslutas. Rör ALDRIG någon
// befintlig organisations data (skriver bara till dokument med sitt eget, unika orgId).
//
// Kräver GOOGLE_APPLICATION_CREDENTIALS (satt av google-github-actions/auth@v2 i workflowen)
// – ingen emulator-variabel sätts här med flit, så admin.initializeApp() i ../index.js
// ansluter mot den RIKTIGA produktionsdatabasen.

const admin = require("firebase-admin");
const funcs = require("../index.js");

const db = admin.firestore();
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

const ORG_ID = `_rto_matning_${Date.now()}`;
const ANTAL_RUTINER = 50;
const ANTAL_ANSLAG = 20;
const ANTAL_KONTAKTER = 10;
const ANTAL_FORRADSARTIKLAR = 20;

function batchSkriv(samling, antal, byggFalt) {
  const batch = db.batch();
  const refs = [];
  for (let i = 0; i < antal; i++) {
    const ref = db.collection(samling).doc();
    batch.set(ref, { organisationId: ORG_ID, ...byggFalt(i) });
    refs.push(ref);
  }
  return { batch, refs };
}

async function main() {
  console.log(`RTO-mätning: skapar syntetisk testorganisation ${ORG_ID}`);
  const skapadeRefs = [db.collection("organisationer").doc(ORG_ID)];

  await skapadeRefs[0].set({
    namn: "RTO-mätning (automatiskt skript – ska ALDRIG finnas kvar, se .github/workflows/rto-matning.yml)",
    moduler: { operations: true },
    skapadAvSkript: true,
  });

  const samlingar = [
    ["rutiner", ANTAL_RUTINER, (i) => ({ titel: `RTO-testrutin ${i}`, omrade: "kliniskt-stod", status: "godkand", innehall: "Genererad text ".repeat(50) })],
    ["anslag", ANTAL_ANSLAG, (i) => ({ titel: `RTO-testanslag ${i}`, omrade: "administration", innehall: "Genererad text ".repeat(20) })],
    ["kontakter", ANTAL_KONTAKTER, (i) => ({ namn: `RTO-testkontakt ${i}`, nummer: "112" })],
    ["forradsartiklar", ANTAL_FORRADSARTIKLAR, (i) => ({ namn: `RTO-testartikel ${i}`, forrad: "test", saldo: "ok" })],
  ];

  for (const [samling, antal, byggFalt] of samlingar) {
    const { batch, refs } = batchSkriv(samling, antal, byggFalt);
    await batch.commit();
    skapadeRefs.push(...refs);
  }
  console.log(`RTO-mätning: seedade ${skapadeRefs.length - 1} dokument över ${samlingar.length} collections`);

  let backupPath;
  try {
    backupPath = await funcs.backupaOrganisation(ORG_ID);
    console.log(`RTO-mätning: backup skriven till ${backupPath}`);

    const start = Date.now();
    const antalAterstallda = await funcs.aterstallOrganisation(ORG_ID, backupPath);
    const tidMs = Date.now() - start;

    console.log(`RTO_MATNING_RESULTAT: ${tidMs} ms för ${antalAterstallda} dokument (${ORG_ID})`);
  } finally {
    console.log("RTO-mätning: städar bort testorganisationen...");
    const BATCHSTORLEK = 400;
    for (let i = 0; i < skapadeRefs.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const ref of skapadeRefs.slice(i, i + BATCHSTORLEK)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
    if (backupPath) {
      await bucket.file(backupPath).delete().catch((fel) => {
        console.error(`RTO-mätning: kunde INTE ta bort backupfilen ${backupPath} – ta bort den manuellt:`, fel.message);
      });
    }
    console.log("RTO-mätning: städning klar.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((fel) => {
    console.error("RTO-mätningen kraschade:", fel);
    process.exit(1);
  });
