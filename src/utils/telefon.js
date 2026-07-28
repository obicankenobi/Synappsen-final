// Etapp 22b: gör telefonnummer klickbara. Behåller bara siffror och ett eventuellt inledande
// "+" – mellanslag, bindestreck och parenteser i det inmatade numret ska visas som de är,
// men "tel:"-länken själv måste vara ren för att telefonen ska tolka den rätt.
export function telHref(nummer) {
  const trimmat = nummer.trim();
  const harPlus = trimmat.startsWith("+");
  const siffror = trimmat.replace(/\D/g, "");
  return `tel:${harPlus ? "+" : ""}${siffror}`;
}
