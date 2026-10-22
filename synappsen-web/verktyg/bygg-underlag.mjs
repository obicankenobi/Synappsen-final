// Genererar webbplatsens dokumentsidor ur markdown-källorna i repot.
//
// VARFÖR generera i stället för att skriva av: projektets återkommande felmönster är att två
// kopior av samma påstående glider isär (sex dokumenterade fall, värst 51 releaser). Att
// handkopiera avtal/IT-FAKTABLAD.md in i en HTML-sida hade skapat kopia nummer sju – i ett
// dokument som går till kundens IT-avdelning och dataskyddsombud.
//
// Webbplatsen förblir REN STATISK HTML: det här är ett utvecklingsverktyg som körs för hand,
// inte en byggkedja i deployvägen. Resultatet committas, och tests/docs/webbplats.test.js
// kontrollerar att det committade resultatet är exakt vad generatorn producerar i dag.
// Ändras källdokumentet utan att sidan genereras om, failar testet – samma mekanik som
// src/version.js och pitch-version.test.js, de två vakter som aldrig har glidit.
//
// Kör:  node synappsen-web/verktyg/bygg-underlag.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROT = fileURLToPath(new URL("../../", import.meta.url));

// De dokument som PUBLICERAS öppet. Urvalet är ett ägarbeslut (BESLUTSLOGG.md 2026-09-06):
// dokument där öppenheten i sig är argumentet och där en kopia inte kostar något.
// PUB-avtalsmallen och DPIA-underlaget står medvetet INTE här – de är märkta Extern = ja i
// DOKUMENTREGISTER.md, men "lämnas ut till kund" är inte samma sak som "publiceras för vem
// som helst", och produkt/VARUMARKE.md §1 pekar ut just det materialet som det som tog
// månader att producera.
export const DOKUMENT = [
  {
    kalla: "granskningar/TILLGANGLIGHETSREDOGORELSE.md",
    sida: "synappsen-web/tillganglighet.html",
    titel: "Tillgänglighetsredogörelse",
    ingress:
      "Hur Synappsen förhåller sig till WCAG 2.1 AA, med de brister som kvarstår utskrivna. " +
      "Publicerad i sin helhet, oredigerad.",
  },
  {
    kalla: "avtal/UNDERBITRADEN.md",
    sida: "synappsen-web/underbitraden.html",
    titel: "Underbiträdesförteckning",
    ingress:
      "Varje underleverantör som behandlar personuppgifter för Synappsens räkning, med " +
      "ändamål och region. Underlag för artikel 28.2 i dataskyddsförordningen.",
  },
  {
    kalla: "avtal/IT-FAKTABLAD.md",
    sida: "synappsen-web/it-faktablad.html",
    titel: "Tekniskt faktablad",
    ingress:
      "Arkitektur, datalagring, behörighetsmodell, backup och återställning – skrivet för en " +
      "IT-avdelning eller ett dataskyddsombud som ska granska före ett inköp.",
  },
];

