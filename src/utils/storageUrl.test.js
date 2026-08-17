// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.4). Testerna som avvisar en främmande värd
// beskriver exakt det som var möjligt före patchen: en redaktör satte bildUrl till sin egen
// adress, och varje användare som tryckte "ladda ner bilder" hämtade den.
import { describe, it, expect } from "vitest";
import { arStorageUrl } from "./storageUrl";

describe("arStorageUrl", () => {
  it("godkänner en klassisk getDownloadURL-adress", () => {
    expect(
      arStorageUrl(
        "https://firebasestorage.googleapis.com/v0/b/synappsen.appspot.com/o/rutiner%2Fx.png?alt=media&token=abc"
      )
    ).toBe(true);
  });

  it("godkänner den nyare bucket-domänen", () => {
    expect(arStorageUrl("https://synappsen.firebasestorage.app/o/bild.png")).toBe(true);
  });

  it("avvisar en godtycklig extern värd", () => {
    expect(arStorageUrl("https://angriparens-server.example/spar.png")).toBe(false);
  });

  it("avvisar en värd som bara SLUTAR likadant som den godkända", () => {
    expect(arStorageUrl("https://firebasestorage.googleapis.com.example.net/bild.png")).toBe(false);
    expect(arStorageUrl("https://elak-firebasestorage.app/bild.png")).toBe(false);
  });

  it("avvisar http, data: och trasiga adresser", () => {
    expect(arStorageUrl("http://firebasestorage.googleapis.com/bild.png")).toBe(false);
    expect(arStorageUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
    expect(arStorageUrl("inte en adress")).toBe(false);
    expect(arStorageUrl("")).toBe(false);
    expect(arStorageUrl(undefined)).toBe(false);
  });
});
