// Etapp 28a: läser/skriver organisationens egen profil (logotyp, accentfärg, välkomsttext) –
// ett namnrymdat fält på organisationer/{orgId}, samma mönster som sakerhet.kravMfaForRoller
// i Admin.jsx. Ingen egen collection/sub-dokument behövdes, det är tre små fält.
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { valideraAccentfarg } from "../utils/kontrast";

export function useOrganisationBranding() {
  const { organisationId } = useAuth();
  const [branding, setBranding] = useState(undefined);

  useEffect(() => {
    if (!organisationId) return undefined;
    return onSnapshot(doc(db, "organisationer", organisationId), (snap) => {
      setBranding(snap.data()?.branding ?? {});
    });
  }, [organisationId]);

  // 28c: accentfärgen kontrastvalideras HÄR, innan den ens skickas till Firestore – en
  // regelmotor kan inte räkna WCAG-luminans (ingen exponent-/potensfunktion i regelspråket),
  // så det här är den enda spärren. En kund kan alltså inte spara en färg som underskrider
  // WCAG AA, men värdet skyddas inte av firestore.rules bortom det vanliga
  // superadmin-i-egen-organisation-kravet som redan gäller för organisationer/{orgId}.
  async function sparaBranding({ logotypUrl, accentfarg, valkomsttext }) {
    if (!organisationId) return { sparad: false };
    if (accentfarg !== undefined && accentfarg !== "") {
      const kontroll = valideraAccentfarg(accentfarg);
      if (!kontroll.giltig) return { sparad: false, fel: kontroll.fel };
    }
    const falt = {};
    if (logotypUrl !== undefined) falt["branding.logotypUrl"] = logotypUrl;
    if (accentfarg !== undefined) falt["branding.accentfarg"] = accentfarg;
    if (valkomsttext !== undefined) falt["branding.valkomsttext"] = valkomsttext;
    await updateDoc(doc(db, "organisationer", organisationId), falt);
    return { sparad: true };
  }

  return { branding, laddat: branding !== undefined, sparaBranding };
}
