// Skydd mot att patientuppgifter (personnummer, namn) av misstag sparas i Synappsen.
// Personnummer går att upptäcka tillförlitligt (giltigt datum + Luhn-checksumma) och
// blockeras hårt. Namn går INTE att upptäcka tillförlitligt med mönstermatchning – detta
// är därför bara en påminnelse (confirm-dialog), inte en garanti. Förlita dig aldrig på
// namn-varningen som ett juridiskt skydd; den kompletterar utbildning/rutiner, ersätter dem inte.

const PERSONNUMMER_REGEX = /\b(\d{2})(\d{2})(\d{2})[-+]?(\d{4})\b/g;

function luhnGiltig(siffror) {
  let summa = 0;
  for (let i = 0; i < 9; i++) {
    let d = siffror[i] * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    summa += d;
  }
  const kontrollsiffra = (10 - (summa % 10)) % 10;
  return kontrollsiffra === siffror[9];
}

function giltigtDatum(man, dag) {
  const m = Number(man);
  let d = Number(dag);
  if (d > 60) d -= 60; // samordningsnummer har +60 på dagen
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

// Hittar text-sekvenser som ser ut som svenska personnummer/samordningsnummer,
// verifierat mot giltigt datum och Luhn-checksumma (samma algoritm som Skatteverket använder).
export function hittaPersonnummer(text) {
  if (!text) return [];
  const träffar = [];
  const regex = new RegExp(PERSONNUMMER_REGEX.source, "g");
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [heltMatch, ar, man, dag, sista4] = match;
    if (!giltigtDatum(man, dag)) continue;
    const tioSiffror = `${ar}${man}${dag}${sista4}`.split("").map(Number);
    if (luhnGiltig(tioSiffror)) {
      träffar.push(heltMatch);
    }
  }
  return träffar;
}

// Grov, medvetet enkel heuristik: två efterföljande versalinledda ord (t.ex. "Anna Andersson").
// Ger falska larm på t.ex. platsnamn, läkemedelsnamn och namn i signaturer – det är förväntat
// och accepterat eftersom detta bara triggar en fråga till användaren, aldrig en spärr.
const MISSTANKT_NAMN_REGEX = /\b[A-ZÅÄÖ][a-zåäöé]+ [A-ZÅÄÖ][a-zåäöé]+\b/g;

export function hittaMisstankaNamn(text) {
  if (!text) return [];
  return [...text.matchAll(new RegExp(MISSTANKT_NAMN_REGEX.source, "g"))].map((m) => m[0]);
}

// Körs innan sparning i formulär som kan innehålla fritext. Blockerar hårt vid personnummer,
// frågar (via window.confirm) vid misstänkta namn. Returnerar { blockerad, meddelande }.
export function kontrolleraPatientuppgifter(text) {
  const personnummer = hittaPersonnummer(text);
  if (personnummer.length > 0) {
    return {
      blockerad: true,
      meddelande:
        `Texten verkar innehålla ett personnummer (${personnummer.join(", ")}). ` +
        "Patientuppgifter får av juridiska skäl inte sparas i Synappsen. Ta bort det och försök igen.",
    };
  }

  const namn = hittaMisstankaNamn(text);
  if (namn.length > 0) {
    const fortsatt = window.confirm(
      `Texten verkar innehålla ett namn (t.ex. "${namn[0]}"). Kontrollera att det INTE är en ` +
        "patientuppgift innan du fortsätter – appen kan inte tillförlitligt upptäcka namn, det här " +
        "är bara en påminnelse.\n\nVill du spara ändå?"
    );
    if (!fortsatt) return { blockerad: true, meddelande: null };
  }

  return { blockerad: false, meddelande: null };
}
