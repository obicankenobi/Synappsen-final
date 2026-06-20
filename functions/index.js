// Cloud Functions för Synappsen – Gemini Vision-tolkning av uppladdade foton
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Grov kostnadsuppskattning per bildtolkning (öre), används för budgetspärren.
const UPPSKATTAD_KOSTNAD_ORE = 50;
const BUDGET_DOK = db.collection("installningar").doc("geminiBudget");
const STANDARD_TAK_ORE = 20000; // 200 kr

function aktuellManadNyckel() {
  const nu = new Date();
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`;
}

// Kontrollerar och reserverar budget innan ett dyrt Gemini-anrop görs.
// Kastar fel om månadens tak är nått, så att vi aldrig betalar för anrop vi inte har råd med.
async function reserveraBudget() {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(BUDGET_DOK);
    const data = snap.exists ? snap.data() : {};
    const manad = aktuellManadNyckel();

    let anvantOre = data.anvantOre ?? 0;
    let aktuellManad = data.aktuellManad ?? manad;
    const taketOre = data.taketOre ?? STANDARD_TAK_ORE;

    if (aktuellManad !== manad) {
      anvantOre = 0;
      aktuellManad = manad;
    }

    if (anvantOre >= taketOre) {
      throw new HttpsError(
        "resource-exhausted",
        "Månadens budget för bildtolkning är slut. Kontakta superadmin för att höja taket i adminpanelen."
      );
    }

    tx.set(
      BUDGET_DOK,
      { anvantOre: anvantOre + UPPSKATTAD_KOSTNAD_ORE, aktuellManad, taketOre },
      { merge: true }
    );
  });
}

const extraktionsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    titel: { type: SchemaType.STRING },
    innehall: { type: SchemaType.STRING },
    nyckelord: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    komIhagFlaggor: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["titel", "innehall", "nyckelord", "komIhagFlaggor"],
};

async function tolkaBildMedGemini(bildBuffer, mimeType) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: extraktionsSchema,
    },
  });

  const prompt = `Du tolkar ett foto av ett dokument, en whiteboard eller en anteckning från en akutmottagning.
Extrahera innehållet och returnera strukturerad data på svenska:
- titel: en kort, beskrivande titel
- innehall: dokumentets text/innehåll, sammanfattat och strukturerat
- nyckelord: en lista med sökord som personal skulle kunna söka på
- komIhagFlaggor: en lista med kritiska kom-ihåg-punkter eller varningar, om sådana finns (annars tom lista)`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: bildBuffer.toString("base64"), mimeType } },
  ]);

  return JSON.parse(result.response.text());
}

exports.tolkaDokument = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const { storagePath, omrade } = request.data;
    if (!storagePath || !omrade) {
      throw new HttpsError("invalid-argument", "storagePath och omrade krävs.");
    }

    await reserveraBudget();

    const fil = bucket.file(storagePath);
    const [bildBuffer] = await fil.download();
    const [metadata] = await fil.getMetadata();
    const mimeType = metadata.contentType || "image/jpeg";

    const extraherat = await tolkaBildMedGemini(bildBuffer, mimeType);
    const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

    const rutinRef = await db.collection("rutiner").add({
      titel: extraherat.titel,
      innehall: extraherat.innehall,
      nyckelord: extraherat.nyckelord,
      komIhagFlaggor: extraherat.komIhagFlaggor,
      bildUrl,
      omrade,
      status: "utkast",
      kalla: "gemini",
      skapadAv: request.auth.uid,
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { rutinId: rutinRef.id, ...extraherat };
  }
);
