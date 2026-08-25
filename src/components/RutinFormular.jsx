import { useRef, useState } from "react";
import { RUTIN_MALLAR } from "../data/rutinmallar";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import MarkdownInnehall from "./MarkdownInnehall";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import { useDialog } from "../hooks/useDialog";
import { useFeatures } from "../hooks/useFeatures";
import { FEATURE } from "../config/features";
import { foreslaChecklistSteg, foreslaKvissfragor } from "../firebase/functions";
import { GODKANDA_KALLDOMANER, domanGodkand } from "../config/kalldomaner";
import { KVISSBANK, KVISS_KATEGORI_LABEL, tillRutinKviss, MAX_KVISSFRAGOR_PER_RUTIN } from "../data/kvissbank";
import "./RutinFormular.css";

const MAX_KALLOR = 4;

// Klientkontroll av valda filer INNAN uppladdning. storage.rules nekar redan bilagor
// >= 20 MB och allt som varken är bild eller PDF, men det felet dyker upp först EFTER att
// användaren väntat ut hela uppladdningen, och lyder "storage/unauthorized" – obegripligt
// för en redaktör. Samma gränser, kontrollerade direkt vid filvalet.
const MAX_BILAGA_BYTE = 20 * 1024 * 1024;

function bilagaProblem(fil) {
  if (fil.size >= MAX_BILAGA_BYTE) {
    return `${fil.name} är ${(fil.size / 1024 / 1024).toFixed(1)} MB – max 20 MB per bilaga.`;
  }
  if (!fil.type.startsWith("image/") && fil.type !== "application/pdf") {
    return `${fil.name} är varken en bild eller en PDF och kan inte bifogas.`;
  }
  return null;
}

function stegbildProblem(fil) {
  if (fil.size >= MAX_BILAGA_BYTE) {
    return `${fil.name} är ${(fil.size / 1024 / 1024).toFixed(1)} MB – max 20 MB per bild.`;
  }
  if (!fil.type.startsWith("image/")) {
    return `${fil.name} är inte en bild.`;
  }
  return null;
}

// Etapp 21a: "Migrering" enligt planen – hitta URL:er som redan står i den skrivna texten
// och föreslå dem som strukturerade referenser, istället för att skanna alla rutiner i en
// separat batchkörning. Föreslår bara godkända källdomäner, aldrig andra.
function hittaGodkandaUrlerIText(text) {
  const traffar = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return [...new Set(traffar.filter(domanGodkand))];
}

