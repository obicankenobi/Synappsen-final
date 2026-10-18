// Bevisar att utvärderingens deterministiska kontroller (functions/scripts/ai-kontroller.cjs)
// faktiskt kan fälla ett uppfunnet värde – och att de INTE felaktigt fäller korrekta svar.
// Kräver inga emulatorer och inget modellanrop.
const path = require("node:path");
const { mangdUttryck, uppfunnaMangder, kvissProblem } = require(path.join(__dirname, "../../functions/scripts/ai-kontroller.cjs"));

let ok = 0, fel = 0;
function test(namn, fn) {
  try { fn(); ok++; console.log(`  OK   ${namn}`); } catch (e) { fel++; console.error(`  FEL  ${namn}\n       ${e.message}`); }
}
function vantaSig(v, m) { if (!v) throw new Error(m); }

const KALLA = "Ge kalciumglukonat 10 ml intravenöst under 5 minuter. Observera i minst 6 timmar.";

console.log("\nmangdUttryck / uppfunnaMangder");
test("hittar tal+enhet och normaliserar decimalkomma och versaler", () => {
  const m = mangdUttryck("Ge 0,5 mg samt 10 ML och 2 IE");
  vantaSig(m.has("0.5 mg") && m.has("10 ml") && m.has("2 ie"), [...m].join("|"));
});
test("en dos som står i källan räknas inte som uppfunnen", () => {
  vantaSig(uppfunnaMangder("Ge 10 ml över 5 minuter", KALLA).length === 0, "falsklarm");
});
test("en dos som INTE står i källan fälls", () => {
  const u = uppfunnaMangder("Ge adrenalin 0,5 mg intramuskulärt", KALLA);
  vantaSig(u.length === 1 && u[0] === "0.5 mg", JSON.stringify(u));
});
test("en uppfunnen tidsangivelse fälls (10 minuter finns inte i källan)", () => {
  vantaSig(uppfunnaMangder("Ge under 10 minuter", KALLA).includes("10 minuter"), "tid fälldes inte");
});
test("ord som bara börjar med en enhet ('3 gånger', '2 gram') ger inget falsklarm", () => {
  const m = mangdUttryck("Sätt 3 gånger, 2 gram, 4 mer");
  vantaSig(m.size === 0, `falsklarm: ${[...m].join("|")}`);
});

console.log("\nkvissProblem – facit är det som måste hålla");
test("ett korrekt facit utan uppfunna mängder ger inga problem", () => {
  const p = kvissProblem({ alternativ: ["10 ml", "50 ml"], rattIndex: 0, hanvisning: "Ge 10 ml under 5 minuter" }, KALLA);
  vantaSig(p.length === 0, p.join("; "));
});
test("en distraktor med annan dos är tillåten", () => {
  const p = kvissProblem({ alternativ: ["10 ml", "100 ml"], rattIndex: 0, hanvisning: "10 ml" }, KALLA);
  vantaSig(p.length === 0, p.join("; "));
});
test("ett facit med en dos som inte står i källan fälls", () => {
  const p = kvissProblem({ alternativ: ["20 ml", "10 ml"], rattIndex: 0, hanvisning: "" }, KALLA);
  vantaSig(p.some((x) => x.includes("20 ml")), p.join("; "));
});
test("en hänvisning med uppfunnen mängd fälls även om facit är rent", () => {
  const p = kvissProblem({ alternativ: ["Ja", "Nej"], rattIndex: 0, hanvisning: "Ge 1 mg" }, KALLA);
  vantaSig(p.some((x) => x.includes("1 mg")), p.join("; "));
});
test("ett rattIndex utanför alternativen fälls", () => {
  vantaSig(kvissProblem({ alternativ: ["a", "b"], rattIndex: 5, hanvisning: "" }, KALLA).length > 0, "fälldes inte");
  vantaSig(kvissProblem({ alternativ: ["a", "b"], rattIndex: "0", hanvisning: "" }, KALLA).length > 0, "sträng-index fälldes inte");
});

console.log(`\n${ok} klarade, ${fel} misslyckade`);
if (fel > 0) process.exit(1);
