import { describe, it, expect } from "vitest";
import { berakraKompetensStatus, senasteKvittens, KOMPETENS_STATUS } from "./kompetensStatus";

function tidsstampel(datum) {
  return { toDate: () => datum, toMillis: () => datum.getTime() };
}

function dagarSedan(antal) {
  const d = new Date();
  d.setDate(d.getDate() - antal);
  return d;
}

describe("senasteKvittens", () => {
  it("returnerar null utan någon kvittens", () => {
    expect(senasteKvittens({ lasteAv: [] }, "u1")).toBeNull();
  });

  it("ignorerar andra personers kvitteringar", () => {
    const rutin = { lasteAv: [{ uid: "annan", tidpunkt: tidsstampel(dagarSedan(1)) }] };
    expect(senasteKvittens(rutin, "u1")).toBeNull();
  });

  it("väljer den senaste av flera kvitteringar från samma person", () => {
    const senasteDatum = dagarSedan(10);
    const rutin = {
      lasteAv: [
        { uid: "u1", tidpunkt: tidsstampel(dagarSedan(100)) },
        { uid: "u1", tidpunkt: tidsstampel(senasteDatum) },
      ],
    };
    expect(senasteKvittens(rutin, "u1").tidpunkt.toDate()).toEqual(senasteDatum);
  });
});

describe("berakraKompetensStatus", () => {
  it("saknas utan någon kvittens", () => {
    expect(berakraKompetensStatus({ lasteAv: [] }, 12, "u1")).toBe(KOMPETENS_STATUS.SAKNAS);
  });

  it("klar direkt efter kvittering, årlig frekvens", () => {
    const rutin = { lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(dagarSedan(1)) }] };
    expect(berakraKompetensStatus(rutin, 12, "u1")).toBe(KOMPETENS_STATUS.KLAR);
  });

  it("förfaller snart inom 30 dagar av gränsen (340 dagar sedan, 12 månaders frekvens)", () => {
    const rutin = { lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(dagarSedan(340)) }] };
    expect(berakraKompetensStatus(rutin, 12, "u1")).toBe(KOMPETENS_STATUS.FORFALLER_SNART);
  });

  it("förfallen efter att frekvensen löpt ut", () => {
    const kvittensDatum = new Date();
    kvittensDatum.setMonth(kvittensDatum.getMonth() - 13);
    const rutin = { lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(kvittensDatum) }] };
    expect(berakraKompetensStatus(rutin, 12, "u1")).toBe(KOMPETENS_STATUS.FORFALLEN);
  });

  it("saknas om en väsentlig ändring gjorts EFTER senaste kvittensen, trots att frekvensen inte löpt ut", () => {
    const rutin = {
      lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(dagarSedan(5)) }],
      senasteVasentligaAndring: tidsstampel(dagarSedan(1)),
    };
    expect(berakraKompetensStatus(rutin, 12, "u1")).toBe(KOMPETENS_STATUS.SAKNAS);
  });

  it("klar om kvittensen gjordes EFTER den väsentliga ändringen (omkvitterad)", () => {
    const rutin = {
      lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(dagarSedan(1)) }],
      senasteVasentligaAndring: tidsstampel(dagarSedan(5)),
    };
    expect(berakraKompetensStatus(rutin, 12, "u1")).toBe(KOMPETENS_STATUS.KLAR);
  });
});
