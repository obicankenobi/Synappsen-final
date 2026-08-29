import { describe, it, expect } from "vitest";
import { grupperaPipeline, PIPELINE_ORDNING } from "./leverantorPipeline";

const NU = new Date("2026-08-29T12:00:00.000Z");

function org(overrides) {
  return {
    orgId: "orgA",
    namn: "Org A",
    avtalsstatus: "offert",
    arDemo: false,
    skapad: null,
    avtalsstatusAndrad: null,
    ...overrides,
  };
}

describe("grupperaPipeline", () => {
  it("returnerar alla fem steg i ordning, tomma om inga organisationer finns", () => {
    const grupper = grupperaPipeline([], NU);
    expect(grupper.map((g) => g.status)).toEqual(PIPELINE_ORDNING);
    expect(grupper.every((g) => g.organisationer.length === 0)).toBe(true);
  });

  it("placerar en organisation i rätt steg", () => {
    const grupper = grupperaPipeline([org({ avtalsstatus: "signerat" })], NU);
    const signerat = grupper.find((g) => g.status === "signerat");
    expect(signerat.organisationer).toHaveLength(1);
    expect(signerat.organisationer[0].orgId).toBe("orgA");
  });

  it("demo-organisationen utesluts helt (krav 29)", () => {
    const grupper = grupperaPipeline([org({ arDemo: true })], NU);
    expect(grupper.every((g) => g.organisationer.length === 0)).toBe(true);
  });

  it("en okänd/saknad avtalsstatus hoppas över, kraschar inte", () => {
    const grupper = grupperaPipeline([org({ avtalsstatus: "okand" }), org({ avtalsstatus: undefined })], NU);
    expect(grupper.every((g) => g.organisationer.length === 0)).toBe(true);
  });

  it("räknar dagar sedan avtalsstatusAndrad", () => {
    const grupper = grupperaPipeline(
      [org({ avtalsstatusAndrad: "2026-08-19T12:00:00.000Z" })],
      NU
    );
    expect(grupper.find((g) => g.status === "offert").organisationer[0].dagarISteg).toBe(10);
  });

  it("faller tillbaka på skapad när avtalsstatusAndrad saknas", () => {
    const grupper = grupperaPipeline([org({ avtalsstatusAndrad: null, skapad: "2026-08-24T12:00:00.000Z" })], NU);
    expect(grupper.find((g) => g.status === "offert").organisationer[0].dagarISteg).toBe(5);
  });

  it("dagarISteg är null om varken avtalsstatusAndrad eller skapad finns", () => {
    const grupper = grupperaPipeline([org({ avtalsstatusAndrad: null, skapad: null })], NU);
    expect(grupper.find((g) => g.status === "offert").organisationer[0].dagarISteg).toBeNull();
  });

  it("sorterar äldst-i-steget överst inom en grupp", () => {
    const grupper = grupperaPipeline(
      [
        org({ orgId: "ny", avtalsstatusAndrad: "2026-08-27T12:00:00.000Z" }),
        org({ orgId: "gammal", avtalsstatusAndrad: "2026-08-01T12:00:00.000Z" }),
      ],
      NU
    );
    const offert = grupper.find((g) => g.status === "offert").organisationer;
    expect(offert.map((o) => o.orgId)).toEqual(["gammal", "ny"]);
  });
});
