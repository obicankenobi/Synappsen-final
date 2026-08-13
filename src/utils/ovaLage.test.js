import { describe, it, expect, vi, afterEach } from "vitest";
import { byggFragepool, slumpaFragor } from "./ovaLage";

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