export default function RutinFormular({
  initialaVarden,
  ovrigaRutiner = [],
  anvandare = [],
  farKureraAkutlage = false,
  onSpara,
  onAvbryt,
}) {
  const { confirm, visaMeddelande } = useDialog();
  const { hasFeature } = useFeatures();
  const innehallRef = useRef(null);
  const [titel, setTitel] = useState(initialaVarden?.titel ?? "");
  const [innehall, setInnehall] = useState(initialaVarden?.innehall ?? "");
  const [referenser, setReferenser] = useState(initialaVarden?.referenser ?? "");
  const [taggarText, setTaggarText] = useState((initialaVarden?.taggar ?? []).join(", "));
  const [utgangsdatum, setUtgangsdatum] = useState(initialaVarden?.utgangsdatum ?? "");
  const [relaterade, setRelaterade] = useState(initialaVarden?.relateradeRutiner ?? []);
  const [nyaFiler, setNyaFiler] = useState([]);
  const [befintligaBilagor, setBefintligaBilagor] = useState(initialaVarden?.bilagor ?? []);
  const [sparar, setSparar] = useState(false);
  const [visaForhandsvisning, setVisaForhandsvisning] = useState(false);
  const [agareTyp, setAgareTyp] = useState(initialaVarden?.agare?.typ ?? "ingen");
  const [agareRoll, setAgareRoll] = useState(initialaVarden?.agare?.roll ?? "");
  const [agareUid, setAgareUid] = useState(initialaVarden?.agare?.uid ?? "");
  const [akutlage, setAkutlage] = useState(initialaVarden?.akutlage ?? false);
  const [akutlageOrdning, setAkutlageOrdning] = useState(initialaVarden?.akutlageOrdning ?? 0);
  const [steg, setSteg] = useState(initialaVarden?.steg ?? []);
  const [foreslarSteg, setForeslarSteg] = useState(false);

  function laggTillSteg() {
    setSteg((s) => [...s, { text: "", bild: "", varning: "", timerSekunder: null }]);
  }

  function taBortSteg(index) {
    setSteg((s) => {
      const forhandsvisning = s[index]?.nyBildForhandsvisning;
      if (forhandsvisning) URL.revokeObjectURL(forhandsvisning);
      return s.filter((_, i) => i !== index);
    });
  }

  // En objekt-URL per VALD fil, inte per rendering. Tidigare anropades URL.createObjectURL()
  // direkt i renderingen av stegbilden, vilket skapade en ny (aldrig frisläppt) blob-URL vid
  // varje tangenttryck i formuläret – bilden hölls kvar i minnet om och om igen så länge
  // formuläret var öppet.
  function valjStegBild(index, fil) {
    if (fil) {
      const problem = stegbildProblem(fil);
      if (problem) {
        visaMeddelande(problem);
        return;
      }
    }
    setSteg((s) =>
      s.map((steget, i) => {
        if (i !== index) return steget;
        if (steget.nyBildForhandsvisning) URL.revokeObjectURL(steget.nyBildForhandsvisning);
        return {
          ...steget,
          nyBildFil: fil ?? null,
          nyBildForhandsvisning: fil ? URL.createObjectURL(fil) : "",
        };
      })
    );
  }

  function uppdateraSteg(index, falt, varde) {
    setSteg((s) => s.map((steget, i) => (i === index ? { ...steget, [falt]: varde } : steget)));
  }

  function flyttaSteg(index, riktning) {
    setSteg((s) => {
      const nyttIndex = index + riktning;
      if (nyttIndex < 0 || nyttIndex >= s.length) return s;
      const kopia = [...s];
      [kopia[index], kopia[nyttIndex]] = [kopia[nyttIndex], kopia[index]];
      return kopia;
    });
  }

  // Etapp 18b: skapar ALDRIG nytt kliniskt innehåll – delar bara upp den redan skrivna texten
  // i steg. Resultatet läggs bara i formuläret, inte i Firestore, så det granskas som ett
  // vanligt utkast innan det sparas (precis som all annan AI-tolkning i appen).
  async function hanteraForeslaSteg() {
    if (!innehall.trim()) {
      visaMeddelande("Skriv eller klistra in innehållet först, så kan det delas upp i steg.");
      return;
    }
    if (steg.length > 0 && !(await confirm("Ersätta den nuvarande steglistan med AI:ns förslag?"))) return;
    setForeslarSteg(true);
    try {
      const { data } = await foreslaChecklistSteg(innehall);
      setSteg(data.steg.map((s) => ({ text: s.text, bild: "", varning: "", timerSekunder: null })));
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte ta fram ett stegförslag.");
    } finally {
      setForeslarSteg(false);
    }
  }

  const [kviss, setKviss] = useState(initialaVarden?.kviss ?? []);
  const [foreslarKviss, setForeslarKviss] = useState(false);
  const [visaFrageBank, setVisaFrageBank] = useState(false);
  const [vasentligAndring, setVasentligAndring] = useState(false);

  const [externaKallor, setExternaKallor] = useState(initialaVarden?.externaKallor ?? []);
  const [nyKalla, setNyKalla] = useState("");
  const [kallaFel, setKallaFel] = useState("");

  function laggTillKalla(url) {
    const trimmad = url.trim();
    if (!trimmad || externaKallor.length >= MAX_KALLOR || externaKallor.includes(trimmad)) return;
    if (!domanGodkand(trimmad)) {
      setKallaFel(`Bara länkar till godkända källor accepteras: ${GODKANDA_KALLDOMANER.join(", ")}.`);
      return;
    }
    setKallaFel("");
    setExternaKallor((k) => [...k, trimmad]);
    setNyKalla("");
  }

  function taBortKalla(index) {
    setExternaKallor((k) => k.filter((_, i) => i !== index));
  }

  const foreslagnaKallor = hittaGodkandaUrlerIText(`${innehall} ${referenser}`).filter(
    (url) => !externaKallor.includes(url)
  );

  function laggTillFraga() {
    if (kviss.length >= MAX_KVISSFRAGOR_PER_RUTIN) return;
    setKviss((k) => [...k, { fraga: "", alternativ: ["", ""], rattIndex: 0, hanvisning: "" }]);
  }

  // Frågor ur den fördefinierade banken (src/data/kvissbank.js) om systemet och processen –
  // aldrig kliniskt innehåll, se filens egen motivering. Jämför på frågetext eftersom bankens
  // id inte följer med in i rutinens sparade kviss (tillRutinKviss skalar bort det).
  function laggTillFranBank(bankfraga) {
    if (kviss.length >= MAX_KVISSFRAGOR_PER_RUTIN) return;
    if (kviss.some((f) => f.fraga === bankfraga.fraga)) return;
    setKviss((k) => [...k, ...tillRutinKviss([bankfraga])]);
  }

  function taBortFraga(index) {
    setKviss((k) => k.filter((_, i) => i !== index));
  }

  function uppdateraFraga(index, falt, varde) {
    setKviss((k) => k.map((f, i) => (i === index ? { ...f, [falt]: varde } : f)));
  }

  function laggTillAlternativ(fragaIndex) {
    setKviss((k) =>
      k.map((f, i) => (i === fragaIndex && f.alternativ.length < 4 ? { ...f, alternativ: [...f.alternativ, ""] } : f))
    );
  }

  function uppdateraAlternativ(fragaIndex, altIndex, varde) {
    setKviss((k) =>
      k.map((f, i) =>
        i === fragaIndex ? { ...f, alternativ: f.alternativ.map((a, j) => (j === altIndex ? varde : a)) } : f
      )
    );
  }

  function taBortAlternativ(fragaIndex, altIndex) {
    setKviss((k) =>
      k.map((f, i) =>
        i === fragaIndex && f.alternativ.length > 2
          ? {
              ...f,
              alternativ: f.alternativ.filter((_, j) => j !== altIndex),
              rattIndex: f.rattIndex === altIndex ? 0 : f.rattIndex > altIndex ? f.rattIndex - 1 : f.rattIndex,
            }
          : f
      )
    );
  }

  // Etapp 19b: skapar ALDRIG nytt kliniskt innehåll – prövar bara förståelse av den redan
  // skrivna texten. Läggs bara i formuläret, granskas som ett vanligt utkast innan det sparas.
  async function hanteraForeslaKviss() {
    if (!innehall.trim()) {
      visaMeddelande("Skriv eller klistra in innehållet först, så kan frågor tas fram.");
      return;
    }
    if (kviss.length > 0 && !(await confirm("Ersätta den nuvarande kvissen med AI:ns förslag?"))) return;
    setForeslarKviss(true);
    try {
      const { data } = await foreslaKvissfragor(innehall);
      setKviss(data.fragor);
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte ta fram frågeförslag.");
    } finally {
      setForeslarKviss(false);
    }
  }

  async function valjMall(namn) {
    const mall = RUTIN_MALLAR.find((m) => m.namn === namn);
    if (!mall) return;
    if (innehall.trim() && !(await confirm("Ersätta nuvarande innehåll med mallen?"))) return;
    setInnehall(mall.innehall);
  }

  function taBortBefintlig(index) {
    setBefintligaBilagor((b) => b.filter((_, i) => i !== index));
  }

  function taBortNy(index) {
    setNyaFiler((f) => f.filter((_, i) => i !== index));
  }

  function vaxlaRelaterad(id) {
    setRelaterade((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  // Enkel "WYSIWYG-lite"-verktygsrad: knapparna omsluter/infogar markdown-syntax i textarean
  // istället för att kräva att användaren skriver **fet text** m.m. för hand.
  function omslutMarkering(prefix, suffix = prefix) {
    const el = innehallRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const markerat = innehall.slice(start, end) || "text";
    const nyttInnehall = innehall.slice(0, start) + prefix + markerat + suffix + innehall.slice(end);
    setInnehall(nyttInnehall);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + markerat.length);
    });
  }

  function infogaRadprefix(prefix) {
    const el = innehallRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const radStart = innehall.lastIndexOf("\n", start - 1) + 1;
    const nyttInnehall = innehall.slice(0, radStart) + prefix + innehall.slice(radStart);
    setInnehall(nyttInnehall);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  // Etapp 38d: färdiga byggblock (flerradiga mallar), infogade vid markörens position –
  // samma verktygsfältsmönster som fet text/rubrik/lista ovan, men för hela stycken i stället
  // för enstaka markdown-tecken. Gör rutiner mer enhetliga utan att någon behöver hitta på
  // formuleringen eller markdown-strukturen själv varje gång.
  const BYGGBLOCK = {
    varning: "\n\n> ⚠️ **Varning:** \n\n",
    kontakt: "\n\n**Kontakt vid behov:** [namn/roll] – [telefonnummer]\n\n",
    material: "\n\n**Material som behövs:**\n- \n- \n\n",
  };

  function infogaByggblock(block) {
    const el = innehallRef.current;
    const text = BYGGBLOCK[block];
    if (!el) {
      setInnehall((tidigare) => `${tidigare}${text}`);
      return;
    }
    const start = el.selectionStart;
    const nyttInnehall = innehall.slice(0, start) + text + innehall.slice(start);
    setInnehall(nyttInnehall);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const harBilagor = nyaFiler.length > 0 || befintligaBilagor.length > 0;

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!innehall.trim() && !harBilagor) {
      visaMeddelande("Fyll i innehåll eller bifoga minst en fil.");
      return;
    }
    const kontroll = kontrolleraPatientuppgifter(
      `${titel} ${innehall} ${referenser} ${steg.map((s) => s.text).join(" ")} ` +
        `${kviss.map((f) => `${f.fraga} ${f.hanvisning}`).join(" ")}`
    );
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    // En påbörjad men ofullständig kvissfråga filtrerades tidigare bort UTAN ett ord till
    // redaktören (och en fråga med ett tomt svarsalternativ sparades med det tomma
    // alternativet kvar, klickbart). Säg ifrån istället – tyst bortfall av något man just
    // skrivit är dataförlust även när dokumentet i övrigt sparas.
    const ofullstandigFraga = kviss.findIndex((f) => {
      const harInnehall = f.fraga.trim() || f.alternativ.some((a) => a.trim());
      if (!harInnehall) return false;
      return !f.fraga.trim() || f.alternativ.some((a) => !a.trim());
    });
    if (ofullstandigFraga !== -1) {
      visaMeddelande(
        `Kvissfråga ${ofullstandigFraga + 1} är ofullständig – fyll i både frågan och alla ` +
          "svarsalternativ, eller ta bort dem som inte används."
      );
      return;
    }
    const taggar = taggarText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    let agare = null;
    if (agareTyp === "roll" && agareRoll) {
      agare = { typ: "roll", roll: agareRoll };
    } else if (agareTyp === "person" && agareUid) {
      const person = anvandare.find((a) => a.id === agareUid);
      agare = { typ: "person", uid: agareUid, namn: person?.namn ?? person?.email ?? "" };
    }
    setSparar(true);
    try {
      await onSpara({
        titel,
        innehall,
        referenser,
        taggar,
        utgangsdatum: utgangsdatum || null,
        relaterade,
        nyaFiler,
        befintligaBilagor,
        agare,
        akutlage,
        akutlageOrdning: Number(akutlageOrdning) || 0,
        steg: steg
          .filter((s) => s.text.trim())
          .map((s) => ({
            text: s.text.trim(),
            bild: s.bild || null,
            varning: s.varning || null,
            timerSekunder: s.timerSekunder ? Number(s.timerSekunder) : null,
            // Etapp 22c: en vald bildfil laddas ännu inte upp här – RutinFormular känner inte
            // till rutinens Storage-sökväg (kräver ett rutinId, som inte finns för en ny
            // rutin förrän skapaRutin körts). Sektionssida.jsx laddar upp filen och ersätter
            // det här fältet med den riktiga URL:en innan något sparas i Firestore.
            ...(s.nyBildFil ? { nyBildFil: s.nyBildFil } : {}),
          })),
        kviss: kviss
          .filter((f) => f.fraga.trim() && f.alternativ.filter((a) => a.trim()).length >= 2)
          .map((f) => ({
            fraga: f.fraga.trim(),
            alternativ: f.alternativ.map((a) => a.trim()),
            rattIndex: f.rattIndex,
            hanvisning: f.hanvisning?.trim() || "",
          })),
        vasentligAndring,
        externaKallor,
      });
    } catch (fel) {
      // onSpara skriver till Firestore och laddar upp bilagor. Utan den här grenen försvann
      // ett misslyckande (nekad behörighet, för stor fil, tappat nät) som en ohanterad
      // promise-rejection: formuläret blev kvar men redaktören fick ingen som helst signal
      // om att ingenting sparats.
      visaMeddelande(
        `Kunde inte spara: ${fel?.message ?? "okänt fel"}. Formuläret är kvar – prova igen.`
      );
    } finally {
      setSparar(false);
    }
  }

  const valbaraRutiner = ovrigaRutiner.filter((r) => r.id !== initialaVarden?.id);

  // Etapp 47a: `relateradeRutiner` var tidigare en helt manuell lista att bläddra igenom –
  // ingen hjälp att hitta rätt bland ett områdes alla rutiner. Föreslår istället, live medan
  // redaktören skriver taggar, vilka ANDRA rutiner i samma område som delar minst en tagg.
  // Ren klientberäkning av redan laddad data (ingen ny Firestore-fråga eller datamodell).
  const aktuellaTaggar = taggarText
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const foreslagnaRutiner =
    aktuellaTaggar.length === 0
      ? []
      : valbaraRutiner.filter(
          (r) => !relaterade.includes(r.id) && (r.taggar ?? []).some((t) => aktuellaTaggar.includes(t.toLowerCase()))
        );
  const ovrigaValbaraRutiner = valbaraRutiner.filter((r) => !foreslagnaRutiner.includes(r));

  return (
    <form className="rutin-formular" onSubmit={hanteraSubmit}>
      <label>
        Titel
        <input
          type="text"
          required
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
        />
      </label>
      {!initialaVarden && (
        <label>
          Utgå från mall (valfritt)
          <select defaultValue="" onChange={(e) => valjMall(e.target.value)}>
            <option value="">Inget – börja från tomt</option>
            {RUTIN_MALLAR.map((m) => (
              <option key={m.namn} value={m.namn}>
                {m.namn}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Innehåll {!harBilagor && "(krävs om ingen bilaga bifogas)"}
        <div className="rutin-formular__verktygsfalt">
          <button type="button" onClick={() => omslutMarkering("**")} title="Fet text">
            <strong>F</strong>
          </button>
          <button type="button" onClick={() => omslutMarkering("*")} title="Kursiv">
            <em>K</em>
          </button>
          <button type="button" onClick={() => infogaRadprefix("# ")} title="Rubrik">
            H1
          </button>
          <button type="button" onClick={() => infogaRadprefix("- ")} title="Punktlista">
            • Lista
          </button>
          <button type="button" onClick={() => infogaByggblock("varning")} title="Infoga en varningsruta">
            ⚠️ Varning
          </button>
          <button type="button" onClick={() => infogaByggblock("kontakt")} title="Infoga ett kontaktsteg">
            ☎️ Kontakt
          </button>
          <button type="button" onClick={() => infogaByggblock("material")} title="Infoga en materiallista">
            📋 Material
          </button>
          <button
            type="button"
            className={visaForhandsvisning ? "rutin-formular__verktygsfalt-knapp--vald" : ""}
            onClick={() => setVisaForhandsvisning((v) => !v)}
            title="Förhandsgranska"
          >
            👁️ Förhandsgranska
          </button>
        </div>
        {visaForhandsvisning ? (
          <MarkdownInnehall className="rutin-formular__forhandsvisning" text={innehall} />
        ) : (
          <textarea
            ref={innehallRef}
            rows={6}
            value={innehall}
            onChange={(e) => setInnehall(e.target.value)}
          />
        )}
        <span className="rutin-formular__hjalptext">
          Markera text och klicka F/K för att formatera, eller skriv markdown för hand: **fet
          text**, *kursiv*, # Rubrik, - punktlista
        </span>
      </label>
      <label>
        Referenser/källor (valfritt)
        <textarea
          rows={2}
          placeholder="T.ex. regionalt PM, författare, år"
          value={referenser}
          onChange={(e) => setReferenser(e.target.value)}
        />
      </label>
      <label>
        Taggar (valfritt, kommaseparerade)
        <input
          type="text"
          placeholder="T.ex. barn, akut, smärtlindring"
          value={taggarText}
          onChange={(e) => setTaggarText(e.target.value)}
        />
      </label>
      <label>
        Giltig till (valfritt)
        <input type="date" value={utgangsdatum} onChange={(e) => setUtgangsdatum(e.target.value)} />
        <span className="rutin-formular__hjalptext">
          Sätts automatiskt om ett giltighetsdatum hittas vid AI-tolkning av ett foto. Rutinen
          döljs för vanlig personal (men syns för redaktörer) efter detta datum.
        </span>
      </label>

      <fieldset className="rutin-formular__checklista">
        <legend>Checklistläge – steg (valfritt)</legend>
        <p className="rutin-formular__hjalptext">
          Om rutinen har steg kan den köras ett steg i taget i checklistläget, istället för
          att bara läsas som löptext. Stegen är bara en annan LAYOUT på innehållet ovan –
          lägg inte till ny information här som inte redan finns i texten.
        </p>
        {hasFeature(FEATURE.AI_IMPORT) && (
          <button type="button" className="knapp knapp--sekundar knapp--liten" disabled={foreslarSteg} onClick={hanteraForeslaSteg}>
            {foreslarSteg ? "Föreslår..." : "✨ Föreslå steg från innehållet"}
          </button>
        )}
        {steg.length > 0 && (
          <ul className="rutin-formular__steglista">
            {steg.map((s, i) => (
              <li key={i} className="rutin-formular__stegrad">
                <span className="rutin-formular__stegnummer">{i + 1}.</span>
                <div className="rutin-formular__stegfalt">
                  <textarea
                    rows={2}
                    placeholder="Steg-text"
                    value={s.text}
                    onChange={(e) => uppdateraSteg(i, "text", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Varning (valfritt)"
                    value={s.varning ?? ""}
                    onChange={(e) => uppdateraSteg(i, "varning", e.target.value)}
                  />
                  <label className="rutin-formular__stegtimer">
                    Timer (sekunder, valfritt)
                    <input
                      type="number"
                      min="0"
                      value={s.timerSekunder ?? ""}
                      onChange={(e) => uppdateraSteg(i, "timerSekunder", e.target.value)}
                    />
                  </label>
                  <div className="rutin-formular__stegbild">
                    {s.nyBildForhandsvisning ? (
                      <img
                        className="rutin-formular__stegbild-forhandsvisning"
                        src={s.nyBildForhandsvisning}
                        alt=""
                      />
                    ) : (
                      s.bild && (
                        <img className="rutin-formular__stegbild-forhandsvisning" src={s.bild} alt="" />
                      )
                    )}
                    <label className="rutin-formular__stegbild-valj">
                      {s.bild || s.nyBildFil ? "Byt bild" : "Lägg till bild (valfritt)"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const fil = e.target.files?.[0] ?? null;
                          e.target.value = "";
                          if (fil) valjStegBild(i, fil);
                        }}
                      />
                    </label>
                    {(s.bild || s.nyBildFil) && (
                      <button
                        type="button"
                        className="knapp--lank"
                        onClick={() => {
                          uppdateraSteg(i, "bild", "");
                          valjStegBild(i, null);
                        }}
                      >
                        Ta bort bild
                      </button>
                    )}
                  </div>
                </div>
                <div className="rutin-formular__stegatgarder">
                  <button type="button" className="knapp knapp--liten" disabled={i === 0} onClick={() => flyttaSteg(i, -1)} aria-label={`Flytta steg ${i + 1} uppåt`}>
                    ↑
                  </button>
                  <button type="button" className="knapp knapp--liten" disabled={i === steg.length - 1} onClick={() => flyttaSteg(i, 1)} aria-label={`Flytta steg ${i + 1} nedåt`}>
                    ↓
                  </button>
                  <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={() => taBortSteg(i)}>
                    Ta bort
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="knapp knapp--liten" onClick={laggTillSteg}>
          + Lägg till steg
        </button>
      </fieldset>

      <fieldset className="rutin-formular__checklista">
        <legend>Mikrokviss vid kvittering (valfritt, max {MAX_KVISSFRAGOR_PER_RUTIN} frågor)</legend>
        <p className="rutin-formular__hjalptext">
          Visas innan kvitteringen räknas. Fel svar visar bara rätt svar + hänvisning och
          låter personen försöka igen – syftet är förståelse, inte betyg.
        </p>
        <div className="rutin-formular__kvisskallor">
          {hasFeature(FEATURE.AI_IMPORT) && (
            <button type="button" className="knapp knapp--sekundar knapp--liten" disabled={foreslarKviss} onClick={hanteraForeslaKviss}>
              {foreslarKviss ? "Föreslår..." : "✨ Föreslå frågor från innehållet"}
            </button>
          )}
          {kviss.length < MAX_KVISSFRAGOR_PER_RUTIN && (
            <button
              type="button"
              className="knapp knapp--sekundar knapp--liten"
              onClick={() => setVisaFrageBank((v) => !v)}
              aria-expanded={visaFrageBank}
            >
              📚 {visaFrageBank ? "Dölj frågebanken" : "Välj från frågebanken"}
            </button>
          )}
        </div>
        {visaFrageBank && (
          <div className="rutin-formular__fragebank">
            <p className="rutin-formular__hjalptext">
              Färdiga frågor om systemet och processen – inte om det kliniska innehållet. Passar
              rutiner utan egen kviss ännu.
            </p>
            {Object.entries(KVISS_KATEGORI_LABEL).map(([kategori, etikett]) => {
              const fragor = KVISSBANK.filter(
                (f) => f.kategori === kategori && !kviss.some((k) => k.fraga === f.fraga)
              );
              if (fragor.length === 0) return null;
              return (
                <div key={kategori} className="rutin-formular__fragebank-kategori">
                  <h4>{etikett}</h4>
                  <ul className="rutin-formular__fragebank-lista">
                    {fragor.map((f) => (
                      <li key={f.id} className="rutin-formular__fragebank-rad">
                        <span>{f.fraga}</span>
                        <button
                          type="button"
                          className="knapp knapp--liten"
                          disabled={kviss.length >= MAX_KVISSFRAGOR_PER_RUTIN}
                          onClick={() => laggTillFranBank(f)}
                        >
                          + Lägg till
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {kviss.length > 0 && (
          <ul className="rutin-formular__steglista">
            {kviss.map((f, fi) => (
              <li key={fi} className="rutin-formular__stegrad">
                <span className="rutin-formular__stegnummer">{fi + 1}.</span>
                <div className="rutin-formular__stegfalt">
                  <textarea
                    rows={2}
                    placeholder="Fråga"
                    value={f.fraga}
                    onChange={(e) => uppdateraFraga(fi, "fraga", e.target.value)}
                  />
                  {f.alternativ.map((alt, ai) => (
                    <div key={ai} className="rutin-formular__stegtimer">
                      <input
                        type="radio"
                        name={`ratt-svar-${fi}`}
                        checked={f.rattIndex === ai}
                        onChange={() => uppdateraFraga(fi, "rattIndex", ai)}
                        aria-label={`Alternativ ${ai + 1} är rätt svar`}
                      />
                      <input
                        type="text"
                        placeholder={`Alternativ ${ai + 1}`}
                        value={alt}
                        onChange={(e) => uppdateraAlternativ(fi, ai, e.target.value)}
                      />
                      {f.alternativ.length > 2 && (
                        <button type="button" className="knapp--lank" onClick={() => taBortAlternativ(fi, ai)}>
                          Ta bort
                        </button>
                      )}
                    </div>
                  ))}
                  {f.alternativ.length < 4 && (
                    <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={() => laggTillAlternativ(fi)}>
                      + Lägg till alternativ
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder="Hänvisning till stycket (valfritt)"
                    value={f.hanvisning ?? ""}
                    onChange={(e) => uppdateraFraga(fi, "hanvisning", e.target.value)}
                  />
                </div>
                <div className="rutin-formular__stegatgarder">
                  <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={() => taBortFraga(fi)}>
                    Ta bort fråga
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {kviss.length < MAX_KVISSFRAGOR_PER_RUTIN && (
          <button type="button" className="knapp knapp--liten" onClick={laggTillFraga}>
            + Lägg till fråga
          </button>
        )}
      </fieldset>

      {hasFeature(FEATURE.SOURCE_MONITORING) && (
      <fieldset className="rutin-formular__checklista">
        <legend>Källbevakade referenser (valfritt, max {MAX_KALLOR})</legend>
        <p className="rutin-formular__hjalptext">
          Bara länkar till godkända källdomäner ({GODKANDA_KALLDOMANER.join(", ")}) accepteras.
          En schemalagd kontroll (Etapp 21b) bevakar sidan och flaggar rutinen för granskning om
          källan ändras.
        </p>
        {externaKallor.length > 0 && (
          <ul className="rutin-formular__steglista">
            {externaKallor.map((url, i) => (
              <li key={url} className="rutin-formular__stegrad">
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
                <div className="rutin-formular__stegatgarder">
                  <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={() => taBortKalla(i)}>
                    Ta bort
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {foreslagnaKallor.length > 0 && externaKallor.length < MAX_KALLOR && (
          <div>
            <p className="rutin-formular__hjalptext">Hittade i texten ovan:</p>
            <ul className="rutin-formular__steglista">
              {foreslagnaKallor.map((url) => (
                <li key={url} className="rutin-formular__stegrad">
                  <span>{url}</span>
                  <button type="button" className="knapp knapp--liten" onClick={() => laggTillKalla(url)}>
                    + Lägg till som referens
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {externaKallor.length < MAX_KALLOR && (
          <div className="rutin-formular__stegtimer">
            <input
              type="url"
              placeholder="https://..."
              value={nyKalla}
              onChange={(e) => {
                setNyKalla(e.target.value);
                setKallaFel("");
              }}
            />
            <button type="button" className="knapp knapp--liten" onClick={() => laggTillKalla(nyKalla)}>
              + Lägg till källa
            </button>
          </div>
        )}
        {kallaFel && <p className="rutin-formular__hjalptext">{kallaFel}</p>}
      </fieldset>
      )}

      <label>
        Ansvarig (valfritt)
        <select
          value={agareTyp}
          onChange={(e) => {
            setAgareTyp(e.target.value);
            setAgareRoll("");
            setAgareUid("");
          }}
        >
          <option value="ingen">Ingen angiven</option>
          <option value="roll">En roll (alla med den rollen)</option>
          <option value="person">En specifik person</option>
        </select>
        {agareTyp === "roll" && (
          <select value={agareRoll} onChange={(e) => setAgareRoll(e.target.value)}>
            <option value="">Välj roll...</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        )}
        {agareTyp === "person" && (
          <select value={agareUid} onChange={(e) => setAgareUid(e.target.value)}>
            <option value="">Välj person...</option>
            {anvandare.map((a) => (
              <option key={a.id} value={a.id}>
                {a.namn ?? a.email}
              </option>
            ))}
          </select>
        )}
        <span className="rutin-formular__hjalptext">
          Kan tilldelas till en roll (alla med den rollen räknas som ansvariga) eller till en
          specifik person – vem som helst i systemet, oavsett roll. Används ännu inte till
          automatiska påminnelser, bara som information.
        </span>
      </label>

      {farKureraAkutlage && initialaVarden?.status === "godkand" && (
        <label className="rutin-formular__akutlage">
          <span className="rutin-formular__checkbox-rad">
            <input
              type="checkbox"
              checked={vasentligAndring}
              onChange={(e) => setVasentligAndring(e.target.checked)}
            />
            Väsentlig ändring (kräver omkvittering av alla)
          </span>
          <span className="rutin-formular__hjalptext">
            Kryssa i om ändringen påverkar det som beskrivs, t.ex. ny dosering eller nytt
            arbetssätt – då räknas alla tidigare läskvitteringar av rutinen som föråldrade i
            kompetensmatrisen och behöver göras om. Lämna okryssad för redaktionella ändringar
            (stavfel, formatering) – annars drunknar personalen i omkvitteringar.
          </span>
        </label>
      )}

      {farKureraAkutlage && (
        <label className="rutin-formular__akutlage">
          <span className="rutin-formular__checkbox-rad">
            <input type="checkbox" checked={akutlage} onChange={(e) => setAkutlage(e.target.checked)} />
            Visa i akutläget
          </span>
          {akutlage && (
            <span>
              Ordning i akutläget (lägre visas högre upp)
              <input
                type="number"
                min="0"
                value={akutlageOrdning}
                onChange={(e) => setAkutlageOrdning(e.target.value)}
              />
            </span>
          )}
          <span className="rutin-formular__hjalptext">
            Akutläget visar max ett fåtal rutiner totalt (över alla områden) – kuratera med
            omtanke, det ska gå snabbt att hitta rätt under stress.
          </span>
        </label>
      )}

      {valbaraRutiner.length > 0 && (
        <label>
          Relaterade rutiner (valfritt)
          {foreslagnaRutiner.length > 0 && (
            <>
              <span className="rutin-formular__hjalptext">
                Föreslagna – delar minst en tagg med den här rutinen:
              </span>
              <div className="rutin-formular__relaterade rutin-formular__relaterade--foreslagna">
                {foreslagnaRutiner.map((r) => (
                  <label key={r.id} className="rutin-formular__relaterad-rad">
                    <input
                      type="checkbox"
                      checked={relaterade.includes(r.id)}
                      onChange={() => vaxlaRelaterad(r.id)}
                    />
                    {r.titel}
                  </label>
                ))}
              </div>
              <span className="rutin-formular__hjalptext">Alla rutiner i området:</span>
            </>
          )}
          <div className="rutin-formular__relaterade">
            {ovrigaValbaraRutiner.map((r) => (
              <label key={r.id} className="rutin-formular__relaterad-rad">
                <input
                  type="checkbox"
                  checked={relaterade.includes(r.id)}
                  onChange={() => vaxlaRelaterad(r.id)}
                />
                {r.titel}
              </label>
            ))}
          </div>
        </label>
      )}

      <label>
        Bilagor (bilder eller PDF, valfritt, flera går bra)
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={(e) => {
            const valda = Array.from(e.target.files ?? []);
            e.target.value = "";
            const problem = valda.map(bilagaProblem).filter(Boolean);
            const godkanda = valda.filter((f) => !bilagaProblem(f));
            if (godkanda.length > 0) setNyaFiler((f) => [...f, ...godkanda]);
            if (problem.length > 0) visaMeddelande(problem.join("\n"));
          }}
        />
      </label>

      {(befintligaBilagor.length > 0 || nyaFiler.length > 0) && (
        <ul className="rutin-formular__bilagelista">
          {befintligaBilagor.map((b, i) => (
            <li key={`befintlig-${i}`}>
              {b.namn ?? "Bilaga"}
              <button type="button" className="knapp--lank" onClick={() => taBortBefintlig(i)}>
                Ta bort
              </button>
            </li>
          ))}
          {nyaFiler.map((f, i) => (
            <li key={`ny-${i}`}>
              {f.name} (ny)
              <button type="button" className="knapp--lank" onClick={() => taBortNy(i)}>
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rutin-formular__knappar">
        <button type="button" className="knapp knapp--sekundar" disabled={sparar} onClick={onAvbryt}>
          Avbryt
        </button>
        <button type="submit" className="knapp" disabled={sparar}>
          {sparar ? "Sparar..." : "Spara"}
        </button>
      </div>
    </form>
  );
}
