import { describe, it, expect, vi, afterEach } from "vitest";
import { byggBankFragepool, byggFragepool, slumpaFragor, tillgangligaKategorier } from "./ovaLage";
import { KVISSBANK } from "../data/kvissbank";

const KVISSFRAGA = { fraga: "?", alternativ: ["a", "b"], rattIndex: 0, hanvisning: "" };

function rutin(overrides) {
  return {
    id: "r1",
    titel: "Rutin",
    omrade: "kliniskt-stod",
    status: "godkand",
    arkiverad: false,
    kviss: [KVISSFRAGA],
    ...overrides,
  };
}

describe("byggFragepool", () => {
  it("inkluderar en godkänd, ej arkiverad rutin med kvissfrågor", () => {
    const pool = byggFragepool([rutin({})], "blandat");
    expect(pool).toHaveLength(1);
    expect(pool[0].rutinId).toBe("r1");
  });

  it("utesluter en rutin utan kvissfrågor", () => {
    expect(byggFragepool([rutin({ kviss: [] })], "blandat")).toHaveLength(0);
  });

  it("utesluter en arkiverad rutin", () => {
    expect(byggFragepool([rutin({ arkiverad: true })], "blandat")).toHaveLength(0);
  });

  it("utesluter en rutin som inte är godkänd", () => {
    expect(byggFragepool([rutin({ status: "utkast" })], "blandat")).toHaveLength(0);
  });

  it("filtrerar på ett specifikt område", () => {
    const rutiner = [rutin({ id: "a", omrade: "kliniskt-stod" }), rutin({ id: "b", omrade: "administration" })];
    const pool = byggFragepool(rutiner, "administration");
    expect(pool.map((p) => p.rutinId)).toEqual(["b"]);
  });

  it("'blandat' tar med båda områdena", () => {
    const rutiner = [rutin({ id: "a", omrade: "kliniskt-stod" }), rutin({ id: "b", omrade: "administration" })];
    expect(byggFragepool(rutiner, "blandat")).toHaveLength(2);
  });

  it("ger en post PER fråga, inte per rutin", () => {
    const pool = byggFragepool([rutin({ kviss: [KVISSFRAGA, KVISSFRAGA, KVISSFRAGA] })], "blandat");
    expect(pool).toHaveLength(3);
    expect(pool.map((p) => p.frageIndex)).toEqual([0, 1, 2]);
  });

  it("filtrerar på kategori när en anges", () => {
    const kvissMedKategori = { ...KVISSFRAGA, kategori: "mallar" };
    const rutiner = [rutin({ id: "a", kviss: [kvissMedKategori] }), rutin({ id: "b", kviss: [KVISSFRAGA] })];
    const pool = byggFragepool(rutiner, "blandat", "mallar");
    expect(pool.map((p) => p.rutinId)).toEqual(["a"]);
  });

  it("tar med alla frågor, taggade och otaggade, när ingen kategori anges", () => {
    const kvissMedKategori = { ...KVISSFRAGA, kategori: "mallar" };
    const rutiner = [rutin({ id: "a", kviss: [kvissMedKategori] }), rutin({ id: "b", kviss: [KVISSFRAGA] })];
    expect(byggFragepool(rutiner, "blandat")).toHaveLength(2);
    expect(byggFragepool(rutiner, "blandat", null)).toHaveLength(2);
  });
});

describe("tillgangligaKategorier", () => {
  it("returnerar tomt när ingen fråga har en kategori", () => {
    expect(tillgangligaKategorier([rutin({})], "blandat")).toEqual([]);
  });

  it("returnerar varje kategori en gång, oavsett hur många frågor som bär den", () => {
    const kvissMedKategori = { ...KVISSFRAGA, kategori: "mallar" };
    const rutiner = [
      rutin({ id: "a", kviss: [kvissMedKategori, kvissMedKategori] }),
      rutin({ id: "b", kviss: [{ ...KVISSFRAGA, kategori: "ansvar" }] }),
    ];
    expect(tillgangligaKategorier(rutiner, "blandat").sort()).toEqual(["ansvar", "mallar"]);
  });

  it("respekterar områdesfiltret", () => {
    const kvissMedKategori = { ...KVISSFRAGA, kategori: "mallar" };
    const rutiner = [rutin({ id: "a", omrade: "administration", kviss: [kvissMedKategori] })];
    expect(tillgangligaKategorier(rutiner, "kliniskt-stod")).toEqual([]);
    expect(tillgangligaKategorier(rutiner, "administration")).toEqual(["mallar"]);
  });
});

describe("byggBankFragepool", () => {
  it("ger en post per fråga i KVISSBANK, oberoende av rutiner", () => {
    expect(byggBankFragepool()).toHaveLength(KVISSBANK.length);
  });

  it("posterna saknar rutinId/rutinTitel eftersom de inte hör till någon rutin", () => {
    const [post] = byggBankFragepool();
    expect(post.rutinId).toBeNull();
    expect(post.rutinTitel).toBeNull();
  });

  it("filtrerar på kategori när en anges", () => {
    const pool = byggBankFragepool("mallar");
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((p) => p.fraga.kategori === "mallar")).toBe(true);
  });
});

describe("slumpaFragor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returnerar högst `antal` poster", () => {
    const pool = Array.from({ length: 20 }, (_, i) => ({ frageIndex: i }));
    expect(slumpaFragor(pool, 8)).toHaveLength(8);
  });

  it("returnerar alla poster om poolen är mindre än `antal`", () => {
    const pool = Array.from({ length: 3 }, (_, i) => ({ frageIndex: i }));
    expect(slumpaFragor(pool, 8)).toHaveLength(3);
  });

  it("muterar inte den ursprungliga poolen", () => {
    const pool = Array.from({ length: 5 }, (_, i) => ({ frageIndex: i }));
    const kopia = [...pool];
    slumpaFragor(pool, 3);
    expect(pool).toEqual(kopia);
  });

  it("hanterar en tom pool utan att kasta", () => {
    expect(slumpaFragor([], 8)).toEqual([]);
  });
});
