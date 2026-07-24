// Hanterar inloggning, registrering och rollhämtning för Synappsen
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { DEFAULT_ROLE } from "../firebase/roles";
import { STANDARD_ORG } from "../firebase/organisation";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organisationId, setOrganisationId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function registrera(email, losenord, namn) {
    const { user } = await createUserWithEmailAndPassword(auth, email, losenord);
    await setDoc(doc(db, "users", user.uid), {
      namn,
      email,
      role: DEFAULT_ROLE,
      organisationId: STANDARD_ORG,
      skapad: serverTimestamp(),
    });
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
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, role, organisationId, loading, registrera, loggaIn, loggaUt };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
