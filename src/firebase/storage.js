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
