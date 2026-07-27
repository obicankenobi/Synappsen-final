import { useRef, useState } from "react";
import { RUTIN_MALLAR } from "../data/rutinmallar";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import MarkdownInnehall from "./MarkdownInnehall";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import { useDialog } from "../hooks/useDialog";
import "./RutinFormular.css";

export default function RutinFormular({
  initialaVarden,
  ovrigaRutiner = [],
  anvandare = [],
  farKureraAkutlage = false,
  onSpara,
  onAvbryt,
}) {
  const { confirm, visaMeddelande } = useDialog();
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

  const harBilagor = nyaFiler.length > 0 || befintligaBilagor.length > 0;

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!innehall.trim() && !harBilagor) {
      visaMeddelande("Fyll i innehåll eller bifoga minst en fil.");
      return;
    }
    const kontroll = kontrolleraPatientuppgifter(`${titel} ${innehall} ${referenser}`);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
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
      });
    } finally {
      setSparar(false);
    }
  }

  const valbaraRutiner = ovrigaRutiner.filter((r) => r.id !== initialaVarden?.id);

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
          <div className="rutin-formular__relaterade">
            {valbaraRutiner.map((r) => (
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
          onChange={(e) => setNyaFiler((f) => [...f, ...Array.from(e.target.files ?? [])])}
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
        <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
          Avbryt
        </button>
        <button type="submit" className="knapp" disabled={sparar}>
          {sparar ? "Sparar..." : "Spara"}
        </button>
      </div>
    </form>
  );
}
