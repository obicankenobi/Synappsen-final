// Etapp 28a/28c: applicerar organisationens accentfärg app-brett som --primar-varianter.
// Skrivs som en OSKOPAD `:root { ... }`-regel (lägre CSS-specificitet än de fördefinierade
// PERSONLIGA accenterna i index.css, t.ex. `:root[data-accent="gron"]`) – en användares eget
// val (Etapp 22e) vinner därför alltid automatiskt via vanlig CSS-cascade, helt utan att
// någon JS-kod behöver jämföra vems val som gäller.
import { useEffect } from "react";
import { useOrganisationBranding } from "../hooks/useOrganisationBranding";
import { blandaFarger, morkLagesVariant } from "../utils/kontrast";

const STYLE_ID = "organisation-accent-style";

export default function OrganisationsBranding() {
  const { branding } = useOrganisationBranding();
  const accentfarg = branding?.accentfarg;

  useEffect(() => {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    if (!accentfarg) {
      styleEl.textContent = "";
      return;
    }

    const primarMork = blandaFarger(accentfarg, "#000000", 0.15);
    const primarLjus = blandaFarger(accentfarg, "#ffffff", 0.92);
    // Mörkt läge kräver en ljusare variant av samma färg (se morkLagesVariant och
    // förklaringen i utils/kontrast.js) – annars läser knapptext dåligt mot en mörk yta.
    const morkPrimar = morkLagesVariant(accentfarg);
    const morkPrimarMork = blandaFarger(morkPrimar, "#ffffff", 0.15);
    const morkPrimarLjus = blandaFarger(morkPrimar, "#000000", 0.75);

    styleEl.textContent = `
      :root {
        --primar: ${accentfarg};
        --primar-mork: ${primarMork};
        --primar-ljus: ${primarLjus};
      }
      :root[data-tema="dark"] {
        --primar: ${morkPrimar};
        --primar-mork: ${morkPrimarMork};
        --primar-ljus: ${morkPrimarLjus};
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-tema="light"]) {
          --primar: ${morkPrimar};
          --primar-mork: ${morkPrimarMork};
          --primar-ljus: ${morkPrimarLjus};
        }
      }
    `;
  }, [accentfarg]);

  return null;
}
