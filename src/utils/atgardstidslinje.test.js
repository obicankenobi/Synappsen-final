import { describe, it, expect } from "vitest";
import { filtreraAtgardstidslinje } from "./atgardstidslinje";

describe("filtreraAtgardstidslinje", () => {
  it("returnerar en tom lista för tom/saknad indata", () => {
    expect(filtreraAtgardstidslinje([])).toEqual([]);
    expect(filtreraAtgardstidslinje(null)).toEqual([]);
    expect(filtreraAtgardstidslinje(undefined)).toEqual([]);
  });

  it("släpper igenom nödstopps-/pausningshändelser", () => {
    const poster = [
      { id: "1", handelsetyp: "epost_avstangd_globalt" },
      { id: "2", handelsetyp: "organisation_pausad" },
      { id: "3", handelsetyp: "anvandare_utloggning_tvingad" },
    ];
    expect(filtreraAtgardstidslinje(poster)).toHaveLength(3);
  });

  it("filtrerar bort allt annat (t.ex. vardagliga skrivningar)", () => {
    const poster = [
      { id: "1", handelsetyp: "plattform_organisationer_listade" },
      { id: "2", handelsetyp: "rutin_publicerad" },
    ];
    expect(filtreraAtgardstidslinje(poster)).toEqual([]);
  });

  it("bevarar ordningen från indata", () => {
    const poster = [
      { id: "a", handelsetyp: "organisation_pausad" },
      { id: "b", handelsetyp: "kvisspaket_globalt_stoppat" },
    ];
    expect(filtreraAtgardstidslinje(poster).map((p) => p.id)).toEqual(["a", "b"]);
  });
});
