// Etapp 4 (säkerhetsgenomgång): bevisar att den tidigare kända luckan i storage.rules
// (rutiner/{omrade}/{rutinId}/{filnamn} och forradsartiklar/{forradSlug}/{artikelId}/{filnamn}
// var inte organisationsskopade) nu är stängd – en användare i organisation B kan inte längre
// läsa/skriva en bild som hör till en rutin/artikel i organisation A, även om de känner till
// den exakta sökvägen. Körs mot Firestore- OCH Storage-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/rules/storage.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, uploadBytes, getBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

let antalKlarade = 0;
let antalMisslyckade = 0;

async function test(namn, fn) {
  try {
    await fn();
    antalKlarade++;
    console.log(`  OK   ${namn}`);
  } catch (fel) {
    antalMisslyckade++;
    console.error(`  FEL  ${namn}`);
    console.error(`       ${fel.message}`);
  }
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: "orgA" });
    await setDoc(doc(db, "users", "volB"), { role: "vol", organisationId: "orgB" });
    await setDoc(doc(db, "rutiner", "rutinA"), { omrade: "kliniskt-stod", organisationId: "orgA" });
    await setDoc(doc(db, "forradsartiklar", "artikelA"), { forrad: "Engångsförrådet", organisationId: "orgA" });

    const storageAdmin = context.storage();
    await uploadBytes(
      ref(storageAdmin, "rutiner/kliniskt-stod/rutinA/bild.jpg"),
      new Uint8Array([1, 2, 3])
    );
    await uploadBytes(
      ref(storageAdmin, "forradsartiklar/Engångsförrådet/artikelA/bild.jpg"),
      new Uint8Array([1, 2, 3])
    );
  });

  const volAStorage = testEnv.authenticatedContext("volA").storage();
  const volBStorage = testEnv.authenticatedContext("volB").storage();

  console.log("\nrutiner/{omrade}/{rutinId}/{filnamn} – organisationsisolering");
  await test("volA (samma org som rutinen) kan läsa bilden", () =>
    assertSucceeds(getBytes(ref(volAStorage, "rutiner/kliniskt-stod/rutinA/bild.jpg")))
  );
  await test("volB (annan org) kan INTE läsa bilden", () =>
    assertFails(getBytes(ref(volBStorage, "rutiner/kliniskt-stod/rutinA/bild.jpg")))
  );
  await test("volB (annan org, fel roll för kliniskt-stod också) kan INTE skriva över bilden", () =>
    assertFails(
      uploadBytes(ref(volBStorage, "rutiner/kliniskt-stod/rutinA/bild.jpg"), new Uint8Array([9]))
    )
  );

  console.log("\nforradsartiklar/{forradSlug}/{artikelId}/{filnamn} – organisationsisolering");
  await test("volA (annan roll, men rätt org) kan läsa förrådsbilden", () =>
    assertSucceeds(getBytes(ref(volAStorage, "forradsartiklar/Engångsförrådet/artikelA/bild.jpg")))
  );
  await test("volB (annan org) kan INTE läsa förrådsbilden", () =>
    assertFails(getBytes(ref(volBStorage, "forradsartiklar/Engångsförrådet/artikelA/bild.jpg")))
  );

  console.log("\nSökväg mot ett rutinId som inte finns i Firestore – fail closed");
  await test("kan INTE läsa en bild vars rutinId inte finns i Firestore alls", () =>
    assertFails(getBytes(ref(volAStorage, "rutiner/kliniskt-stod/finns-inte/bild.jpg")))
  );

  console.log("\navatarer/{uid}/{filnamn} – Etapp 22e: bara ägaren skriver, samma org läser");
  await test("volA KAN ladda upp sin egen profilbild", () =>
    assertSucceeds(uploadBytes(ref(volAStorage, "avatarer/volA/bild.jpg"), new Uint8Array([1, 2, 3])))
  );
  await test("volA KAN läsa sin egen profilbild", () =>
    assertSucceeds(getBytes(ref(volAStorage, "avatarer/volA/bild.jpg")))
  );
  await test("volB (annan org) kan INTE läsa volAs profilbild", () =>
    assertFails(getBytes(ref(volBStorage, "avatarer/volA/bild.jpg")))
  );
  await test("volB kan INTE ladda upp en profilbild i volAs namn", () =>
    assertFails(uploadBytes(ref(volBStorage, "avatarer/volA/kapad.jpg"), new Uint8Array([9])))
  );

  await testEnv.cleanup();

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
