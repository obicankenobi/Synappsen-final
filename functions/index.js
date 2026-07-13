// Cloud Functions för Synappsen – Gemini Vision-tolkning av uppladdade foton
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();
// Explicit bucket name: admin.storage().bucket() with no argument can resolve to the
// legacy <project-id>.appspot.com bucket instead of the project's actual configured
// bucket, causing "no such object" failures for files the client just uploaded.
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Grov kostnadsuppskattning per bildtolkning (öre), används för budgetspärren.
const UPPSKATTAD_KOSTNAD_ORE = 50;
const BUDGET_DOK = db.collection("installningar").doc("geminiBudget");
const STANDARD_TAK_ORE = 20000; // 200 kr
// Tak per enskild användare och månad, så att en person inte kan förbruka hela
// den gemensamma budgeten själv.
const MAX_PER_ANVANDARE_ORE = 5000; // 50 kr

function aktuellManadNyckel() {
  const nu = new Date();
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`;
}

// Kontrollerar och reserverar budget innan ett dyrt Gemini-anrop görs.
// Kastar fel om månadens tak är nått, så att vi aldrig betalar för anrop vi inte har råd med.
async function reserveraBudget(uid) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(BUDGET_DOK);
    const data = snap.exists ? snap.data() : {};
    const manad = aktuellManadNyckel();

    let anvantOre = data.anvantOre ?? 0;
    let aktuellManad = data.aktuellManad ?? manad;
    let anvantPerUid = data.anvantPerUid ?? {};
    const taketOre = data.taketOre ?? STANDARD_TAK_ORE;

    if (aktuellManad !== manad) {
      anvantOre = 0;
      anvantPerUid = {};
      aktuellManad = manad;
    }

    if (anvantOre >= taketOre) {
      throw new HttpsError(
        "resource-exhausted",
        "Månadens budget för bildtolkning är slut. Kontakta superadmin för att höja taket i adminpanelen."
      );
    }

    const anvantAvDennaAnvandare = anvantPerUid[uid] ?? 0;
    if (anvantAvDennaAnvandare >= MAX_PER_ANVANDARE_ORE) {
      throw new HttpsError(
        "resource-exhausted",
        "Du har nått din egna månadskvot för bildtolkning. Kontakta superadmin om du behöver mer."
      );
    }

    anvantPerUid = { ...anvantPerUid, [uid]: anvantAvDennaAnvandare + UPPSKATTAD_KOSTNAD_ORE };

    tx.set(
      BUDGET_DOK,
      { anvantOre: anvantOre + UPPSKATTAD_KOSTNAD_ORE, aktuellManad, taketOre, anvantPerUid },
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
    giltigtTill: { type: SchemaType.STRING },
  },
  required: ["titel", "innehall", "nyckelord", "komIhagFlaggor", "giltigtTill"],
};

async function tolkaBildMedGemini(bildBuffer, mimeType) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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
- komIhagFlaggor: en lista med kritiska kom-ihåg-punkter eller varningar, om sådana finns (annars tom lista)
- giltigtTill: om dokumentet anger ett giltighetsdatum, utgångsdatum eller "gäller till och med"-datum,
  ange det i formatet ÅÅÅÅ-MM-DD. Annars en tom sträng.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: bildBuffer.toString("base64"), mimeType } },
  ]);

  return JSON.parse(result.response.text());
}

const OMRADEN = ["kliniskt-stod", "logistik", "administration"];

const FORRAD = [
  "Engångsförrådet",
  "Sterilförrådet",
  "Ortopedförrådet",
  "Tvättförrådet",
  "Kontorsförrådet",
  "Läkemedelsrummet",
];

const forradsArtikelSchema = {
  type: SchemaType.OBJECT,
  properties: {
    artiklar: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          namn: { type: SchemaType.STRING },
          skap: { type: SchemaType.STRING },
          hylla: { type: SchemaType.STRING },
          antal: { type: SchemaType.STRING },
          sokord: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["namn", "skap", "hylla", "antal", "sokord"],
      },
    },
  },
  required: ["artiklar"],
};

async function tolkaForradsbildMedGemini(bildBuffer, mimeType, forrad) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: forradsArtikelSchema,
    },
  });

  const prompt = `Du tolkar ett foto från förrådet "${forrad}" på en akutmottagning.
Fotot kan visa ANTINGEN enskilda artiklar i ett skåp/på en hylla (med skyltar/etiketter),
ELLER en skriven/utskriven/tryckt lista/tabell över artiklar (t.ex. en innehållsförteckning
i en pärm, ofta med kolumner som "Benämning", "Hylla" och "Skåp").

Extrahera en lista över alla artiklar som syns i bilden. För varje artikel anger du:
- namn: artikelns namn (t.ex. innehållet i kolumnen "Benämning" om det är en lista)
- skap: skåpets beteckning (bokstav/nummer). Om bilden är en tabell/lista med en egen
  kolumn för "Skåp", läs av VARJE rads eget värde i den kolumnen – anta ALDRIG att alla
  rader har samma skåp/hylla bara för att de ligger nära varandra i tabellen. Om bilden
  istället visar fysiska artiklar, ange skåpet ENDAST om det syns på en skylt/etikett.
  Lämna tom sträng om inget av detta går att avläsa.
- hylla: hyllans beteckning, avläst på samma sätt som skap (egen kolumn i tabellen, eller
  skylt/etikett för fysiska artiklar). Lämna tom sträng om det inte går att avläsa.
- antal: angiven mängd/antal om det står i bilden, annars tom sträng
- sokord: en lista med alternativa sökord/synonymer som vårdpersonal kan tänkas söka på för att
  hitta artikeln – t.ex. vanliga förkortningar, slangbegrepp eller bredare produktkategorier
  (exempel: en "Foley-kateter" bör även ge sökord som "kateter", "urinkateter" och "KAD")
Gissa aldrig ett värde som inte faktiskt går att läsa i bilden – lämna då skap/hylla tomma.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: bildBuffer.toString("base64"), mimeType } },
  ]);

  return JSON.parse(result.response.text()).artiklar;
}

