import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { useAnvandare } from "../hooks/useAnvandare";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { markeraSokloggAtgardad } from "../hooks/useSokloggar";
import { laddaUppRutinBilagor, laddaUppRutinBild } from "../firebase/storage";
import RutinFormular from "./RutinFormular";
import RutinKort from "./RutinKort";
import { arUtgangen, arArkiverad } from "../utils/rutinHjalp";
import Skelett from "./Skelett";
import { useSenastBesokta } from "../hooks/useSenastBesokta";
import { useDialog } from "../hooks/useDialog";
import { useAndringsforslag, markeraInfort, avvisaForslag } from "../hooks/useAndringsforslag";
import ForslagSektion from "./ForslagSektion";
import { ROLES } from "../firebase/roles";

// Etapp 26b: "Inför ska öppna rutinformuläret med förslaget förifyllt på rätt plats – inte
// tvinga redaktören att klippa och klistra manuellt." Riktig platsigenkänning (hitta EXAKT var
// i innehållet ändringen hör hemma) är inte byggbart tillförlitligt utan en riktig diff-motor
// – istället infogas förslaget direkt EFTER det markerade stycket om det går att hitta
// ordagrant i innehållet, annars läggs det till sist. Formaterat som ett citat ("Förslag att
// bedöma") så redaktören tydligt ser att det INTE är befintligt, godkänt innehåll och måste
// aktivt redigera bort markeringen innan sparning (26d – ingen automatik).
function infogaForslagIInnehall(innehall, markeratStycke, forslag) {
  const stycke = markeratStycke?.trim();
  const tillagg = `\n\n> **Förslag att bedöma:** ${forslag}`;
  if (stycke && innehall.includes(stycke)) {
    return innehall.replace(stycke, `${stycke}${tillagg}`);
  }
  return `${innehall ?? ""}${tillagg}`;
}

