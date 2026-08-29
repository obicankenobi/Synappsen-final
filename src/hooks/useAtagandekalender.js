// Etapp L1o (intern/ETAPPLAN-INTERN-1.md): direkt klientläsning av atagandekalender/{id},
// gated av firestore.rules (arPlattformsadmin()) – samma mönster som useKvissbank.js redan
// använder för kvissfragor/kvisspaket. Ingen callable behövs för att LÄSA; skrivning går
// alltid via seedaAtagandekalender/sattAtagandeUtfort (Admin SDK), se firestore.rules.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useAtagandekalender() {
  const { organisationId, role } = useAuth();
  const [atagandekalender, setAtagandekalender] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const avsluta = onSnapshot(
      collection(db, "atagandekalender"),
      (snap) => {
        setAtagandekalender(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              // Firestore-Timestamp om skrivet av rto-matning.cjs eller sattAtagandeUtfort
              // (båda skriver ISO-strängar i praktiken, men konverteringen skyddar mot att
              // en framtida skrivväg råkar spara ett riktigt Timestamp-objekt istället).
              senastUtfort: data.senastUtfort?.toDate?.().toISOString() ?? data.senastUtfort ?? null,
            };
          })
        );
        setLaddar(false);
      },
      (fel) => {
        setLaddar(false);
        rapporteraNekadListning({ collection: "atagandekalender", roll: role, organisationId, fel });
      }
    );
    return avsluta;
  }, [organisationId, role]);

  return { atagandekalender, laddar };
}
