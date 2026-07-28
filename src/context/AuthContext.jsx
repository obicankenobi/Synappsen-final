// Hanterar inloggning, registrering och rollhämtning för Synappsen
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { STANDARD_ORG } from "../firebase/organisation";
import { losInInbjudan } from "../firebase/functions";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organisationId, setOrganisationId] = useState(null);
  const [namn, setNamn] = useState(null);
  const [namnLaddat, setNamnLaddat] = useState(false);
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

  function loggaUt() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        setRole(snap.exists() ? snap.data().role : null);
        // Fallback till STANDARD_ORG för konton skapade innan organisationId infördes
        // (Etapp 1) – matchar samma fallback som firestore.rules använder.
        setOrganisationId(snap.exists() ? snap.data().organisationId ?? STANDARD_ORG : null);
        // Spårar senaste inloggning så adminpanelen kan visa inaktiva konton.
        // Får inte blockera inloggningsflödet om skrivningen misslyckas.
        if (snap.exists()) {
          updateDoc(doc(db, "users", user.uid), { senasteInloggning: serverTimestamp() }).catch(
            () => {}
          );
        }
      } else {
        setRole(null);
        setOrganisationId(null);
        setNamn(null);
        setNamnLaddat(false);
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
