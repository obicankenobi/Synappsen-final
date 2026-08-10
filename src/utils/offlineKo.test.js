// @vitest-environment happy-dom
// Etapp 61b (ETAPPLAN12.md): offlineKo är den enda platsen en tappad post betyder en förlorad
// läskvittering eller bristanmälan som användaren TROR gick fram (de gjorde en åtgärd offline,
// appen sa "sparat", men ingenting fanns kvar att skicka när nätet kom tillbaka). Testar den
// faktiska felkällan: localStorage kan vara fullt/blockerat (privat läge) – koden ska svälja
// det felet, inte krascha, men FÅR INTE tyst tappa en post den redan lyckats skriva.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { lasKo, laggTillIKo, tabortUrKo } from "./offlineKo";

beforeEach(() => {
  localStorage.clear();
});

describe("lasKo", () => {
  it("returnerar en tom lista för en användare utan kö", () => {
    expect(lasKo("uidUtanKo")).toEqual([]);
  });

  it("returnerar en tom lista (kraschar inte) om localStorage-innehållet är trasig JSON", () => {
    localStorage.setItem("offlineKo_trasig", "{inte json");
    expect(lasKo("trasig")).toEqual([]);
  });
});

describe("laggTillIKo / tabortUrKo", () => {
  it("lägger till en post och kan läsa tillbaka den igen", () => {
    laggTillIKo("uid1", "laskvittering-rutin", { rutinId: "r1" });
    const ko = lasKo("uid1");
    expect(ko).toHaveLength(1);
    expect(ko[0]).toMatchObject({ typ: "laskvittering-rutin", data: { rutinId: "r1" } });
    expect(typeof ko[0].id).toBe("string");
    expect(typeof ko[0].tidpunkt).toBe("number");
  });

  it("håller köer för olika användare helt separata (samma enhet, olika konton)", () => {
    laggTillIKo("uidA", "laskvittering-rutin", { rutinId: "rA" });
    laggTillIKo("uidB", "laskvittering-rutin", { rutinId: "rB" });
    expect(lasKo("uidA")).toHaveLength(1);
    expect(lasKo("uidB")).toHaveLength(1);
    expect(lasKo("uidA")[0].data.rutinId).toBe("rA");
  });

  it("flera poster i följd staplas, tas bort en och en utan att röra de andra", () => {
    const p1 = laggTillIKo("uid1", "laskvittering-rutin", { rutinId: "r1" });
    const p2 = laggTillIKo("uid1", "bristanmalning", { artikelId: "a1" });
    expect(lasKo("uid1")).toHaveLength(2);

    tabortUrKo("uid1", p1.id);
    const kvar = lasKo("uid1");
    expect(kvar).toHaveLength(1);
    expect(kvar[0].id).toBe(p2.id);
  });

  it("tabortUrKo med ett okänt id är en no-op (rör inte de befintliga posterna)", () => {
    laggTillIKo("uid1", "laskvittering-rutin", { rutinId: "r1" });
    tabortUrKo("uid1", "finns-inte");
    expect(lasKo("uid1")).toHaveLength(1);
  });
});

describe("kraschar inte när localStorage.setItem kastar (fullt/privat läge)", () => {
  let original;
  beforeEach(() => {
    original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
  });
  afterEach(() => {
    Storage.prototype.setItem = original;
  });

  it("laggTillIKo returnerar ändå posten (UI:t kan visa 'sparat') utan att kasta", () => {
    let post;
    expect(() => {
      post = laggTillIKo("uid1", "laskvittering-rutin", { rutinId: "r1" });
    }).not.toThrow();
    expect(post).toMatchObject({ typ: "laskvittering-rutin", data: { rutinId: "r1" } });
  });
});
