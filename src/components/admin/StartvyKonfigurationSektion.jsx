import { useState } from "react";
import { useStartvyKonfiguration } from "../../hooks/useStartvyKonfiguration";
import { STARTVY_BLOCK, STARTVY_STANDARD } from "../../config/startvy";
import { ROLES, ROLE_LABELS } from "../../firebase/roles";
import "./StartvyKonfigurationSektion.css";

const ALLA_ROLLER = [
  ROLES.SUPERADMIN,
  ROLES.VEC,
  ROLES.SEKTIONSLEDARE,
  ROLES.VOL,
  ROLES.FORRADSANSVARIG,
  ROLES.PERSONAL,
];

function flytta(lista, index, riktning) {
  const nyttIndex = index + riktning;
  if (nyttIndex < 0 || nyttIndex >= lista.length) return lista;
  const kopia = [...lista];
  [kopia[index], kopia[nyttIndex]] = [kopia[nyttIndex], kopia[index]];
  return kopia;
}

// Etapp 17a: superadmin väljer i vilken ORDNING startsidans kort visas per roll. Bara
// ordning, inte visning på/av – alla block finns alltid kvar, bara högre eller lägre upp.
export default function StartvyKonfigurationSektion() {
  const { blockordningForRoll, satBlockOrdningForRoll } = useStartvyKonfiguration();
  const [vaidRoll, setVaidRoll] = useState(ROLES.PERSONAL);
  const [sparar, setSparar] = useState(false);

  const ordning = blockordningForRoll(vaidRoll);

  async function hanteraFlytta(index, riktning) {
    setSparar(true);
    try {
      await satBlockOrdningForRoll(vaidRoll, flytta(ordning, index, riktning));
    } finally {
      setSparar(false);
    }
  }

  async function hanteraAterstall() {
    setSparar(true);
    try {
      await satBlockOrdningForRoll(vaidRoll, STARTVY_STANDARD[vaidRoll]);
    } finally {
      setSparar(false);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>🏠 Startvy per roll</h2>
      <p className="sida__beskrivning">
        Ändra i vilken ordning korten på startsidan visas för en viss roll. Alla kort finns
        kvar för alla roller – det här styr bara vad som hamnar högst upp.
      </p>
      <label className="startvy-konfiguration__rollval">
        Roll
        <select value={vaidRoll} onChange={(e) => setVaidRoll(e.target.value)}>
          {ALLA_ROLLER.map((roll) => (
            <option key={roll} value={roll}>
              {ROLE_LABELS[roll]}
            </option>
          ))}
        </select>
      </label>
      <ul className="startvy-konfiguration__lista">
        {ordning.map((nyckel, index) => (
          <li key={nyckel} className="startvy-konfiguration__rad">
            <span>
              {STARTVY_BLOCK[nyckel].ikon} {STARTVY_BLOCK[nyckel].titel}
            </span>
            <span className="startvy-konfiguration__knappar">
              <button
                type="button"
                className="knapp knapp--liten"
                disabled={sparar || index === 0}
                onClick={() => hanteraFlytta(index, -1)}
                aria-label={`Flytta ${STARTVY_BLOCK[nyckel].titel} uppåt`}
              >
                ↑
              </button>
              <button
                type="button"
                className="knapp knapp--liten"
                disabled={sparar || index === ordning.length - 1}
                onClick={() => hanteraFlytta(index, 1)}
                aria-label={`Flytta ${STARTVY_BLOCK[nyckel].titel} nedåt`}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="knapp knapp--sekundar knapp--liten" disabled={sparar} onClick={hanteraAterstall}>
        Återställ till standard för {ROLE_LABELS[vaidRoll]}
      </button>
    </section>
  );
}
