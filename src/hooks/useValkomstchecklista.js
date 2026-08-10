// Etapp 15b: guidad uppstart för en ny kunds superadmin. Läser samma dokument som Etapp 15a
// skapade (organisationer/{orgId}/installningar/valkomstchecklista) för att avgöra OM
// checklistan ska visas alls (organisationer etablerade före Etapp 15a saknar dokumentet).
//
// Etapp 56c (premisskontroll): fram till 2026-08-10 lagrades varje stegs status som en
// manuellt ikryssad boolean (`steg.<nyckel>`, skriven av en checkbox i KomIgangChecklista.jsx)
// – en superadmin kunde bocka av "Bjud in kollegor" utan att någonsin ha bjudit in någon.
// Enligt planens egen regel ("härleds stegen ur data är delmålet klart, markeras de manuellt
// är en checklista som säger 'klart' om en tom organisation värre än ingen checklista") är
// varje steg nu HÄRLETT ur faktisk data istället – ingen längre skrivbar av användaren.
//
// De fyra härledningskällorna (organisationsdokumentet, AI-budgeten, rutiner, användare)
// abonneras BARA när checklistaFinns är sant – de allra flesta organisationer (etablerade
// före Etapp 15a, eller som redan blivit klara) saknar dokumentet helt och ska inte betala
// fyra extra Firestore-lyssnare på varje besök på startsidan för en checklista som ändå
// aldrig visas.
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";
import { harledStegStatus } from "../utils/valkomstchecklista";

export const CHECKLISTA_STEG = [
  {
    nyckel: "bjud_in_kollegor",
    titel: "Bjud in kollegor",
    beskrivning: "Skicka inbjudningar så fler i verksamheten kan logga in.",
    lank: "/admin",
  },
  {
    nyckel: "satt_roller",
    titel: "Sätt roller",
    beskrivning: "Ge varje inbjuden person rätt roll (superadmin, sektionsledare, vec m.fl.).",
    lank: "/admin",
  },
  {
    nyckel: "importera_rutiner",
    titel: "Importera de första rutinerna",
    beskrivning: "Ladda upp ett dokument eller en bild så tolkar Gemini innehållet åt er.",
    lank: "/ladda-upp",
  },
  {
    nyckel: "aktivera_2fa_policy",
    titel: "Ta ställning till tvåfaktorskrav",
    beskrivning: "Bestäm vilka roller som ska tvingas använda 2FA.",
    lank: "/admin",
  },
  {
    nyckel: "satt_gemini_budget",
    titel: "Sätt en AI-budget",
    beskrivning: "Bekräfta eller justera månadstaket för AI-tolkning.",
    lank: "/admin",
  },
];

// undefined = laddar, null = ingen checklista finns (organisationen etablerades före Etapp
// 15a, eller är annars inte relevant), annars ett härlett stegobjekt.
export function useValkomstchecklista() {
  const { currentUser, organisationId, role } = useAuth();
  const [checklistaFinns, setChecklistaFinns] = useState(undefined);
  const [orgData, setOrgData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [rutiner, setRutiner] = useState([]);
  const [anvandare, setAnvandare] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId, "installningar", "valkomstchecklista"),
      (snap) => setChecklistaFinns(snap.exists()),
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "valkomstchecklista", fel: error });
      },
    );
  }, [organisationId, role]);

  useEffect(() => {
    if (!organisationId || checklistaFinns !== true) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => setOrgData(snap.exists() ? snap.data() : null),
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, fel: error });
      },
    );
  }, [organisationId, role, checklistaFinns]);

  useEffect(() => {
    if (!organisationId || checklistaFinns !== true) return undefined;
    return onSnapshot(
      doc(db, "organisationer", organisationId, "installningar", "geminiBudget"),
      (snap) => setBudgetData(snap.exists() ? snap.data() : null),
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "geminiBudget", fel: error });
      },
    );
  }, [organisationId, role, checklistaFinns]);

  useEffect(() => {
    if (!organisationId || checklistaFinns !== true) return undefined;
    const q = query(collection(db, "rutiner"), where("organisationId", "==", organisationId));
    return onSnapshot(
      q,
      (snap) => setRutiner(snap.docs.map((d) => d.data())),
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "rutiner", roll: role, organisationId, fel: error });
      },
    );
  }, [organisationId, role, checklistaFinns]);

  useEffect(() => {
    if (!organisationId || checklistaFinns !== true) return undefined;
    const q = query(collection(db, "users"), where("organisationId", "==", organisationId));
    return onSnapshot(
      q,
      (snap) => setAnvandare(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "users", roll: role, organisationId, fel: error });
      },
    );
  }, [organisationId, role, checklistaFinns]);

  const steg =
    checklistaFinns === false
      ? null
      : checklistaFinns === undefined
        ? undefined
        : harledStegStatus({ anvandare, egetUid: currentUser?.uid, rutiner, orgData, budgetData });

  const antalKlara = steg ? CHECKLISTA_STEG.filter((s) => steg[s.nyckel]).length : 0;
  const alltKlart = steg != null && antalKlara === CHECKLISTA_STEG.length;

  return { steg, antalKlara, totalt: CHECKLISTA_STEG.length, alltKlart, fel };
}
