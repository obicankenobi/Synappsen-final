// Etapp 53c: bevisar e-postpåminnelsernas hela kedja – hamtaAnvandareForEpostPaminnelse
// (opt-OUT-urval, motsatt push), koaEpostPaminnelse (köar, dedupar INTE identiska poster bort
// – arrayUnion jämför per objekt), skickaEpostPaminnelser (en sammanslagen digest per
// användare, tömmer kön oavsett om själva utskicket lyckades), samt att
// kontrolleraKvitteringsfrister/kontrolleraForslagPaminnelser faktiskt köar mot den nya
// kanalen.
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/epostpaminnelser.test.cjs"
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

async function main() {
  console.log("\nhamtaAnvandareForEpostPaminnelse – opt-OUT-förval (motsatt push)");
  const org = "orgEpostPamin53c";
  await db.collection("users").doc("epA1").set({ organisationId: org, role: "personal", email: "a1@exempel.se" });
  await db.collection("users").doc("epA2").set({
    organisationId: org,
    role: "personal",
    email: "a2@exempel.se",
    epostInstallningar: { paminnelser: false },
  });
  await db.collection("users").doc("epA3").set({ organisationId: org, role: "personal" }); // ingen e-post satt
  await test("ingen explicit inställning alls => INKLUDERAS (opt-out, inte opt-in)", async () => {
    const mottagare = await funcs.hamtaAnvandareForEpostPaminnelse(org);
    vantaSig(mottagare.some((a) => a.id === "epA1"), "epA1 borde inkluderats trots inget aktivt val");
  });
  await test("paminnelser: false => UTESLUTS", async () => {
    const mottagare = await funcs.hamtaAnvandareForEpostPaminnelse(org);
    vantaSig(!mottagare.some((a) => a.id === "epA2"), "epA2 borde uteslutits");
  });
  await test("en användare utan e-postadress alls => UTESLUTS (inget att skicka till)", async () => {
    const mottagare = await funcs.hamtaAnvandareForEpostPaminnelse(org);
    vantaSig(!mottagare.some((a) => a.id === "epA3"), "epA3 (ingen e-post) borde uteslutits");
  });

  console.log("\nkoaEpostPaminnelse – köar flera poster för samma användare");
  await test("två köade poster hamnar båda i samma användares kö", async () => {
    await funcs.koaEpostPaminnelse("epKo1", org, "ko1@exempel.se", "Första posten", "/anslag");
    await funcs.koaEpostPaminnelse("epKo1", org, "ko1@exempel.se", "Andra posten", "/kliniskt-stod");
    const snap = await db.collection("epostPaminnelseko").doc("epKo1").get();
    vantaSig(snap.exists, "kön skapades inte");
    vantaSig(snap.data().poster.length === 2, `förväntade 2 köade poster, fick ${snap.data().poster.length}`);
    vantaSig(snap.data().epost === "ko1@exempel.se", "fel e-postadress sparad");
  });
  await test("koaEpostPaminnelse no-opar tyst utan en e-postadress", async () => {
    await funcs.koaEpostPaminnelse("epKoIngenEpost", org, null, "Text", "/");
    const snap = await db.collection("epostPaminnelseko").doc("epKoIngenEpost").get();
    vantaSig(!snap.exists, "ingen kö skulle skapats utan en e-postadress");
  });

  console.log("\nskickaEpostPaminnelser – sammanslagen digest, tömmer kön");
  const ursprungligFetch = global.fetch;
  await test("en digest med två poster skickas som ETT mejl, kön töms efteråt", async () => {
    process.env.BREVO_API_KEY = "testnyckel";
    let anrop = null;
    global.fetch = async (url, init) => {
      anrop = JSON.parse(init.body);
      return { ok: true };
    };
    try {
      await funcs.skickaEpostPaminnelser();
    } finally {
      global.fetch = ursprungligFetch;
      delete process.env.BREVO_API_KEY;
    }
    vantaSig(!!anrop, "inget mejl skickades");
    vantaSig(anrop.to[0].email === "ko1@exempel.se", "fel mottagare");
    vantaSig(anrop.subject.includes("2 påminnelser"), `fel ämnesrad: ${anrop.subject}`);
    vantaSig(anrop.textContent.includes("Första posten") && anrop.textContent.includes("Andra posten"),
      "digesten saknar en av posterna");
    const snap = await db.collection("epostPaminnelseko").doc("epKo1").get();
    vantaSig(!snap.exists, "kön skulle ha tömts/raderats efter utskick");
  });
  await test("ett misslyckat utskick töms ändå ur kön (aldrig en oändlig kö)", async () => {
    await funcs.koaEpostPaminnelse("epKoFel", org, "fel@exempel.se", "Text", "/");
    process.env.BREVO_API_KEY = "testnyckel";
    global.fetch = async () => {
      throw new Error("Simulerat nätverksfel");
    };
    try {
      await funcs.skickaEpostPaminnelser();
    } finally {
      global.fetch = ursprungligFetch;
      delete process.env.BREVO_API_KEY;
    }
    const snap = await db.collection("epostPaminnelseko").doc("epKoFel").get();
    vantaSig(!snap.exists, "kön skulle ha tömts trots det misslyckade utskicket");
  });

  console.log("\nkontrolleraKvitteringsfrister – köar nu ÄVEN e-post för opt-out-mottagare");
  await test("en kvitteringsfrist köar ett e-postmeddelande för en berörd användare", async () => {
    const orgFrist = "orgEpostFrist53c";
    await db.collection("users").doc("epFristA").set({
      organisationId: orgFrist,
      role: "personal",
      email: "frist@exempel.se",
    });
    const imorgon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.collection("anslag").doc("anslagEpostFrist").set({
      organisationId: orgFrist,
      titel: "Ett anslag att kvittera",
      kvitteringsfrist: imorgon,
      lasteAv: [],
    });
    await funcs.kontrolleraKvitteringsfrister();
    const ko = await db.collection("epostPaminnelseko").doc("epFristA").get();
    vantaSig(ko.exists, "e-postkön skapades inte för epFristA");
    vantaSig(ko.data().poster.some((p) => p.text.includes("Ett anslag att kvittera")), "fel innehåll i kön");
    const anslag = await db.collection("anslag").doc("anslagEpostFrist").get();
    vantaSig(
      (anslag.data().pushPaminnelseSkickadTill ?? []).includes("epFristA"),
      "epFristA borde markerats påmind (via e-postkanalen) i pushPaminnelseSkickadTill"
    );
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
