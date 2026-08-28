// Etapp 53a: bevisar skickaEpost() (validering, PII-spärr, globalt nödstopp, tyst no-op utan
// konfigurerad nyckel, faktiskt utskick med en mockad Brevo-endpoint) och angeEpostAvstangd
// (bara plattformsadmin, loggar till "_plattform"-revisionsloggen).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/epost.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");
// _utforUtskick exporteras bara härifrån (index.js åter-exporterar inte interna hjälpare).
const gemensamt = require("../../functions/gemensamt.js");

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
  await db.collection("users").doc("superEpost53").set({ role: "superadmin", organisationId: "orgEpost53" });
  await db.collection("plattformsadmin").doc("levEpost53").set({ blevPlattformsadmin: Date.now() });

  console.log("\nskickaEpost – validering");
  await test("en ogiltig mottagaradress avvisas", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skickaEpost({ till: "inte-en-adress", amne: "Hej", text: "Test" })
    )
  );
  await test("ett misstänkt personnummer i texten blockerar utskicket", () =>
    // 900101-0017 är Skatteverkets kända test-personnummer (giltig Luhn-checksumma), samma
    // som används i src/utils/piiFilter.test.js.
    forvantaFel("invalid-argument", () =>
      funcs.skickaEpost({ till: "test@exempel.se", amne: "Hej", text: "Mitt personnummer är 900101-0017" })
    )
  );

  // ── Rättslig spärr (2026-08-27) ────────────────────────────────────────────────────
  // PUB-avtal med Brevo saknas, så skickaEpost() returnerar utan att skicka. Testet nedan
  // är det som håller beslutet på plats: hävs spärren utan att någon tänkt efter, failar
  // det här och tvingar fram frågan "är avtalet faktiskt tecknat?".
  //
  // De tre testfallen därefter anropar _utforUtskick (utskicket utan spärren) i stället för
  // skickaEpost, så att nödstopp, saknad nyckel och det faktiska utskicket fortfarande är
  // testtäckta medan spärren är på. Utan det hade fyra vägar tystnat helt.
  console.log("\nskickaEpost – rättslig spärr: PUB-avtal med Brevo saknas");
  await test("inget skickas medan PUB-avtalet saknas", async () => {
    const resultat = await funcs.skickaEpost({ till: "test@exempel.se", amne: "Hej", text: "Test" });
    vantaSig(resultat.skickat === false, "skickat borde vara false");
    vantaSig(resultat.anledning === "pub_avtal_saknas", `fel anledning: ${resultat.anledning}`);
  });
  await test("valideringen körs FÖRE spärren – en ogiltig adress kastar fortfarande", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skickaEpost({ till: "trasig-adress", amne: "Hej", text: "Test" })
    )
  );

  console.log("\nutforUtskick – tyst no-op utan konfigurerad nyckel (BREVO_API_KEY ej satt i denna testkörning)");
  await test("utan en konfigurerad nyckel skickas inget, men inget kastas heller", async () => {
    const resultat = await gemensamt._utforUtskick({ till: "test@exempel.se", amne: "Hej", text: "Test" });
    vantaSig(resultat.skickat === false, "skickat borde vara false");
    vantaSig(resultat.anledning === "epost_ej_konfigurerad", `fel anledning: ${resultat.anledning}`);
  });

  console.log("\nutforUtskick – globalt nödstopp");
  await test("nödstoppet stoppar utskicket innan någon nätverksanrop görs", async () => {
    await db.collection("systemstatus").doc("epost").set({ avstangd: true });
    const resultat = await gemensamt._utforUtskick({ till: "test@exempel.se", amne: "Hej", text: "Test" });
    vantaSig(resultat.skickat === false, "skickat borde vara false");
    vantaSig(resultat.anledning === "epost_avstangd_globalt", `fel anledning: ${resultat.anledning}`);
    await db.collection("systemstatus").doc("epost").set({ avstangd: false });
  });

  console.log("\nutforUtskick – faktiskt utskick (mockad Brevo-endpoint, ingen riktig nätverkstrafik)");
  const ursprungligFetch = global.fetch;
  let senasteAnrop = null;
  await test("ett lyckat utskick loggas till organisationens revisionslogg, aldrig innehållet", async () => {
    process.env.BREVO_API_KEY = "testnyckel";
    global.fetch = async (url, init) => {
      senasteAnrop = { url, body: JSON.parse(init.body) };
      return { ok: true };
    };
    try {
      const resultat = await gemensamt._utforUtskick({
        till: "mottagare@exempel.se",
        amne: "Du har en uppgift",
        text: "Logga in för att se den.",
        organisationId: "orgEpost53",
      });
      vantaSig(resultat.skickat === true, "skickat borde vara true");
      vantaSig(senasteAnrop.url === "https://api.brevo.com/v3/smtp/email", "fel endpoint anropad");
      vantaSig(senasteAnrop.body.to[0].email === "mottagare@exempel.se", "fel mottagare i anropet");
    } finally {
      global.fetch = ursprungligFetch;
      delete process.env.BREVO_API_KEY;
    }
    const logg = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "orgEpost53")
      .where("handelsetyp", "==", "epost_skickad")
      .get();
    vantaSig(logg.size === 1, `förväntade 1 loggpost, fick ${logg.size}`);
    vantaSig(
      !logg.docs[0].data().sammanfattning.includes("Du har en uppgift"),
      "loggposten läckte e-postens innehåll"
    );
  });

  console.log("\nangeEpostAvstangd – behörighet och effekt");
  await test("kräver inloggning", () =>
    forvantaFel("unauthenticated", () => funcs.angeEpostAvstangd.run({ data: { avstangd: true }, auth: null }))
  );
  await test("en superadmin (inte plattformsadmin) nekas", () =>
    forvantaFel("permission-denied", () =>
      funcs.angeEpostAvstangd.run({ data: { avstangd: true }, auth: { uid: "superEpost53" } })
    )
  );
  await test("en plattformsadmin KAN stänga av utgående e-post globalt", async () => {
    const resultat = await funcs.angeEpostAvstangd.run({ data: { avstangd: true }, auth: { uid: "levEpost53" } });
    vantaSig(resultat.avstangd === true, "avstangd borde vara true i svaret");
    const snap = await db.collection("systemstatus").doc("epost").get();
    vantaSig(snap.data().avstangd === true, "avstangd sattes inte i systemstatus/epost");
    vantaSig(snap.data().andradAv === "levEpost53", "andradAv fel");
  });
  await test("avstängningen loggas till '_plattform'-revisionsloggen", async () => {
    const logg = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "_plattform")
      .where("handelsetyp", "==", "epost_avstangd_globalt")
      .get();
    vantaSig(logg.size === 1, `förväntade 1 loggpost, fick ${logg.size}`);
  });
  await test("en plattformsadmin KAN slå på igen", async () => {
    const resultat = await funcs.angeEpostAvstangd.run({ data: { avstangd: false }, auth: { uid: "levEpost53" } });
    vantaSig(resultat.avstangd === false, "avstangd borde vara false i svaret");
  });

  console.log("\nskapaInbjudan – Etapp 53b: inbjudan mejlas nu, med organisationens namn i mejlet");
  await db.collection("organisationer").doc("orgEpost53").set({ namn: "Mejltest AB", status: "aktiv" });
  await test("en lyckad inbjudan skickar ETT mejl till precis den inbjudna adressen, med organisationens namn", async () => {
    process.env.BREVO_API_KEY = "testnyckel";
    let anrop = null;
    global.fetch = async (url, init) => {
      anrop = JSON.parse(init.body);
      return { ok: true };
    };
    try {
      const { token } = await funcs.skapaInbjudan.run({
        data: { epost: "kollega@exempel.se", roll: "personal" },
        auth: { uid: "superEpost53" },
      });
      vantaSig(!!token, "token saknas");
      vantaSig(!!anrop, "inget e-postanrop gjordes");
      vantaSig(anrop.to[0].email === "kollega@exempel.se", "fel mottagare");
      vantaSig(anrop.subject.includes("Mejltest AB"), "organisationens namn saknas i ämnesraden");
      vantaSig(anrop.textContent.includes(`/registrera?bjudan=${token}`), "länken med rätt token saknas i texten");
    } finally {
      global.fetch = ursprungligFetch;
      delete process.env.BREVO_API_KEY;
    }
  });
  await test("ett misslyckat e-postutskick blockerar INTE att inbjudan skapas", async () => {
    process.env.BREVO_API_KEY = "testnyckel";
    global.fetch = async () => {
      throw new Error("Simulerat nätverksfel");
    };
    try {
      const { token } = await funcs.skapaInbjudan.run({
        data: { epost: "annan@exempel.se", roll: "personal" },
        auth: { uid: "superEpost53" },
      });
      vantaSig(!!token, "inbjudan skapades inte trots att bara e-postutskicket misslyckades");
      const snap = await db.collection("inbjudningar").doc(token).get();
      vantaSig(snap.exists, "inbjudningsdokumentet saknas");
    } finally {
      global.fetch = ursprungligFetch;
      delete process.env.BREVO_API_KEY;
    }
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error(fel);
  process.exit(1);
});
