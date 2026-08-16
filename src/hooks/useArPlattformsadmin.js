// Etapp 67a (ETAPPLAN16.md): klientens enda väg att veta om den inloggade är plattformsadmin
// (leverantörsadmin). Till skillnad från alla andra behörigheter i appen sitter den INTE i
// users/{uid}.role – den ÄR existensen av ett dokument i plattformsadmin/{uid}, en collection
// ingen klient någonsin får skriva till (firestore.rules:300–302, "allow write: if false").
// Statusen kan därför bara avgöras genom att FÖRSÖKA läsa dokumentet: samma regel tillåter
// läsning enbart för den som redan är plattformsadmin, så en lyckad läsning betyder ja och
// permission-denied betyder nej.
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
// Själva avgränsningen (bara superadmins gör försöket) bor i roles.js, eftersom den filen är
// fri från Firebase-importer och därför går att enhetstesta – se dess kommentar för hela
// motiveringen, och src/firebase/arPlattformsadminGating.test.js för testet som låser den.
// Kort: en nekad läsning ÄR svaret "nej", och att göra den för alla användare hade lagt en
// alltid misslyckad läsning på startsidans kritiska väg och förorenat Etapp 32b:s tänkta
// "upprepade permission-denied"-larm.
import { farForsokaLasaPlattformsadmin } from "../firebase/roles";

// Statusen kan aldrig ändras mitt i en session – den sätts uteslutande av en Cloud Function
// (Admin SDK), aldrig av klienten. Svaret cachas därför per uid för hela sessionen istället
// för att läsas om vid varje montering av BottomNav respektive kommandopaletten.
const svarPerUid = new Map();
// BottomNav och useSokindex monteras samtidigt på startsidan. Utan den här avdupliceringen
// hade de skickat var sin identisk läsning innan den första hunnit svara.
const pagaendePerUid = new Map();

function hamtaStatus(uid) {
  if (!pagaendePerUid.has(uid)) {
    pagaendePerUid.set(
      uid,
      getDoc(doc(db, "plattformsadmin", uid))
        .then((snap) => snap.exists())
        // permission-denied ÄR svaret "nej" här, inte ett fel. Rapporteras därför medvetet
        // inte vidare via rapporteraNekadListning – den är till för nekade läsningar som
        // faktiskt indikerar ett regelfel, och skulle bara dölja de riktiga fallen i brus.
        .catch(() => false)
        .then((svar) => {
          svarPerUid.set(uid, svar);
          pagaendePerUid.delete(uid);
          return svar;
        })
    );
  }
  return pagaendePerUid.get(uid);
}

export function useArPlattformsadmin() {
  const { currentUser, role } = useAuth();
  const uid = currentUser?.uid ?? null;
  const farForsoka = farForsokaLasaPlattformsadmin(uid, role);
  // Allt svarsvärde bor i modulcachen ovan, inte i komponentens state – den här räknaren
  // finns bara för att tvinga fram en omrendering när läsningen landat. Det håller effekten
  // fri från synkrona setState-anrop, som react-hooks/set-state-in-effect flaggar (samma
  // problem som redan är kommenterat i Leverantor.jsx:109).
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!farForsoka || svarPerUid.has(uid)) return undefined;
    let avbruten = false;
    hamtaStatus(uid).then(() => {
      if (!avbruten) setVersion((v) => v + 1);
    });
    return () => {
      avbruten = true;
    };
  }, [uid, farForsoka]);

  if (!farForsoka) return { arPlattformsadmin: false, laddar: false };
  if (!svarPerUid.has(uid)) return { arPlattformsadmin: false, laddar: true };
  return { arPlattformsadmin: svarPerUid.get(uid), laddar: false };
}
