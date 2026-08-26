// Etapp 70a: satAnvandareAvstangd och raderaAnvandare.
//
// Bakgrund: fram till 2026-08-26 fanns INGEN av dem. Enda åtgärden mot ett konto var
// tvingaUtloggning, som bara återkallar refresh-tokens – en person som slutade kunde logga in
// igen direkt med sitt lösenord och behöll åtkomst till organisationens rutiner. Dessutom
// kraschade tvingaUtloggning i produktion eftersom tjänstekontot saknade behörighet mot
// Firebase Authentication (roles/firebaseauth.admin), synligt i Sentry som "Credential
// implementation ... has insufficient permission".
//
// Testerna nedan bevisar behörighetskontrollerna OCH att Auth-kontot faktiskt påverkas – det
// senare är poängen, eftersom en Firestore-flagga utan motsvarande Auth-ändring hade sett rätt
// ut i gränssnittet utan att stänga någon dörr.
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/anvandarhantering.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
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
  if (!villkor) throw new Error(meddelande);
}

async function vantaSigKastar(lofte, meddelande) {
  try {
    await lofte;
    throw new Error(meddelande);
  } catch (fel) {
    if (fel.message === meddelande) throw fel;
  }
}

async function senastePostAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .orderBy("tidpunkt", "desc")
    .get();
  return snap.docs.map((d) => d.data()).find((p) => p.handelsetyp === handelsetyp);
}

async function skapaKonto(uid, epost) {
  await admin.auth().deleteUser(uid).catch(() => {});
  await admin.auth().createUser({ uid, email: epost, password: "hemligt123" });
}

async function main() {
  await skapaKonto("super70a", "super@70a.test");
  await skapaKonto("personal70a", "personal@70a.test");
  await skapaKonto("annanOrg70a", "annan@70a.test");
  await skapaKonto("attRadera70a", "radera@70a.test");

  await db.collection("users").doc("super70a").set({ role: "superadmin", organisationId: "org70a", namn: "Chefen" });
  await db.collection("users").doc("personal70a").set({ role: "personal", organisationId: "org70a", namn: "Kollegan" });
  await db.collection("users").doc("annanOrg70a").set({ role: "personal", organisationId: "annanOrg70a", namn: "Utomstående" });
  await db.collection("users").doc("attRadera70a").set({ role: "personal", organisationId: "org70a", namn: "Slutat" });
  await db.collection("organisationer").doc("org70a").set({ namn: "70a Testkund" });

  console.log("\nsatAnvandareAvstangd");
  await test("superadmin kan stänga av ett konto, och Auth-kontot spärras faktiskt", async () => {
    await funcs.satAnvandareAvstangd.run({
      data: { userId: "personal70a", avstangd: true },
      auth: { uid: "super70a" },
    });
    const authAnvandare = await admin.auth().getUser("personal70a");
    vantaSig(authAnvandare.disabled === true, "Auth-kontot borde vara disabled");
    const doc = await db.collection("users").doc("personal70a").get();
    vantaSig(doc.data().avstangd === true, "users/{uid}.avstangd borde vara true");
    const post = await senastePostAvTyp("org70a", "anvandare_avstangd");
    vantaSig(post, "Avstängningen borde loggas i revisionsloggen");
  });

  await test("samma funktion slår på kontot igen", async () => {
    await funcs.satAnvandareAvstangd.run({
      data: { userId: "personal70a", avstangd: false },
      auth: { uid: "super70a" },
    });
    const authAnvandare = await admin.auth().getUser("personal70a");
    vantaSig(authAnvandare.disabled === false, "Auth-kontot borde vara påslaget igen");
    const post = await senastePostAvTyp("org70a", "anvandare_aterupptagen");
    vantaSig(post, "Återupptagandet borde loggas");
  });

  await test("icke-superadmin nekas", async () => {
    await vantaSigKastar(
      funcs.satAnvandareAvstangd.run({
        data: { userId: "super70a", avstangd: true },
        auth: { uid: "personal70a" },
      }),
      "Personal borde inte kunna stänga av någon"
    );
  });

  await test("superadmin kan inte stänga av sig själv", async () => {
    await vantaSigKastar(
      funcs.satAnvandareAvstangd.run({
        data: { userId: "super70a", avstangd: true },
        auth: { uid: "super70a" },
      }),
      "Superadmin borde inte kunna låsa ut sig själv"
    );
  });

  await test("en användare i en ANNAN organisation kan inte stängas av", async () => {
    await vantaSigKastar(
      funcs.satAnvandareAvstangd.run({
        data: { userId: "annanOrg70a", avstangd: true },
        auth: { uid: "super70a" },
      }),
      "Superadmin borde inte nå en annan organisations användare"
    );
  });

  console.log("\nraderaAnvandare");
  await test("superadmin kan radera ett konto – både Auth och users/{uid} försvinner", async () => {
    await funcs.raderaAnvandare.run({ data: { userId: "attRadera70a" }, auth: { uid: "super70a" } });

    let authFinnsKvar = true;
    try {
      await admin.auth().getUser("attRadera70a");
    } catch {
      authFinnsKvar = false;
    }
    vantaSig(!authFinnsKvar, "Auth-kontot borde vara raderat");

    const doc = await db.collection("users").doc("attRadera70a").get();
    vantaSig(!doc.exists, "users/{uid} borde vara raderat");
  });

  await test("raderingen loggas MED namnet, som inte går att läsa efteråt", async () => {
    const post = await senastePostAvTyp("org70a", "anvandare_raderad");
    vantaSig(post, "Raderingen borde loggas");
    vantaSig(
      post.sammanfattning.includes("Slutat"),
      `Loggposten borde innehålla namnet – fick: ${post.sammanfattning}`
    );
  });

  await test("superadmin kan inte radera sig själv", async () => {
    await vantaSigKastar(
      funcs.raderaAnvandare.run({ data: { userId: "super70a" }, auth: { uid: "super70a" } }),
      "Superadmin borde inte kunna radera sitt eget konto"
    );
  });

  await test("en användare i en ANNAN organisation kan inte raderas", async () => {
    await vantaSigKastar(
      funcs.raderaAnvandare.run({ data: { userId: "annanOrg70a" }, auth: { uid: "super70a" } }),
      "Superadmin borde inte nå en annan organisations användare"
    );
    const doc = await db.collection("users").doc("annanOrg70a").get();
    vantaSig(doc.exists, "Den andra organisationens användare ska finnas kvar");
  });

  await test("icke-superadmin nekas", async () => {
    await vantaSigKastar(
      funcs.raderaAnvandare.run({ data: { userId: "super70a" }, auth: { uid: "personal70a" } }),
      "Personal borde inte kunna radera någon"
    );
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main();
