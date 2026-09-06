// Regressionsvakt för klinikstöd-promptens SÄKERHETSREGLER (2026-09-06).
//
// Varför den här filen finns: reglerna i byggKlinikstodPrompt() är inte stilpreferenser – de
// är den avgränsning som håller funktionen utanför MDR (granskningar/AVSETT-ANDAMAL-
// KLINIKSTOD-2026-08-30.md, och rättelsen i Etapp 72 där ordet "beslutsstöd" togs bort ur
// systemets EGEN instruktion). Fram till nu upprätthölls de av ingenting alls: en redigering
// som råkade stryka regel 4 hade inte fått ett enda test att faila, och bristen hade märkts
// först när ett Gemini-svar rangordnade åtgärder för en sjuksköterska.
//
// Vad den här filen KAN och INTE KAN bevisa – läs det här innan du litar på ett grönt svep:
//   KAN:      att reglerna finns kvar i prompten och inte kan försvinna i tysthet. Gratis,
//             offline, körs i varje testsvep.
//   KAN INTE: att modellen FAKTISKT lyder dem. Det kräver riktiga anrop mot Vertex AI och
//             ligger i functions/scripts/ai-evaluering.cjs (manuell körning, kostar pengar).
// De två är avsiktligt separerade: den billiga vakten ska aldrig bli beroende av en aktiv
// API-nyckel, och den dyra mätningen ska aldrig köras av misstag i CI.
//
// Körs mot Firestore-emulatorn (samma svit och samma skäl som vertexmigrering.test.cjs):
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/klinikstodprompt.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const { byggKlinikstodPrompt } = require("../../functions/klinikstod.js");

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

const TRAFFAR = [
  {
    titel: "Hyperkalemi – behandling",
    url: "https://www.internetmedicin.se/behandlingsoversikter/nefrologi/hyperkalemi/",
    utdrag: "Vid EKG-påverkan ges kalciumglukonat intravenöst. Insulin-glukos sänker kaliumnivån.",
  },
  {
    titel: "Kaliumrubbningar",
    url: "https://www.1177.se/behandling--hjalpmedel/kaliumrubbningar/",
    utdrag: "Kalium är en elektrolyt som påverkar hjärtats retledningssystem.",
  },
];

async function main() {
  const prompt = byggKlinikstodPrompt("behandling vid hyperkalemi", TRAFFAR);

  await test("prompten innehåller alla sex numrerade regler", () => {
    for (const nummer of [1, 2, 3, 4, 5, 6]) {
      vantaSig(prompt.includes(`\n${nummer}. `), `regel ${nummer} saknas i prompten`);
    }
  });

  // Regel 4 är den enskilt viktigaste raden i hela funktionen ur ett regulatoriskt perspektiv.
  // Varje delkrav testas separat, så ett felmeddelande pekar ut exakt vilket som försvann.
  await test("regel 4: förbudet mot beslutsstöd/rekommendation/diagnos står kvar", () => {
    vantaSig(prompt.includes("aldrig ett"), "den negerande formuleringen saknas");
    vantaSig(prompt.includes("beslutsstöd"), "ordet beslutsstöd saknas ur förbudet");
    vantaSig(prompt.includes("rekommendation"), "förbudet mot rekommendation saknas");
    vantaSig(prompt.includes("diagnos"), "förbudet mot diagnos saknas");
  });

  await test("regel 4: förbudet mot rangordnat svar står kvar", () => {
    vantaSig(
      prompt.includes("Ge aldrig ett prioriterat eller rangordnat"),
      "förbudet mot prioriterat/rangordnat svar saknas – detta är den formulering som skiljer " +
        "ett uppslagsverktyg från ett triageringsstöd i MDR-bedömningen"
    );
  });

  await test("regel 4: uppmaningen till egen klinisk bedömning står kvar", () => {
    vantaSig(prompt.includes("egen klinisk bedömning"), "uppmaningen till egen klinisk bedömning saknas");
  });

  // Den faktiska buggen som rättades i Etapp 72: prompten SA "Detta är beslutsstöd", alltså
  // raka motsatsen till avgränsningen. Ordet får förekomma – men bara i förbudet.
  await test("ordet beslutsstöd förekommer ALDRIG som ett påstående om vad verktyget är", () => {
    const otillatnaPastaenden = [
      "Detta är beslutsstöd",
      "detta är ett beslutsstöd",
      "är ett beslutsstöd för",
      "fungerar som beslutsstöd",
    ];
    for (const pastaende of otillatnaPastaenden) {
      vantaSig(
        !prompt.toLowerCase().includes(pastaende.toLowerCase()),
        `prompten påstår att verktyget ÄR ett beslutsstöd ("${pastaende}") – det är exakt den ` +
          "självmotsägelse som rättades i Etapp 72"
      );
    }
  });

  await test("regel 6: skyddet mot frågor om en namngiven patient står kvar", () => {
    vantaSig(prompt.includes("specifik patient"), "regel 6 om specifik patient saknas");
    vantaSig(
      prompt.includes("generella frågor"),
      "instruktionen att bara besvara generella frågor saknas"
    );
  });

  await test("regel 1 och 2: svaret får bara bygga på träffarna, aldrig på gissningar", () => {
    vantaSig(prompt.includes("ENDAST utifrån"), "kravet att svara endast utifrån träffarna saknas");
    vantaSig(prompt.includes("gissa aldrig"), "förbudet mot att gissa saknas");
  });

  await test("regel 3: kravet på källhänvisning per påstående står kvar", () => {
    vantaSig(prompt.includes("[1], [2]"), "instruktionen om källhänvisningsformat saknas");
  });

  await test("frågan och samtliga träffar bäddas in numrerade", () => {
    vantaSig(prompt.includes('Fråga: "behandling vid hyperkalemi"'), "användarens fråga saknas");
    vantaSig(prompt.includes("[1] Hyperkalemi – behandling"), "träff 1 saknas eller är onumrerad");
    vantaSig(prompt.includes("[2] Kaliumrubbningar"), "träff 2 saknas eller är onumrerad");
    vantaSig(prompt.includes("kalciumglukonat"), "träffens utdrag följer inte med i prompten");
  });

  await test("de godkända källdomänerna namnges för modellen", () => {
    vantaSig(prompt.includes("internetmedicin.se"), "källdomänlistan saknas i prompten");
    vantaSig(prompt.includes("1177.se"), "källdomänlistan verkar ofullständig");
  });

  // Reglerna ligger EFTER den användarstyrda frågan i prompten. Det är medvetet (en senare
  // instruktion väger tyngre för modellen) men betyder att ordningen är en säkerhetsegenskap,
  // inte en formatering – kastas den om hamnar användarens text sist och väger tyngst.
  await test("reglerna står EFTER den användarstyrda frågan i prompten", () => {
    vantaSig(
      prompt.indexOf("Regler du MÅSTE följa") > prompt.indexOf('Fråga: "'),
      "reglerna hamnade före frågan – användarens text väger då tyngre än säkerhetsreglerna"
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