export default function Sektionssida({
  omrade,
  titel,
  ikon,
  beskrivning,
  redigeraRoller,
  godkannaRoller,
  extra,
}) {
  const { currentUser, role, namn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Etapp 22a: eget visningsnamn istället för e-post i kvitterings-/godkännandespår, med
  // e-post som fallback för konton som saknar ett satt namn.
  const mittNamn = namn || currentUser?.email;
  const { confirm, visaMeddelande } = useDialog();
  const { registrera: registreraBesok } = useSenastBesokta(currentUser?.uid);
  const {
    rutiner,
    laddar,
    skapaRutin,
    uppdateraRutin,
    godkannRutin,
    taBortRutin,
    markeraGranskad,
    arkiveraRutin,
    hamtaVersioner,
  } = useRutiner(omrade);
  const { anvandare } = useAnvandare();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);
  // Etapp 62a: "Skapa rutin"-genvägen från en sökning-utan-träff-rad i adminpanelen
  // (SokningarUtanTraffarSektion.jsx) skickar med söktermen och loggpostens id via
  // router-state – öppnas här som en FÖRIFYLLD ny rutin, inte en redigering (redigerar
  // förblir null så hanteraSpara tar rätt gren). sokloggId hålls kvar tills sparningen
  // faktiskt lyckas, då markeras sökluckan åtgärdad (se hanteraSpara nedan).
  const [forifylldSokning, setForifylldSokning] = useState(null);
  useEffect(() => {
    if (!location.state?.sokloggTitel) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reagerar på en EXTERN händelse (en
       Link-navigering med router-state från SokningarUtanTraffarSektion.jsx), inte på
       härledbart render-data. Rensar router-state i samma veva så en sidladdning inte öppnar
       formuläret igen. */
    setRedigerar(null);
    setForifylldSokning({ titel: location.state.sokloggTitel, sokloggId: location.state.sokloggId });
    setVisaFormular(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ska bara köras när location.state faktiskt bär en ny sokloggTitel
  }, [location.state]);
  // Etapp 26b: förslaget som just nu redigeras via "Inför" – null när formuläret öppnats på
  // vanligt sätt. Sätts bara till "infört" i Firestore EFTER en faktisk sparning (se
  // hanteraSpara), aldrig bara av att öppna formuläret – annars skulle ett avbrutet
  // redigeringsförsök felaktigt markera förslaget som hanterat.
  const [hanterasForslag, setHanterasForslag] = useState(null);
  const { forslag } = useAndringsforslag(omrade);
  // Etapp 38c: varje öppet förslag får sin diff förberäknad (mot rutinens NUVARANDE innehåll,
  // inte innehållet vid förslagets skapande – en rutin kan ha redigerats sedan dess) så
  // ForslagSektion.jsx kan visa den utan att själv känna till infogaForslagIInnehall eller
  // ha tillgång till hela rutinlistan.
  const oppnaForslag = forslag
    .filter((f) => f.status === "ny")
    .map((f) => {
      const rutin = rutiner.find((r) => r.id === f.rutinId);
      if (!rutin) return f;
      return {
        ...f,
        innehallFore: rutin.innehall,
        innehallEfter: infogaForslagIInnehall(rutin.innehall, f.markeratStycke, f.forslag),
      };
    });
  const [aktivTagg, setAktivTagg] = useState(null);
  const [massval, setMassval] = useState(false);
  const [valda, setValda] = useState([]);
  const [massTagg, setMassTagg] = useState("");

  const farRedigera = redigeraRoller.includes(role);
  const farGodkanna = godkannaRoller.includes(role);
  // Etapp 17c: bara VÖL/superadmin kurerar akutläget, oavsett vilket område rutinen tillhör
  // (samma roller som farGodkannaKlinisktInnehall() i firestore.rules, som spärrar fältet
  // faktiskt på servern – det här är bara motsvarande UI-gating).
  const farKureraAkutlage = role === ROLES.SUPERADMIN || role === ROLES.VOL;
  // Om ingen separat godkännarroll finns publiceras innehållet direkt vid sparning
  const kraverGodkannande = redigeraRoller.some((r) => !godkannaRoller.includes(r));
  const synligaRutiner = farRedigera
    ? rutiner
    : rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND && !arUtgangen(r) && !arArkiverad(r));

  const utkastRutiner = synligaRutiner.filter((r) => r.status === RUTIN_STATUS.UTKAST);

  // "Senast besökta"-spårning (Hem.jsx): registrerar den rutin URL:ens hash pekar på, oavsett
  // om användaren kom via sökning, en notis, en QR-länk eller en direkt bokmärkt URL. Lyssnar
  // även på hashchange eftersom navigering mellan rutiner på SAMMA sida (t.ex. två sökträffar
  // i samma område) bara ändrar hash, utan att sidan (och därmed detta useEffect) monteras om.
  const senastRegistreradHash = useRef(null);
  useEffect(() => {
    function kollaHash() {
      const hash = window.location.hash;
      if (!hash || hash === senastRegistreradHash.current) return;
      const match = hash.match(/^#rutin-(.+)$/);
      if (!match) return;
      const rutin = synligaRutiner.find((r) => r.id === match[1]);
      if (!rutin) return;
      senastRegistreradHash.current = hash;
      registreraBesok({ id: rutin.id, titel: rutin.titel, sokvag: `${window.location.pathname}${hash}` });
    }
    kollaHash();
    window.addEventListener("hashchange", kollaHash);
    return () => window.removeEventListener("hashchange", kollaHash);
  }, [synligaRutiner, registreraBesok]);

  const allaTaggar = useMemo(() => {
    const set = new Set();
    synligaRutiner.forEach((r) => (r.taggar ?? []).forEach((t) => set.add(t)));
    return [...set].sort();
  }, [synligaRutiner]);

  const filtreradeRutiner = aktivTagg
    ? synligaRutiner.filter((r) => (r.taggar ?? []).includes(aktivTagg))
    : synligaRutiner;

  // Möjliggör djuplänkning från sökresultat: /kliniskt-stod#rutin-{id} scrollar till rätt kort
  useEffect(() => {
    if (!laddar && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [laddar, rutiner]);

  async function godkannAllaUtkast() {
    await Promise.all(utkastRutiner.map((r) => godkannRutin(r.id, currentUser.uid, mittNamn)));
  }

  async function nekaAllaUtkast() {
    if (!(await confirm(`Ta bort alla ${utkastRutiner.length} utkast? Detta går inte att ångra.`))) return;
    await Promise.all(utkastRutiner.map((r) => taBortRutin(r.id, currentUser.uid)));
  }

  // Etapp 22c: RutinFormular.jsx känner inte till rutinens Storage-sökväg (kräver ett
  // rutinId, som inte finns för en ny rutin förrän skapaRutin körts) – laddar bara upp den
  // valda filen HÄR, efter att id:t finns, och ersätter nyBildFil med den riktiga URL:en.
  async function laddaUppStegBilder(rutinId, stegLista) {
    return Promise.all(
      (stegLista ?? []).map(async (s) => {
        if (!s.nyBildFil) return s;
        const bild = await laddaUppRutinBild(omrade, rutinId, s.nyBildFil);
        const { nyBildFil, ...resten } = s;
        void nyBildFil;
        return { ...resten, bild };
      })
    );
  }

  async function hanteraSpara({
    titel: titelVarde,
    innehall,
    referenser,
    taggar,
    utgangsdatum,
    relaterade,
    nyaFiler,
    befintligaBilagor,
    agare,
    akutlage,
    akutlageOrdning,
    driftstopp,
    driftstoppOrdning,
    lattlastText,
    begrepp,
    steg,
    kviss,
    kallaSteg,
    kallaKviss,
    vasentligAndring,
    externaKallor,
  }) {
    if (redigerar) {
      const nyaBilagor = nyaFiler.length ? await laddaUppRutinBilagor(omrade, redigerar.id, nyaFiler) : [];
      const stegMedBilder = await laddaUppStegBilder(redigerar.id, steg);
      await uppdateraRutin(
        redigerar.id,
        {
          titel: titelVarde,
          innehall,
          referenser,
          taggar,
          utgangsdatum,
          relateradeRutiner: relaterade,
          bilagor: [...befintligaBilagor, ...nyaBilagor],
          agare,
          steg: stegMedBilder,
          kviss,
          kallaSteg,
          kallaKviss,
          externaKallor,
          ...(farKureraAkutlage ? { akutlage, akutlageOrdning } : {}),
          ...(farKureraAkutlage ? { driftstopp, driftstoppOrdning } : {}),
          lattlastText,
          begrepp,
          // Etapp 19c: bara den som får godkänna kliniskt innehåll kan kryssa i "väsentlig
          // ändring" (samma roller som farKureraAkutlage, se firestore.rules) – annars kunde
          // vem som helst med redigeringsrätt tvinga fram omkvittering för hela organisationen.
          ...(farKureraAkutlage && vasentligAndring ? { senasteVasentligaAndring: serverTimestamp() } : {}),
          // Etapp 26c: attribution sätts bara om redigeringen faktiskt startades via "Inför"
          // på ett förslag (se oppnaInforForslag nedan) – en vanlig redigering rör inte dessa
          // fält alls.
          ...(hanterasForslag
            ? {
                senastForslagAv: hanterasForslag.foreslagenAv,
                senastForslagAvNamn: hanterasForslag.foreslagenAvNamn,
                senastForslagSynligt: hanterasForslag.visaNamnOffentligt !== false,
              }
            : {}),
        },
        currentUser.uid
      );
      if (hanterasForslag) {
        await markeraInfort(hanterasForslag.id, currentUser.uid, mittNamn);
        setHanterasForslag(null);
      }
    } else {
      const ref = await skapaRutin({
        titel: titelVarde,
        innehall,
        omrade,
        skapadAv: currentUser.uid,
        kraverGodkannande,
      });
      await uppdateraRutin(ref.id, {
        referenser,
        taggar,
        utgangsdatum,
        relateradeRutiner: relaterade,
        bilagor: nyaFiler.length ? await laddaUppRutinBilagor(omrade, ref.id, nyaFiler) : [],
        agare,
        steg: await laddaUppStegBilder(ref.id, steg),
        kviss,
        kallaSteg,
        kallaKviss,
        externaKallor,
        lattlastText,
        begrepp,
      });
      if (forifylldSokning?.sokloggId) {
        await markeraSokloggAtgardad(forifylldSokning.sokloggId, ref.id);
      }
    }
    setVisaFormular(false);
    setRedigerar(null);
    setForifylldSokning(null);
  }

  function oppnaRedigering(rutin) {
    setRedigerar(rutin);
    setVisaFormular(true);
  }

  // Etapp 26b: öppnar redigeraren med förslaget färdiginfogat i innehållet – redaktören
  // granskar/justerar/städar bort markeringen som vilken annan redigering som helst, och
  // förslaget markeras "infört" i Firestore FÖRST när den sparningen faktiskt går igenom
  // (se hanteraSpara). Avbryts redigeringen istället förblir förslaget "ny".
  function oppnaInforForslag(f) {
    const rutin = rutiner.find((r) => r.id === f.rutinId);
    if (!rutin) {
      visaMeddelande("Rutinen förslaget gäller hittades inte (kan ha tagits bort).");
      return;
    }
    setHanterasForslag(f);
    oppnaRedigering({ ...rutin, innehall: infogaForslagIInnehall(rutin.innehall, f.markeratStycke, f.forslag) });
  }

  async function hanteraAvvisaForslag(f, motivering) {
    await avvisaForslag(f.id, currentUser.uid, mittNamn, motivering);
  }

  function oppnaNyRutin() {
    setRedigerar(null);
    setForifylldSokning(null);
    setVisaFormular(true);
  }

  function vaxlaVal(id) {
    setValda((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  async function hanteraMassTaggning() {
    const tagg = massTagg.trim();
    if (!tagg || valda.length === 0) return;
    await Promise.all(
      valda.map((id) => {
        const rutin = rutiner.find((r) => r.id === id);
        const taggar = [...new Set([...(rutin?.taggar ?? []), tagg])];
        return uppdateraRutin(id, { taggar }, currentUser.uid);
      })
    );
    setMassTagg("");
    setValda([]);
    setMassval(false);
  }

  async function hanteraMassTaggBorttagning() {
    const tagg = massTagg.trim();
    if (!tagg || valda.length === 0) return;
    await Promise.all(
      valda.map((id) => {
        const rutin = rutiner.find((r) => r.id === id);
        const taggar = (rutin?.taggar ?? []).filter((t) => t !== tagg);
        return uppdateraRutin(id, { taggar }, currentUser.uid);
      })
    );
    setMassTagg("");
    setValda([]);
    setMassval(false);
  }

  // Etapp 42a: kompletterar den redan befintliga "Godkänn alla"/"Neka alla" (som gäller HELA
  // utkastkön) med möjligheten att godkänna/neka bara ett URVAL, via samma markeringsmekanism
  // som redan finns för masstaggning – ingen ny selektionsmodell, bara en till åtgärd på den.
  const valdaUtkast = valda.filter((id) => utkastRutiner.some((r) => r.id === id));

  async function hanteraGodkannValda() {
    await Promise.all(valdaUtkast.map((id) => godkannRutin(id, currentUser.uid, mittNamn)));
    setValda([]);
    setMassval(false);
  }

  async function hanteraNekaValda() {
    if (!(await confirm(`Ta bort ${valdaUtkast.length} markerade utkast? Detta går inte att ångra.`))) return;
    await Promise.all(valdaUtkast.map((id) => taBortRutin(id, currentUser.uid)));
    setValda([]);
    setMassval(false);
  }

  async function hanteraAterstallVersion(rutinId, version) {
    const { titel: vTitel, innehall, referenser, taggar, utgangsdatum, relateradeRutiner, bilagor } = version;
    await uppdateraRutin(
      rutinId,
      { titel: vTitel, innehall, referenser, taggar, utgangsdatum, relateradeRutiner, bilagor },
      currentUser.uid
    );
  }

  function skrivUtSektion() {
    document.body.classList.add("utskrift-sektion");
    window.print();
    window.addEventListener(
      "afterprint",
      () => document.body.classList.remove("utskrift-sektion"),
      { once: true }
    );
  }

  return (
    <div className="sida">
      <h1>
        {ikon} {titel}
      </h1>
      <p className="sida__beskrivning">{beskrivning}</p>

      {extra}

      <div className="sektionssida__topatgarder">
        {farRedigera && !visaFormular && (
          <button className="knapp" onClick={oppnaNyRutin}>
            Lägg till ny rutin
          </button>
        )}
        {farRedigera && (
          <button
            className="knapp knapp--sekundar"
            onClick={() => {
              setMassval((v) => !v);
              setValda([]);
            }}
          >
            {massval ? "Avbryt markering" : "☑️ Markera flera"}
          </button>
        )}
        <button className="knapp knapp--sekundar" onClick={skrivUtSektion}>
          🖨️ Skriv ut hela sektionen
        </button>
      </div>

      {massval && (
        <div className="forrad-vy__bulkatgarder">
          <span>{valda.length} markerade</span>
          <input
            type="text"
            placeholder="Tagg att lägga till"
            value={massTagg}
            onChange={(e) => setMassTagg(e.target.value)}
          />
          <button className="knapp knapp--liten" onClick={hanteraMassTaggning} disabled={valda.length === 0}>
            Lägg till tagg på markerade
          </button>
          <button
            className="knapp knapp--liten knapp--sekundar"
            onClick={hanteraMassTaggBorttagning}
            disabled={valda.length === 0}
          >
            Ta bort tagg från markerade
          </button>
          {farGodkanna && valdaUtkast.length > 0 && (
            <>
              <button className="knapp knapp--liten" onClick={hanteraGodkannValda}>
                Godkänn {valdaUtkast.length} markerade utkast
              </button>
              <button className="knapp knapp--liten knapp--farlig" onClick={hanteraNekaValda}>
                Ta bort {valdaUtkast.length} markerade utkast
              </button>
            </>
          )}
        </div>
      )}

      {visaFormular && (
        <RutinFormular
          initialaVarden={redigerar ?? (forifylldSokning ? { titel: forifylldSokning.titel } : null)}
          ovrigaRutiner={rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND)}
          anvandare={anvandare}
          farKureraAkutlage={farKureraAkutlage && Boolean(redigerar)}
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
            setHanterasForslag(null);
            setForifylldSokning(null);
          }}
        />
      )}

      {farRedigera && oppnaForslag.length > 0 && (
        <ForslagSektion forslag={oppnaForslag} onInfor={oppnaInforForslag} onAvvisa={hanteraAvvisaForslag} />
      )}

      {farGodkanna && utkastRutiner.length > 0 && (
        <div className="forrad-vy__bulkatgarder">
          <span>{utkastRutiner.length} utkast väntar på granskning</span>
          <button className="knapp" onClick={godkannAllaUtkast}>
            Godkänn alla
          </button>
          <button className="knapp knapp--farlig" onClick={nekaAllaUtkast}>
            Neka alla
          </button>
        </div>
      )}

      {allaTaggar.length > 0 && (
        <div className="sektionssida__taggfilter">
          <button
            type="button"
            className={`sektionssida__tagg ${aktivTagg === null ? "sektionssida__tagg--vald" : ""}`}
            onClick={() => setAktivTagg(null)}
          >
            Alla
          </button>
          {allaTaggar.map((tagg) => (
            <button
              key={tagg}
              type="button"
              className={`sektionssida__tagg ${aktivTagg === tagg ? "sektionssida__tagg--vald" : ""}`}
              onClick={() => setAktivTagg(tagg)}
            >
              {tagg}
            </button>
          ))}
        </div>
      )}

      {laddar && <Skelett />}

      {!laddar && filtreradeRutiner.length === 0 && (
        <div className="platshallare">
          <p>{aktivTagg ? "Inga rutiner med den taggen." : "Inga rutiner publicerade ännu."}</p>
        </div>
      )}

      {filtreradeRutiner.map((rutin) => (
        <div key={rutin.id} className={massval ? "sektionssida__valbar-rad" : undefined}>
          {massval && (
            <label className="sektionssida__valbar-kryssruta">
              <input type="checkbox" checked={valda.includes(rutin.id)} onChange={() => vaxlaVal(rutin.id)} />
              Markera
            </label>
          )}
          <RutinKort
            rutin={rutin}
            allaRutiner={rutiner}
            anvandare={anvandare}
            farRedigera={farRedigera}
            farGodkanna={farGodkanna}
            onRedigera={oppnaRedigering}
            onGodkann={(id) => godkannRutin(id, currentUser.uid, mittNamn)}
            onTaBort={(id) => taBortRutin(id, currentUser.uid)}
            onMarkeraGranskad={(id) => markeraGranskad(id, currentUser.uid, mittNamn)}
            onArkivera={(id, redanArkiverad) => arkiveraRutin(id, currentUser.uid, !redanArkiverad)}
            onGranskaKalla={(id) =>
              uppdateraRutin(
                id,
                { kallVarning: false, kallVarningGranskadAv: mittNamn, kallVarningGranskadDatum: serverTimestamp() },
                currentUser.uid
              )
            }
            onAterstallVersion={(version) => hanteraAterstallVersion(rutin.id, version)}
            hamtaVersioner={hamtaVersioner}
          />
        </div>
      ))}
    </div>
  );
}
