// ai-import.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: AI-importen (Gemini Vision/text): bildtolkning av rutindokument och
// förrådsfoton, samt förslag på checklistesteg och kvissfrågor ur en rutintext.

const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const {
  admin,
  db,
  bucket,
  onCall,
  HttpsError,
  GEMINI_API_KEY,
  hamtaAnvandarInfo,
  kravModul,
  innehallerPersonnummer,
  reserveraBudget,
} = require("./gemensamt");

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

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "AI-import kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const artiklar = await tolkaForradsbildMedGemini(bildBuffer, mimeType, forrad);
      if (artiklar.some((a) => innehallerPersonnummer(`${a.namn} ${(a.sokord ?? []).join(" ")}`))) {
        throw new HttpsError(
          "invalid-argument",
          "Bilden verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen – ta en ny bild utan sådan text."
        );
      }
      const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Matcha mot befintliga artiklar i SAMMA organisation och förråd på normaliserat namn,
      // så att en ny uppladdning ersätter en tidigare (t.ex. felaktig/utdaterad) post – och
      // aldrig av misstag skriver över en annan organisations artikel.
      const befintligaSnap = await db
        .collection("forradsartiklar")
        .where("organisationId", "==", organisationId)
        .where("forrad", "==", forrad)
        .get();
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
          organisationId,
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

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "AI-import kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const extraherat = await tolkaBildMedGemini(bildBuffer, mimeType);
      if (
        innehallerPersonnummer(
          `${extraherat.titel} ${extraherat.innehall} ${(extraherat.komIhagFlaggor ?? []).join(" ")}`
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Bilden verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen – ta en ny bild utan sådan text."
        );
      }
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
        organisationId,
        borttagen: false,
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

// Etapp 18b: "Föreslå steg" – delar upp en REDAN GODKÄND rutins befintliga text i
// stegförslag. Skapar ALDRIG nytt kliniskt innehåll, bara en annan layout på det som redan
// står i den godkända rutinen (se SAKERHETSRAPPORT.md, MDR-ställningstagandet för Etapp 18).
// Går under samma Gemini-budgetspärr som bildtolkning, och resultatet är alltid ett förslag
// som klienten visar upp för granskning – ingen skrivning till Firestore sker härifrån.
const stegForslagSchema = {
  type: SchemaType.OBJECT,
  properties: {
    steg: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
        },
        required: ["text"],
      },
    },
  },
  required: ["steg"],
};

async function foreslaStegMedGemini(innehall) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: stegForslagSchema,
    },
  });

  const prompt = `Du delar upp en REDAN GODKÄND rutintext från en akutmottagning i en
stegvis checklista, till för att köras ett steg i taget under ett akut arbetsmoment.

VIKTIGT: Återge ENDAST innehåll som redan står i texten nedan, omformulerat till korta,
konkreta handlingssteg. Lägg ALDRIG till nya rekommendationer, doser, bedömningar eller
information som inte redan finns i texten – det är en ren omstrukturering, inte en
klinisk bedömning.

Rutintext:
"""
${innehall}
"""

Returnera en lista med steg, i den ordning de ska utföras. Varje steg ska vara en kort mening
som beskriver EN handling.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()).steg;
}

exports.foreslaChecklistSteg = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const innehall = (request.data?.innehall ?? "").trim();
    if (!innehall) {
      throw new HttpsError("invalid-argument", "innehall krävs.");
    }
    if (innehallerPersonnummer(innehall)) {
      throw new HttpsError(
        "invalid-argument",
        "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen."
      );
    }

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Föreslå steg kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const steg = await foreslaStegMedGemini(innehall);
      const rensadeSteg = steg
        .filter((s) => !innehallerPersonnummer(s.text))
        .slice(0, 12);
      return { steg: rensadeSteg };
    } catch (fel) {
      console.error("Stegförslag misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Stegförslag misslyckades: ${fel.message}`);
    }
  }
);

// Etapp 19b: "Föreslå frågor" – tar fram 2-4 flervalsfrågor ur en REDAN GODKÄND rutins
// befintliga text, till mikrokvissen som visas vid kvittering. Samma princip som
// foreslaChecklistSteg (Etapp 18b): frågorna får bara pröva förståelse av det som redan står
// i texten, aldrig lägga till nytt kliniskt innehåll. Alltid ett utkast som måste granskas.
const kvissForslagSchema = {
  type: SchemaType.OBJECT,
  properties: {
    fragor: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          fraga: { type: SchemaType.STRING },
          alternativ: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          rattIndex: { type: SchemaType.NUMBER },
          hanvisning: { type: SchemaType.STRING },
        },
        required: ["fraga", "alternativ", "rattIndex", "hanvisning"],
      },
    },
  },
  required: ["fragor"],
};

async function foreslaKvissfragorMedGemini(innehall) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: kvissForslagSchema,
    },
  });

  const prompt = `Du tar fram en kort mikrokviss (2-4 flervalsfrågor) för en REDAN GODKÄND
rutintext från en akutmottagning, som visas när personal kvitterar att de läst och förstått.

VIKTIGT: Frågorna får ENDAST pröva förståelse av det som redan står i texten nedan. Lägg
ALDRIG till nya rekommendationer, doser, bedömningar eller information som inte redan finns
i texten – det är kunskapskontroll, inte en klinisk bedömning.

Rutintext:
"""
${innehall}
"""

Returnera 2-4 frågor. Varje fråga ska ha 3-4 svarsalternativ, ett rättIndex (0-baserat index
i alternativ-listan för det rätta svaret), och en hänvisning – en kort text som pekar ut
VILKET stycke/vilken del av rutinen svaret kommer från.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()).fragor;
}

exports.foreslaKvissfragor = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const innehall = (request.data?.innehall ?? "").trim();
    if (!innehall) {
      throw new HttpsError("invalid-argument", "innehall krävs.");
    }
    if (innehallerPersonnummer(innehall)) {
      throw new HttpsError(
        "invalid-argument",
        "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen."
      );
    }

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Föreslå frågor kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const fragor = await foreslaKvissfragorMedGemini(innehall);
      const rensadeFragor = fragor
        .filter((f) => !innehallerPersonnummer(f.fraga) && !innehallerPersonnummer(f.hanvisning))
        .slice(0, 4);
      return { fragor: rensadeFragor };
    } catch (fel) {
      console.error("Kvissförslag misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Kvissförslag misslyckades: ${fel.message}`);
    }
  }
);
