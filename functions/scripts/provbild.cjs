// Genererar den syntetiska provbild som functions/scripts/ai-evaluering.cjs använder för att
// smoke-testa bildtolkningen (vision-vägen mot Vertex AI).
//
// Varför genererad i stället för en incheckad bildfil: en binärfil i repot går inte att
// granska i en diff, kan inte ändras utan att någon laddar upp en ny, och säger inget om vad
// den innehåller. Den här filen ÄR bilden – texten står i klartext nedan, och provbilden kan
// därmed inte glida isär från det utvärderingen påstår att den innehåller.
//
// Medvetet begränsad: ren, rakt uppställd, renderad text i en enkel punktmatrisfont. Det gör
// den till ett bra kontraktstest ("svarar vision-vägen med giltig JSON enligt schemat, och
// läses ett exakt datum rätt?") men till ett DÅLIGT mått på OCR-kvalitet mot verkliga foton
// (skeva, skuggade, handskrivna). För det senare finns flaggan --bild i ai-evaluering.cjs.

const zlib = require("node:zlib");

// 5×7 punktmatrisfont, bara de tecken provbilden faktiskt använder. Inga svenska diakriter –
// texten nedan är skriven utan dem med flit, så fonten kan hållas liten och granskningsbar.
const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
};

// Texten i provbilden. Datumet är avsiktligt entydigt och står i klartext – det är det enda
// värde ai-evaluering.cjs gör en EXAKT jämförelse mot ("2027-01-15"), eftersom en modell kan
// formulera titel och innehåll fritt men ett datum antingen läses rätt eller inte.
const RADER = [
  "RUTIN HLR VUXEN",
  "AKUTMOTTAGNINGEN",
  "",
  "GILTIGT TILL 2027-01-15",
  "",
  "1 LARMA 112",
  "2 STARTA KOMPRESSIONER",
  "3 HAMTA HJARTSTARTARE",
  "",
  "VIKTIGT KONTROLLERA PULS",
  "MAX 10 SEKUNDER",
];

const SKALA = 6;
const MARGINAL = 24;
const TECKENBREDD = 6; // 5 px glyf + 1 px mellanrum
const RADHOJD = 9; // 7 px glyf + 2 px mellanrum

function crc32(buf) {
  let c;
  const tabell = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabell[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) {
    crc = tabell[(crc ^ b) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(typ, data) {
  const langd = Buffer.alloc(4);
  langd.writeUInt32BE(data.length, 0);
  const typOchData = Buffer.concat([Buffer.from(typ, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typOchData), 0);
  return Buffer.concat([langd, typOchData, crc]);
}

// Returnerar en PNG-buffer (8-bitars gråskala, svart text på vit botten).
function byggProvbild() {
  const maxTecken = Math.max(...RADER.map((r) => r.length));
  const bredd = maxTecken * TECKENBREDD * SKALA + MARGINAL * 2;
  const hojd = RADER.length * RADHOJD * SKALA + MARGINAL * 2;

  // Vit botten (0xff = vitt i gråskala).
  const pixlar = Buffer.alloc(bredd * hojd, 0xff);

  RADER.forEach((rad, radIndex) => {
    for (let teckenIndex = 0; teckenIndex < rad.length; teckenIndex++) {
      const glyf = FONT[rad[teckenIndex]];
      if (!glyf) {
        throw new Error(
          `Tecknet "${rad[teckenIndex]}" saknas i punktmatrisfonten – lägg till det i FONT ovan ` +
            "eller skriv om raden utan det."
        );
      }
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (glyf[gy][gx] !== "#") continue;
          const x0 = MARGINAL + (teckenIndex * TECKENBREDD + gx) * SKALA;
          const y0 = MARGINAL + (radIndex * RADHOJD + gy) * SKALA;
          for (let dy = 0; dy < SKALA; dy++) {
            pixlar.fill(0x00, (y0 + dy) * bredd + x0, (y0 + dy) * bredd + x0 + SKALA);
          }
        }
      }
    }
  });

  // Varje scanline föregås av en filterbyte (0 = ingen filtrering).
  const raa = Buffer.alloc(hojd * (bredd + 1));
  for (let y = 0; y < hojd; y++) {
    raa[y * (bredd + 1)] = 0;
    pixlar.copy(raa, y * (bredd + 1) + 1, y * bredd, (y + 1) * bredd);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(bredd, 0);
  ihdr.writeUInt32BE(hojd, 4);
  ihdr[8] = 8; // bitdjup
  ihdr[9] = 0; // färgtyp 0 = gråskala
  ihdr[10] = 0; // komprimering
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // ingen interlacing

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raa)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

exports.byggProvbild = byggProvbild;
exports.RADER = RADER;

// Kör direkt för att titta på bilden: node functions/scripts/provbild.cjs ut.png
if (require.main === module) {
  const sokvag = process.argv[2] || "provbild.png";
  require("node:fs").writeFileSync(sokvag, byggProvbild());
  console.log(`Provbild skriven till ${sokvag}`);
}
