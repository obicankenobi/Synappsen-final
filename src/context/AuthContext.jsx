// Hanterar inloggning, registrering och rollhämtning för Synappsen
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, rensaLokalaAnvandardata } from "../firebase/config";
import { STANDARD_ORG } from "../firebase/organisation";
import { losInInbjudan } from "../firebase/functions";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organisationId, setOrganisationId] = useState(null);
  const [namn, setNamn] = useState(null);
  const [namnLaddat, setNamnLaddat] = useState(false);
  const [profilbildUrl, setProfilbildUrl] = useState(null);
  const [pushTokens, setPushTokens] = useState([]);
  const [pushInstallningar, setPushInstallningar] = useState({});
  const [epostInstallningar, setEpostInstallningar] = useState({});
  const [foregaendeInloggning, setForegaendeInloggning] = useState(null);
  const [personalpulsSenastBesvarad, setPersonalpulsSenastBesvarad] = useState(null);
  const [loading, setLoading] = useState(true);

  // Etapp 6c: registrering kräver numera alltid en giltig inbjudan – öppen självbetjänings-
  // registrering stängdes (se firestore.rules users/{userId} allow create: if false). Skapar
  // Firebase Auth-kontot FÖRST, löser sedan in inbjudan (Cloud Function, Admin SDK skriver
  // users/{uid}). Om inlösningen misslyckas (t.ex. token redan använt av en annan flik under
  // tiden) raderas det precis skapade auth-kontot igen, så inget föräldralöst konto blir kvar.
  async function registrera(email, losenord, namn, token) {
    const { user } = await createUserWithEmailAndPassword(auth, email, losenord);
    try {
      await losInInbjudan(token, namn);
    } catch (fel) {
      await user.delete().catch(() => {});
      throw fel;
    }
    return user;
  }

  function loggaIn(email, losenord) {
    return signInWithEmailAndPassword(auth, email, losenord);
  }

  // Säkerhetsfix: enbart signOut() lämnade Firestores IndexedDB-cache orörd – på en delad
  // dator kunde nästa person läsa föregående användares rutiner/kontakter/förrådsartiklar ur
  // webbläsarens lagring, och en offline-query efter ett organisationsbyte kunde serveras ur
  // fel organisations cache. Städningen sker därför i tur och ordning: signOut → tömning av
  // lokal data (rensaLokalaAnvandardata) → HÅRD omladdning, eftersom en terminerad
  // Firestore-instans inte går att återanvända i samma sidlivstid.
  //
  // Inget steg får kunna hindra utloggningen: signOut-fel loggas (auth-tillståndet rensas
  // ändå lokalt), städningen sväljer sina egna fel (t.ex. `failed-precondition` när en annan
  // flik håller Firestore-instansen öppen), och omladdningen ligger i ett finally så den
  // körs även om något oväntat kastar. Omladdningen ersätter historikposten
  // (location.replace) så bakåtknappen inte tar nästa person tillbaka in i appen.
  async function loggaUt() {
    try {
      await signOut(auth);
    } catch (fel) {
      console.error("Utloggningen mot Firebase Auth misslyckades:", fel);
    }
    try {
      await rensaLokalaAnvandardata();
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/logga-in");
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Bugfix: getDoc SAKNADE tidigare felhantering här. Ett avvisat löfte (offline på en
        // enhet utan cachat users-dokument, en nekad regel, ett nätverksavbrott) hoppade då
        // över setLoading(false) längst ned – och eftersom providern renderar
        // `{!loading && children}` blev HELA appen en permanent vit skärm utan felmeddelande,
        // inte ens en inloggningssida. Extra allvarligt i en PWA som ska fungera i drift.
        // Rollen/organisationen lämnas null vid fel, vilket är det säkra utfallet: SkyddadRoute
        // /RollSkyddadRoute släpper då inte igenom något innehåll.
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          setRole(snap.exists() ? snap.data().role : null);
          // Fallback till STANDARD_ORG för konton skapade innan organisationId infördes
          // (Etapp 1) – matchar samma fallback som firestore.rules använder.
          setOrganisationId(snap.exists() ? snap.data().organisationId ?? STANDARD_ORG : null);
          // Etapp 25a: fångar förra inloggningens tidpunkt INNAN den skrivs över nedan – det är
          // den "sedan ditt förra pass"-sammanställningen (useSedanForraPasset.js) utgår från.
          // Sparas en gång per session (skrivs aldrig om av notisbesök e.dyl. under sessionen).
          setForegaendeInloggning(snap.exists() ? (snap.data().senasteInloggning ?? null) : null);
          // Spårar senaste inloggning så adminpanelen kan visa inaktiva konton.
          // Får inte blockera inloggningsflödet om skrivningen misslyckas.
          if (snap.exists()) {
            updateDoc(doc(db, "users", user.uid), { senasteInloggning: serverTimestamp() }).catch(
              () => {}
            );
          }
        } catch (fel) {
          console.error("Kunde inte läsa användarprofilen:", fel);
          setRole(null);
          setOrganisationId(null);
          setForegaendeInloggning(null);
        }
      } else {
        setRole(null);
        setOrganisationId(null);
        setNamn(null);
        setNamnLaddat(false);
        setProfilbildUrl(null);
        setPushTokens([]);
        setPushInstallningar({});
        setEpostInstallningar({});
        setForegaendeInloggning(null);
        setPersonalpulsSenastBesvarad(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Etapp 22a: eget visningsnamn (Profil.jsx), lyssnat live (inte bara vid inloggning) så en
  // ändring där syns direkt överallt annars i appen som visar "vem gjorde det här" – utan att
  // röra ovanstående effekt, som redan styr `loading`-grinden och inte ska bli reaktiv.
  // Nollställning vid utloggning sker i effekten ovan – här hanteras bara den inloggade
  // prenumerationen, så effektkroppen aldrig anropar setState direkt (bara i callbacken).
  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      setNamn(snap.exists() ? (snap.data().namn ?? null) : null);
      setProfilbildUrl(snap.exists() ? (snap.data().profilbildUrl ?? null) : null);
      // Etapp 24c: push-inställningar lyssnas live så en avstängning i Profil.jsx (t.ex. från
      // en annan flik/enhet) syns direkt utan omladdning.
      setPushTokens(snap.exists() ? (snap.data().pushTokens ?? []) : []);
      setPushInstallningar(snap.exists() ? (snap.data().pushInstallningar ?? {}) : {});
      // Etapp 53c: e-postpåminnelser, till skillnad från push, är opt-OUT (se motiveringen i
      // functions/index.js hamtaAnvandareForEpostPaminnelse) – ett tomt/saknat objekt betyder
      // alltså PÅ, inte AV, och läses därför bara ut här utan en egen defaultning.
      setEpostInstallningar(snap.exists() ? (snap.data().epostInstallningar ?? {}) : {});
      // Etapp 39c: skrivs bara av Cloud Function svaraPersonalpuls (Admin SDK) – lyssnas live
      // så formuläret försvinner direkt efter ett inskick, utan omladdning.
      setPersonalpulsSenastBesvarad(snap.exists() ? (snap.data().personalpulsSenastBesvarad ?? null) : null);
      setNamnLaddat(true);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const value = {
    currentUser,
    role,
    organisationId,
    namn,
    namnLaddat,
    profilbildUrl,
    pushTokens,
    pushInstallningar,
    epostInstallningar,
    foregaendeInloggning,
    personalpulsSenastBesvarad,
    loading,
    registrera,
    loggaIn,
    loggaUt,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
