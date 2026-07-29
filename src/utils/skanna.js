// Etapp 27a: tolkar en skannad QR-/streckkodstext till en relativ sökväg i appen. Egna QR-koder
// (RutinKort.jsx, HyllEtiketter.jsx) kodar alltid en fullständig URL med window.location.origin –
// en kod från en helt annan origin (eller vilken text som helst som inte är en giltig URL) ska
// aldrig navigeras till (öppen redirect-risk), utan avvisas här innan komponenten ens ser den.
export function tolkaSkannadLank(text) {
  if (!text) return null;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
