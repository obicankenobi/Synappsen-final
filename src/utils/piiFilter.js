// Skydd mot att patientuppgifter (personnummer, namn) av misstag sparas i Synappsen.
// Personnummer går att upptäcka tillförlitligt (giltigt datum + Luhn-checksumma) och
// blockeras hårt. Namn går INTE att upptäcka tillförlitligt med mönstermatchning – detta
// är därför bara en påminnelse (confirm-dialog), inte en garanti. Förlita dig aldrig på
// namn-varningen som ett juridiskt skydd; den kompletterar utbildning/rutiner, ersätter dem inte.

// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.1): århundradeprefixet var tidigare INTE
// med i mönstret, så filtret missade den TOLVSIFFRIGA formen ("19850315-1234" /
// "198503151234") helt – och det är just den form som svenska journalsystem (TakeCare,
// Cosmic) visar och som personal alltså kopierar. Serverregeln harTroligtPersonnummer() i
// firestore.rules täckte båda formerna redan efter Del 1, men den regeln gäller bara ett
// fåtal fält; det HÄR filtret är den enda kontrollen på merparten av appens fritext
// (skiftrapporter, bristanmälningar, kommentarer). De två lagren sa alltså emot varandra,
// och det svagare låg på den bredare vägen.
const PERSONNUMMER_REGEX = /\b(?:19|20)?(\d{2})(\d{2})(\d{2})[-+]?(\d{4})\b/g;

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
// Etapp 8e: medvetet KVAR på window.confirm (till skillnad från alla andra confirm()/alert()-
// anrop i appen, se DialogProvider.jsx) – detta är en vanlig, synkron util-funktion (inte en
// komponent), så React-hooken useDialog() kan inte användas här utan att göra funktionen
// async och uppdatera samtliga sju anropsställen. Låg frekvens (bara vid misstänkta namn,
// inte varje sparning) gjorde att det inte bedömdes värt den bredare refaktoreringen nu.
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
