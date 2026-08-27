// Etapp 71: läser frågebankens fyra källor och lämnar ifrån sig en färdigt sammanslagen
// lista. Sammanslagningslogiken ligger i utils/kvissbank.js (ren funktion, egna tester) –
// den här filen gör bara prenumerationerna.
//
// FYRA lyssnare kan se mycket, men var och en är liten och två av dem är dokument, inte
// listor. Alternativet – att lägga allt i ett dokument – hade gjort varje redigering till en
// skrivning av hela banken och gjort per-fråge-regler omöjliga.
//
// Offline: Firestores klientcache gör att en redan hämtad bank finns kvar utan nät, precis
// som för rutiner. Det är en försämring mot den statiska banken (som låg i bundlen och alltid
// fanns), men priset för att kunna redigera utan deploy – och Öva-läget är inte en funktion
// någon behöver mitt i ett akutläge.
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { byggKvissbank } from "../utils/kvissbank";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useKvissbank() {
  const { organisationId, role } = useAuth();
  const [globalaFragor, setGlobalaFragor] = useState([]);
  const [globaltStopp, setGlobaltStopp] = useState({});
  const [overlagringar, setOverlagringar] = useState({});
  const [egnaFragor, setEgnaFragor] = useState([]);
  const [kundensVal, setKundensVal] = useState({});
  const [laddar, setLaddar] = useState(true);

  // Leverantörens globala frågor + globalt nödstopp. Inte organisationsskopade – samma
  // innehåll för alla kunder, se firestore.rules för varför det är ofarligt.
  useEffect(() => {
    const avslutaFragor = onSnapshot(
      collection(db, "kvissfragor"),
      (snap) => {
        setGlobalaFragor(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
      },
      (fel) => {
        setLaddar(false);
        rapporteraNekadListning({ collection: "kvissfragor", roll: role, organisationId, fel });
      }
    );
    const avslutaStopp = onSnapshot(
      collection(db, "kvisspaket"),
      (snap) => {
        setGlobaltStopp(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])));
      },
      (fel) => {
        rapporteraNekadListning({ collection: "kvisspaket", roll: role, organisationId, fel });
      }
    );
    return () => {
      avslutaFragor();
      avslutaStopp();
    };
  }, [organisationId, role]);

  // Kundens tre delar: överlagringar, egna frågor och paketvalen på organisationsdokumentet.
  useEffect(() => {
    if (!organisationId) return undefined;
    const orgRef = doc(db, "organisationer", organisationId);

    const avslutaOverlagring = onSnapshot(
      collection(orgRef, "kvissoverlagring"),
      (snap) => setOverlagringar(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      (fel) =>
        rapporteraNekadListning({ collection: "kvissoverlagring", roll: role, organisationId, fel })
    );
    const avslutaEgna = onSnapshot(
      collection(orgRef, "kvissegna"),
      (snap) => setEgnaFragor(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (fel) => rapporteraNekadListning({ collection: "kvissegna", roll: role, organisationId, fel })
    );
    const avslutaOrg = onSnapshot(
      orgRef,
      (snap) => setKundensVal(snap.data()?.kvisspaket ?? {}),
      (fel) =>
        rapporteraNekadListning({
          collection: "organisationer",
          roll: role,
          organisationId,
          sokvag: "kvisspaket",
          fel,
        })
    );

    return () => {
      avslutaOverlagring();
      avslutaEgna();
      avslutaOrg();
    };
  }, [organisationId, role]);

  const bank = useMemo(
    () => byggKvissbank({ globalaFragor, overlagringar, egnaFragor, kundensVal, globaltStopp }),
    [globalaFragor, overlagringar, egnaFragor, kundensVal, globaltStopp]
  );

  return {
    bank,
    laddar,
    // Råa lager – behövs av adminvyn, som måste kunna visa även DOLDA frågor (annars går de
    // inte att slå på igen) och skilja en överlagrad fråga från en orörd.
    globalaFragor,
    overlagringar,
    egnaFragor,
    kundensVal,
    globaltStopp,
  };
}
