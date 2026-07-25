// Etapp 7d: bevisar att klinikstöd-sökningens hastighetstak (MAX_KLINIKSTOD_FRAGOR_PER_TIMME,
// se functions/index.js) faktiskt stoppar en användare efter för många anrop inom samma
// rullande timme, oavsett kronbudgeten. Testar kontrolleraOchOkaHastighet direkt (samma mönster
// som modulgating.test.cjs testar kravModul direkt) istället för att låta 21 riktiga anrop nå
// sökmotorn/Gemini, vilket skulle vara långsamt och kräva riktiga secrets i testmiljön.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/klinikstodratelimit.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const funcs = require("../../functions/index.js");

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

async function main() {
  const MAX = 20;

  await test(`tillåter de första ${MAX} anropen inom samma timme`, async () => {
    for (let i = 0; i < MAX; i++) {
      await funcs.kontrolleraOchOkaHastighet("uidLoop", "klinikstod", MAX);
    }
  });

  await test(`nekar (resource-exhausted) anrop nummer ${MAX + 1} inom samma timme`, async () => {
    try {
      await funcs.kontrolleraOchOkaHastighet("uidLoop", "klinikstod", MAX);
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "resource-exhausted", `fel kod: ${fel.code}`);
    }
  });

  await test("en ANNAN användare påverkas inte av att uidLoop nått sitt tak", () =>
    funcs.kontrolleraOchOkaHastighet("uidAnnan", "klinikstod", MAX)
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