exports.tolkaForradsbild = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", memory: "1GiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const { storagePath, forrad } = request.data;
    if (!storagePath || !FORRAD.includes(forrad)) {
      throw new HttpsError("invalid-argument", "storagePath och ett giltigt forrad krävs.");
    }
    if (storagePath !== `inkommande/${request.auth.uid}/${storagePath.split("/").pop()}`) {
      throw new HttpsError("permission-denied", "storagePath måste peka på ditt eget uppladdade foto.");
    }

    await reserveraBudget(request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const artiklar = await tolkaForradsbildMedGemini(bildBuffer, mimeType, forrad);
      const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Matcha mot befintliga artiklar i samma förråd på normaliserat namn, så att en ny
      // uppladdning ersätter en tidigare (t.ex. felaktig/utdaterad) post istället för att
      // skapa en duplett varje gång samma lista fotas på nytt.
      const befintligaSnap = await db.collection("forradsartiklar").where("forrad", "==", forrad).get();
      const befintligaPerNamn = new Map();
      befintligaSnap.forEach((doc) => {
        const namn = (doc.data().namn ?? "").trim().toLowerCase();
        if (namn) befintligaPerNamn.set(namn, doc.ref);
      });

      const batch = db.batch();
      const skapade = artiklar.map((artikel) => {
        const normaliseratNamn = (artikel.namn ?? "").trim().toLowerCase();
        const befintligRef = befintligaPerNamn.get(normaliseratNamn);
        const ref = befintligRef ?? db.collection("forradsartiklar").doc();
        batch.set(ref, {
          namn: artikel.namn,
          skap: artikel.skap || null,
          hylla: artikel.hylla || null,
          antal: artikel.antal || null,
          sokord: artikel.sokord ?? [],
          bildUrl,
          forrad,
          status: "utkast",
          kalla: "gemini",
          skapadAv: request.auth.uid,
          skapad: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { id: ref.id, ersatte: Boolean(befintligRef), ...artikel };
      });
      await batch.commit();

      return { antal: skapade.length, artiklar: skapade };
    } catch (fel) {
      console.error("Tolkning misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Tolkning misslyckades: ${fel.message}`);
    }
  }
);

exports.tolkaDokument = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", memory: "1GiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const { storagePath, omrade } = request.data;
    if (!storagePath || !OMRADEN.includes(omrade)) {
      throw new HttpsError("invalid-argument", "storagePath och ett giltigt omrade krävs.");
    }
    if (storagePath !== `inkommande/${request.auth.uid}/${storagePath.split("/").pop()}`) {
      throw new HttpsError("permission-denied", "storagePath måste peka på ditt eget uppladdade foto.");
    }

    await reserveraBudget(request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const extraherat = await tolkaBildMedGemini(bildBuffer, mimeType);
      const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      // Endast ett väl formaterat datum (ÅÅÅÅ-MM-DD) sätts som utgångsdatum – annars ignoreras det.
      const giltigtTill = /^\d{4}-\d{2}-\d{2}$/.test(extraherat.giltigtTill) ? extraherat.giltigtTill : null;

      const rutinRef = await db.collection("rutiner").add({
        titel: extraherat.titel,
        innehall: extraherat.innehall,
        nyckelord: extraherat.nyckelord,
        komIhagFlaggor: extraherat.komIhagFlaggor,
        utgangsdatum: giltigtTill,
        bildUrl,
        omrade,
        status: "utkast",
        kalla: "gemini",
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { rutinId: rutinRef.id, ...extraherat };
    } catch (fel) {
      console.error("Tolkning misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Tolkning misslyckades: ${fel.message}`);
    }
  }
);
