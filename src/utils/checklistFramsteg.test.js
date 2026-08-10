// @vitest-environment happy-dom
// Etapp 61b (ETAPPLAN12.md): checklistFramsteg driver "fortsätt där du var" i akutläget – en
// felaktig nyckel (t.ex. utan uid) skulle låta en person av misstag fortsätta en annan
// persons påbörjade checklista på en delad enhet, vilket är precis den sortens fel som är
// lätt att missa manuellt men lätt att fånga i ett test.
import { describe, it, expect, beforeEach } from "vitest";
import { lasFramsteg, sparaFramsteg, rensaFramsteg } from "./checklistFramsteg";

beforeEach(() => {
  localStorage.clear();
});

describe("sparaFramsteg / lasFramsteg", () => {
  it("returnerar null när inget är sparat", () => {
    expect(lasFramsteg("uid1", "rutinA")).toBeNull();
  });

  it("sparar och läser tillbaka stegIndex/startTid oförändrat", () => {
    sparaFramsteg("uid1", "rutinA", 2, 1710000000000);
    expect(lasFramsteg("uid1", "rutinA")).toEqual({ stegIndex: 2, startTid: 1710000000000 });
  });

  it("två olika uid på SAMMA enhet/rutin håller helt separat framsteg", () => {
    sparaFramsteg("uidA", "rutinX", 3, 1);
    sparaFramsteg("uidB", "rutinX", 0, 2);
    expect(lasFramsteg("uidA", "rutinX")).toEqual({ stegIndex: 3, startTid: 1 });
    expect(lasFramsteg("uidB", "rutinX")).toEqual({ stegIndex: 0, startTid: 2 });
  });

  it("samma uid, olika rutin-id:n, håller separat framsteg", () => {
    sparaFramsteg("uid1", "rutinA", 1, 100);
    sparaFramsteg("uid1", "rutinB", 5, 200);
    expect(lasFramsteg("uid1", "rutinA")).toEqual({ stegIndex: 1, startTid: 100 });
    expect(lasFramsteg("uid1", "rutinB")).toEqual({ stegIndex: 5, startTid: 200 });
  });

  it("en ny sparaFramsteg skriver över det gamla värdet för samma uid+rutin", () => {
    sparaFramsteg("uid1", "rutinA", 1, 100);
    sparaFramsteg("uid1", "rutinA", 4, 100);
    expect(lasFramsteg("uid1", "rutinA")).toEqual({ stegIndex: 4, startTid: 100 });
  });

  it("returnerar null (kraschar inte) om lagrat innehåll är trasig JSON", () => {
    localStorage.setItem("synappsen_checklista_uid1_rutinA", "{trasig");
    expect(lasFramsteg("uid1", "rutinA")).toBeNull();
  });
});

describe("rensaFramsteg", () => {
  it("tar bort framsteget så en efterföljande läsning ger null", () => {
    sparaFramsteg("uid1", "rutinA", 2, 100);
    rensaFramsteg("uid1", "rutinA");
    expect(lasFramsteg("uid1", "rutinA")).toBeNull();
  });

  it("rör INTE en annan rutins framsteg", () => {
    sparaFramsteg("uid1", "rutinA", 2, 100);
    sparaFramsteg("uid1", "rutinB", 3, 200);
    rensaFramsteg("uid1", "rutinA");
    expect(lasFramsteg("uid1", "rutinB")).toEqual({ stegIndex: 3, startTid: 200 });
  });
});
