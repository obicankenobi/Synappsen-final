// Etapp 21b: bevisar källbevakningsjobbets kärnlogik mot Firestore-emulatorn. Mockar
// globalThis.fetch (funktionerna använder Node:s inbyggda fetch, precis som
// sokViaProgrammerbarSokmotor) istället för att göra riktiga nätverksanrop mot de skarpa
// källdomänerna – både för att vara snäll mot källorna och för att göra testet deterministiskt.
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/kallbevakning.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
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

// robots.txt tillåter allt (tomt svar) för alla domäner i det här testet.
function mockaFetch(sidinnehallPerUrl) {
  return async (url, opts) => {
    const urlText = String(url);
    if (urlText.endsWith("/robots.txt")) {
      return { ok: true, text: async () => "" };
    }
    const svar = sidinnehallPerUrl.get(urlText);
    if (!svar) return { ok: false, status: 404 };
    if (svar.status && svar.status !== 200) return { ok: false, status: svar.status };
    return { ok: true, text: async () => svar.html };
  };
}

async function main() {
  const db = admin.firestore();
  const ursprungligFetch = globalThis.fetch;

  await test("organisation UTAN kallbevakning-modulen: ingen hämtning görs alls", async () => {
    globalThis.fetch = async () => {
      throw new Error("fetch skulle inte ha anropats");
    };
    await db.collection("organisationer").doc("orgUtanKallbevakning").set({ moduler: {} });
    await db.collection("rutiner").doc("rutinUtanModul").set({
      status: "godkand",
      organisationId: "orgUtanKallbevakning",
      titel: "Test",
      externaKallor: ["https://www.internetmedicin.se/artikel-a"],
    });
    await funcs.kontrolleraKallbevakning();
  });

  await test("första kontrollen av en ny källa flaggar INTE (ingen tidigare hash att jämföra med)", async () => {
    globalThis.fetch = mockaFetch(
      new Map([["https://www.internetmedicin.se/artikel-b", { html: "<html>Version 1</html>" }]])
    );
    await db.collection("organisationer").doc("orgMedKallbevakning").set({ moduler: { kallbevakning: true } });
    await db.collection("rutiner").doc("rutinForstaKontroll").set({
      status: "godkand",
      organisationId: "orgMedKallbevakning",
      titel: "Test B",
      externaKallor: ["https://www.internetmedicin.se/artikel-b"],
    });
    await funcs.kontrolleraKallbevakning();
    const rutin = await db.collection("rutiner").doc("rutinForstaKontroll").get();
    vantaSig(!rutin.data().kallVarning, "rutinen flaggades redan vid första kontrollen");
  });

  await test("en ÄNDRAD källa (andra kontrollen) flaggar rutinen", async () => {
    const url = "https://www.internetmedicin.se/artikel-c";
    await db.collection("organisationer").doc("orgMedKallbevakning2").set({ moduler: { kallbevakning: true } });
    await db.collection("rutiner").doc("rutinAndrad").set({
      status: "godkand",
      organisationId: "orgMedKallbevakning2",
      titel: "Test C",
      externaKallor: [url],
    });

    globalThis.fetch = mockaFetch(new Map([[url, { html: "<html>Original text</html>" }]]));
    await funcs.kontrolleraKallbevakning();

    globalThis.fetch = mockaFetch(new Map([[url, { html: "<html>Helt annan text nu</html>" }]]));
    await funcs.kontrolleraKallbevakning();

    const rutin = await db.collection("rutiner").doc("rutinAndrad").get();
    vantaSig(rutin.data().kallVarning === true, "rutinen flaggades inte trots ändrat innehåll");
    vantaSig(rutin.data().kallVarningTyp === "andring", "fel varningstyp, förväntade 'andring'");
  });

  await test("en trasig länk (404) flaggas som en egen typ, inte som en 'andring'", async () => {
    const url = "https://www.internetmedicin.se/artikel-d";
    await db.collection("organisationer").doc("orgMedKallbevakning3").set({ moduler: { kallbevakning: true } });
    await db.collection("rutiner").doc("rutinTrasigLank").set({
      status: "godkand",
      organisationId: "orgMedKallbevakning3",
      titel: "Test D",
      externaKallor: [url],
    });
    globalThis.fetch = mockaFetch(new Map([[url, { html: "", status: 404 }]]));
    await funcs.kontrolleraKallbevakning();
    const rutin = await db.collection("rutiner").doc("rutinTrasigLank").get();
    vantaSig(rutin.data().kallVarningTyp === "trasig_lank", "fel varningstyp, förväntade 'trasig_lank'");
  });

  globalThis.fetch = ursprungligFetch;

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
