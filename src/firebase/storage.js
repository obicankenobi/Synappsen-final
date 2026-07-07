// Bilduppladdning för rutiner i Synappsen
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./config";

const storage = getStorage(app);

export async function laddaUppRutinBild(omrade, rutinId, fil) {
  const sokvag = `rutiner/${omrade}/${rutinId}/${Date.now()}-${fil.name}`;
  const bildRef = ref(storage, sokvag);
  await uploadBytes(bildRef, fil);
  return getDownloadURL(bildRef);
}

// Laddar upp flera bilagor (bilder eller PDF:er) till en rutin och returnerar en lista med
// {url, namn, typ} – "typ" avgör om RutinKort visar en inline-bild eller en nedladdningslänk.
export async function laddaUppRutinBilagor(omrade, rutinId, filer) {
  return Promise.all(
    filer.map(async (fil) => {
      const sokvag = `rutiner/${omrade}/${rutinId}/${Date.now()}-${fil.name}`;
      const bilagaRef = ref(storage, sokvag);
      await uploadBytes(bilagaRef, fil);
      const url = await getDownloadURL(bilagaRef);
      return { url, namn: fil.name, typ: fil.type.startsWith("image/") ? "bild" : "dokument" };
    })
  );
}

export async function laddaUppForradsbild(forradSlug, artikelId, fil) {
  const sokvag = `forradsartiklar/${forradSlug}/${artikelId}/${Date.now()}-${fil.name}`;
  const bildRef = ref(storage, sokvag);
  await uploadBytes(bildRef, fil);
  return getDownloadURL(bildRef);
}

// Laddar upp ett råfoto som ska tolkas av Gemini Vision och returnerar dess sökväg i Storage
export async function laddaUppInkommandeFoto(uid, fil) {
  const sokvag = `inkommande/${uid}/${Date.now()}-${fil.name}`;
  const bildRef = ref(storage, sokvag);
  await uploadBytes(bildRef, fil);
  return sokvag;
}
