// Egna genvägar på startsidan – varje användare väljer själv vilka snabblänkar som visas.
// Sparas som en array av nycklar direkt på users/{uid}.snabblankar. Om fältet saknas visas
// alla genvägar (bakåtkompatibelt beteende för konton skapade innan funktionen fanns).
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const ALLA_SNABBLANKAR = [
  { nyckel: "anslag", ikon: "📢", namn: "Anslagstavla", sokvag: "/anslag" },
  { nyckel: "nyheter", ikon: "🆕", namn: "Nyheter", sokvag: "/nyheter" },
  { nyckel: "feedback", ikon: "💬", namn: "Feedback", sokvag: "/feedback" },
  { nyckel: "hjalp", ikon: "❓", namn: "Hjälp", sokvag: "/hjalp" },
  { nyckel: "profil", ikon: "👤", namn: "Min profil", sokvag: "/profil" },
  { nyckel: "kontakter", ikon: "☎️", namn: "Kontakter", sokvag: "/kontakter" },
  { nyckel: "introduktion", ikon: "🎓", namn: "Introduktion", sokvag: "/introduktion" },
  { nyckel: "kompetensmatris", ikon: "📋", namn: "Kompetensmatris", sokvag: "/kompetensmatris" },
  { nyckel: "lankbibliotek", ikon: "🔗", namn: "Länkbibliotek", sokvag: "/lankbibliotek" },
  { nyckel: "papperskorg", ikon: "🗑️", namn: "Papperskorg", sokvag: "/papperskorg" },
];

export function useSnabblankar(uid) {
  const [valda, setValda] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(doc(db, "users", uid), (snap) => {
      setValda(snap.data()?.snabblankar ?? null);
    });
    return unsubscribe;
  }, [uid]);

  async function satValda(nycklar) {
    await updateDoc(doc(db, "users", uid), { snabblankar: nycklar });
  }

  // null = inget val gjort ännu → visa alla (bakåtkompatibelt)
  const synliga = valda === null ? ALLA_SNABBLANKAR : ALLA_SNABBLANKAR.filter((s) => valda.includes(s.nyckel));

  return { valda, synliga, satValda };
}
