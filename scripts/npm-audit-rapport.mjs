#!/usr/bin/env node
// Etapp 31a: sammanfattar `npm audit` för root och functions/ i en maskinläsbar + läsbar
// rapport i CI. Rapporterar ENDAST – kraschar aldrig bygget (en ny CVE i en transitiv
// devDependency ska inte kunna stoppa en release utan att någon aktivt bedömt den, se
// ETAPPLAN4.md Etapp 31a). Skriver till $GITHUB_STEP_SUMMARY om den finns, annars stdout.
import { execSync } from "node:child_process";
import { writeFileSync, appendFileSync } from "node:fs";

const ALLVARLIGHETSORDNING = ["critical", "high", "moderate", "low", "info"];
const ALLVARLIGHETSETIKETT = {
  critical: "Kritisk",
  high: "Hög",
  moderate: "Måttlig",
  low: "Låg",
  info: "Info",
};

function korAudit(katalog) {
  try {
    const utdata = execSync("npm audit --json", { cwd: katalog, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(utdata);
  } catch (fel) {
    // npm audit avslutar med kod 1 så fort NÅGON sårbarhet hittas – det är förväntat, inte ett
    // skriptfel. Utdatan (JSON) finns ändå i fel.stdout.
    if (fel.stdout) {
      try {
        return JSON.parse(fel.stdout);
      } catch {
        return { fel: `Kunde inte tolka npm audit-utdata för ${katalog}: ${fel.message}` };
      }
    }
    return { fel: `npm audit gick inte att köra i ${katalog}: ${fel.message}` };
  }
}

function sammanfattaRapport(namn, rapport) {
  if (rapport.fel) {
    return { namn, fel: rapport.fel, paket: [] };
  }
  const metadata = rapport.metadata?.vulnerabilities ?? {};
  const paket = Object.values(rapport.vulnerabilities ?? {})
    .filter((v) => ALLVARLIGHETSORDNING.indexOf(v.severity) <= ALLVARLIGHETSORDNING.indexOf("high"))
    .map((v) => ({
      namn: v.name,
      allvar: v.severity,
      fixTillganglig: Boolean(v.fixAvailable),
      via: (Array.isArray(v.via) ? v.via : [])
        .filter((x) => typeof x === "object")
        .map((x) => x.title || x.name)
        .filter(Boolean),
    }))
    .sort((a, b) => ALLVARLIGHETSORDNING.indexOf(a.allvar) - ALLVARLIGHETSORDNING.indexOf(b.allvar));
  return { namn, metadata, paket };
}

function tillMarkdown(sammanfattningar) {
  const rader = ["# 📋 Beroendegranskning (npm audit)", ""];
  for (const s of sammanfattningar) {
    rader.push(`## ${s.namn}`);
    if (s.fel) {
      rader.push("", `⚠️ ${s.fel}`, "");
      continue;
    }
    const antal = ALLVARLIGHETSORDNING.map((niva) => `${s.metadata[niva] ?? 0} ${ALLVARLIGHETSETIKETT[niva].toLowerCase()}`).join(", ");
    rader.push("", `Totalt: ${s.metadata.total ?? 0} sårbarheter (${antal}).`, "");
    if (s.paket.length === 0) {
      rader.push("Inga hög-/kritiska sårbarheter.", "");
      continue;
    }
    rader.push("| Paket | Allvar | Fix tillgänglig | Kända sårbarheter |", "|---|---|---|---|");
    for (const p of s.paket) {
      rader.push(
        `| ${p.namn} | ${ALLVARLIGHETSETIKETT[p.allvar] ?? p.allvar} | ${p.fixTillganglig ? "Ja" : "Nej"} | ${p.via.slice(0, 2).join("; ") || "–"} |`
      );
    }
    rader.push("");
  }
  return rader.join("\n");
}

const root = process.argv[2] ?? ".";
const sammanfattningar = [
  sammanfattaRapport("Rot (`package.json`)", korAudit(root)),
  sammanfattaRapport("Cloud Functions (`functions/package.json`)", korAudit(`${root}/functions`)),
];

const markdown = tillMarkdown(sammanfattningar);
console.log(markdown);

const summaryFil = process.env.GITHUB_STEP_SUMMARY;
if (summaryFil) {
  appendFileSync(summaryFil, `${markdown}\n`);
} else {
  writeFileSync("npm-audit-rapport.md", markdown);
}

// Rapporterar alltid framgång – detta steg ska aldrig blockera bygget (se filens kommentar).
process.exit(0);
