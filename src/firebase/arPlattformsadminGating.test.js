// Etapp 67a (ETAPPLAN16.md): låser fast att klienten bara FÖRSÖKER läsa plattformsadmin/{uid}
// för superadmins. Avgränsningen är inte en behörighetsspärr (regellagret avgör det ändå) utan
// en brusspärr: utan den gör varje inloggad användare en alltid misslyckad Firestore-läsning
// vid varje session, rakt in i den "upprepade permission-denied"-signal Etapp 32b ska larma på.
// Ett framtida "förenklande" som tar bort role-villkoret ser harmlöst ut i en diff – det här
// testet är till för att det inte ska passera obemärkt.
import { describe, it, expect } from "vitest";
import { farForsokaLasaPlattformsadmin, ROLES } from "./roles";

describe("farForsokaLasaPlattformsadmin", () => {
  it("försöker för en superadmin", () => {
    expect(farForsokaLasaPlattformsadmin("uid1", ROLES.SUPERADMIN)).toBe(true);
  });

  it("försöker INTE för någon annan roll", () => {
    for (const roll of [ROLES.VOL, ROLES.SEKTIONSLEDARE, ROLES.VEC, ROLES.FORRADSANSVARIG, ROLES.PERSONAL, ROLES.KIOSK]) {
      expect(farForsokaLasaPlattformsadmin("uid1", roll)).toBe(false);
    }
  });

  it("försöker INTE utan uid, ens med rätt roll", () => {
    expect(farForsokaLasaPlattformsadmin(null, ROLES.SUPERADMIN)).toBe(false);
    expect(farForsokaLasaPlattformsadmin(undefined, ROLES.SUPERADMIN)).toBe(false);
  });

  it("försöker INTE när rollen ännu inte laddats (null/undefined)", () => {
    expect(farForsokaLasaPlattformsadmin("uid1", null)).toBe(false);
    expect(farForsokaLasaPlattformsadmin("uid1", undefined)).toBe(false);
  });
});