const escapa = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Inline-markdown. Kodsnuttar plockas ut FÖRST och sätts tillbaka SIST, så att ** eller _
// inuti en kodsnutt aldrig tolkas som formatering.
function inline(text) {
  const kodbitar = [];
  let ut = escapa(text).replace(/`([^`]+)`/g, (_, kod) => {
    kodbitar.push(kod);
    return `@@KOD${kodbitar.length - 1}@@`;
  });
  ut = ut
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, etikett, mal) =>
      // Bara https-länkar och ankare släpps ut. En relativ länk till en fil i repot hade
      // blivit en trasig länk på en publik sida.
      /^https:\/\//.test(mal) || mal.startsWith("#") ? `<a href="${mal}">${etikett}</a>` : etikett
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return ut.replace(/@@KOD(\d+)@@/g, (_, i) => `<code>${kodbitar[Number(i)]}</code>`);
}

const tabellrad = (rad) =>
  rad
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export function markdownTillHtml(md, kalla) {
  const rader = md.split("\n");
  const ut = [];
  let i = 0;
  let styckerader = [];

  const spolaStycke = () => {
    if (styckerader.length) {
      ut.push(`<p>${inline(styckerader.join(" "))}</p>`);
      styckerader = [];
    }
  };

  while (i < rader.length) {
    const rad = rader[i];

    if (rad.startsWith("```")) {
      throw new Error(
        `${kalla} rad ${i + 1}: kodblock stöds inte av generatorn. Lägg till stöd i ` +
          "bygg-underlag.mjs i stället för att låta den tolka blocket som brödtext."
      );
    }

    if (!rad.trim()) {
      spolaStycke();
      i++;
      continue;
    }

    const rubrik = rad.match(/^(#{1,6})\s+(.*)$/);
    if (rubrik) {
      spolaStycke();
      // Dokumentets egen h1 blir h2 på sidan – sidans h1 är dokumenttiteln i sidhuvudet, och
      // två h1 hade brutit rubrikordningen för en skärmläsare.
      const niva = Math.min(rubrik[1].length + 1, 6);
      ut.push(`<h${niva}>${inline(rubrik[2])}</h${niva}>`);
      i++;
      continue;
    }

    if (/^---+$/.test(rad.trim())) {
      spolaStycke();
      ut.push("<hr />");
      i++;
      continue;
    }

    if (rad.trimStart().startsWith("|")) {
      spolaStycke();
      const block = [];
      while (i < rader.length && rader[i].trimStart().startsWith("|")) block.push(rader[i++]);
      const rubriker = tabellrad(block[0]);
      ut.push('<div class="tabell-svep"><table>');
      ut.push(
        `<thead><tr>${rubriker.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead>`
      );
      ut.push("<tbody>");
      // Rad 1 är rubrikraden, rad 2 justeringsraden (|---|---|). Resten är innehåll.
      for (const r of block.slice(2)) {
        ut.push(`<tr>${tabellrad(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
      }
      ut.push("</tbody></table></div>");
      continue;
    }

    if (rad.startsWith("> ") || rad === ">") {
      spolaStycke();
      const block = [];
      while (i < rader.length && (rader[i].startsWith("> ") || rader[i] === ">")) {
        block.push(rader[i].replace(/^>\s?/, ""));
        i++;
      }
      ut.push(`<blockquote>${markdownTillHtml(block.join("\n"), kalla)}</blockquote>`);
      continue;
    }

    const punkt = rad.match(/^(\s*)[-*]\s+(.*)$/);
    const nummer = rad.match(/^(\s*)\d+\.\s+(.*)$/);
    if (punkt || nummer) {
      spolaStycke();
      const tagg = punkt ? "ul" : "ol";
      const monster = punkt ? /^(\s*)[-*]\s+(.*)$/ : /^(\s*)\d+\.\s+(.*)$/;
      const poster = [];
      while (i < rader.length) {
        const m = rader[i].match(monster);
        if (m) {
          poster.push(m[2]);
          i++;
        } else if (rader[i].startsWith("  ") && rader[i].trim() && poster.length) {
          // Fortsättningsrad på föregående punkt.
          poster[poster.length - 1] += ` ${rader[i].trim()}`;
          i++;
        } else {
          break;
        }
      }
      ut.push(`<${tagg}>${poster.map((p) => `<li>${inline(p)}</li>`).join("")}</${tagg}>`);
      continue;
    }

    styckerader.push(rad.trim());
    i++;
  }
  spolaStycke();
  return ut.join("\n");
}

function sida(d, kropp) {
  const filnamn = d.sida.replace("synappsen-web/", "");
  const adress = `https://synappsen.se/${filnamn.replace(/\.html$/, "")}`;
  const titel = `${escapa(d.titel)} | Synappsen`;
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>${titel}</title>
<meta name="description" content="${escapa(d.ingress)}" />

<link rel="canonical" href="${adress}" />
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />

<meta property="og:type" content="website" />
<meta property="og:locale" content="sv_SE" />
<meta property="og:site_name" content="Synappsen" />
<meta property="og:title" content="${titel}" />
<meta property="og:description" content="${escapa(d.ingress)}" />
<meta property="og:url" content="${adress}" />
<meta property="og:image" content="https://synappsen.se/bilder/dela-vard.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Synappsen, digital kunskapsbank för vården: Rätt information, direkt i handen, när det är bråttom." />
<meta name="twitter:card" content="summary_large_image" />

<link rel="preload" href="/fonts/public-sans-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/stil.css" />
</head>
<body>

<!-- GENERERAD FIL - REDIGERA INTE FOR HAND.
     Kalla: ${d.kalla}
     Generator: synappsen-web/verktyg/bygg-underlag.mjs
     Kor om med: node synappsen-web/verktyg/bygg-underlag.mjs
     tests/docs/webbplats.test.js failar om den har filen inte motsvarar kallan. -->

<a class="hoppa" href="#huvudinnehall">Hoppa till innehållet</a>

<div class="skal skal--enkel">
  <main class="huvud huvud--dokument" id="huvudinnehall" tabindex="-1">

    <p class="dokument__tillbaka"><a href="/underlag">← Underlag och dokumentation</a></p>

    <section class="hero hero--dok">
      <span class="eyebrow hero__eyebrow">${escapa(d.titel)}</span>
      <h1>${escapa(d.titel)}</h1>
      <p class="lede">${escapa(d.ingress)}</p>
      <p class="dok__kalla">Sidan genereras ur <code>${escapa(d.kalla)}</code> i produktens eget
      kodförråd och kan därför inte säga något annat än originalet säger.</p>
    </section>

    <div class="dok">
${kropp}
    </div>

    <footer>
      <span>Synappsen · Digital kunskapsbank för vården</span>
      <span><a href="/underlag">Allt underlag</a></span>
      <span><a href="/integritet">Integritetspolicy</a></span>
      <span><a href="mailto:kontakt@synappsen.se">kontakt@synappsen.se</a></span>
    </footer>
  </main>
</div>

</body>
</html>
`;
}

export function generera() {
  return DOKUMENT.map((d) => ({
    sida: d.sida,
    html: sida(d, markdownTillHtml(readFileSync(join(ROT, d.kalla), "utf8"), d.kalla)),
  }));
}

if (process.argv[1] && process.argv[1].endsWith("bygg-underlag.mjs")) {
  for (const { sida: filnamn, html } of generera()) {
    writeFileSync(join(ROT, filnamn), html);
    console.log(`skrev ${filnamn}`);
  }
}
