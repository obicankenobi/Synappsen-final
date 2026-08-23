// Bugrapport från ägaren i produktion (2026-08-22): "Uppdatera"-knappen i
// AppUppdateringBanner.jsx gjorde ingenting. Orsak: `injectManifest`-läget (Etapp 24a) gör
// den här filen till den FAKTISKA service worker-koden - workbox-window postar
// {type: "SKIP_WAITING"} till den väntande workern och väntar på ett "controlling"-event för
// att ladda om sidan (se useAppUppdatering.js och node_modules/vite-plugin-pwa/dist/client/
// build/register.js), men ingen lyssnare för det meddelandet fanns, och clientsClaim()
// saknades. `generateSW`-läget lägger till båda automatiskt; `injectManifest` gör det inte.
//
// `test:e2e` startar aldrig en riktig service worker (Playwright kör mot dev-servern) och
// hade alltså inte kunnat fånga det här - detta test kör sw.js:s faktiska kod i en mockad
// miljö istället, för att bevisa att det som en gång gick sönder inte kan göra det igen utan
// att ett test upptäcker det.
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

vi.mock("workbox-precaching", () => ({ precacheAndRoute: vi.fn() }));
vi.mock("workbox-core", () => ({ clientsClaim: vi.fn() }));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn() }));
vi.mock("firebase/messaging/sw", () => ({
  getMessaging: vi.fn(),
  onBackgroundMessage: vi.fn(),
}));

describe("sw.js: service worker-uppdateringen fungerar", () => {
  let lyssnare;
  let ursprungligSelf;

  beforeEach(() => {
    vi.clearAllMocks();
    lyssnare = {};
    ursprungligSelf = globalThis.self;
    globalThis.self = {
      __WB_MANIFEST: [],
      skipWaiting: vi.fn(),
      registration: { showNotification: vi.fn() },
      addEventListener: vi.fn((namn, fn) => {
        lyssnare[namn] = fn;
      }),
      clients: { matchAll: vi.fn().mockResolvedValue([]) },
    };
  });

  afterEach(() => {
    globalThis.self = ursprungligSelf;
    vi.resetModules();
  });

  test("skipWaiting() anropas när {type: 'SKIP_WAITING'} tas emot - det som var trasigt", async () => {
    await import("./sw.js");

    expect(lyssnare.message, "sw.js registrerar ingen 'message'-lyssnare alls").toBeTypeOf("function");

    lyssnare.message({ data: { type: "SKIP_WAITING" } });
    expect(self.skipWaiting).toHaveBeenCalledOnce();
  });

  test("skipWaiting() anropas INTE för ett annat meddelande", async () => {
    await import("./sw.js");

    lyssnare.message({ data: { type: "NAGOT_ANNAT" } });
    lyssnare.message({ data: undefined });
    expect(self.skipWaiting).not.toHaveBeenCalled();
  });

  test("clientsClaim() anropas vid uppstart, så den nya workern tar kontroll över redan öppna flikar", async () => {
    const { clientsClaim } = await import("workbox-core");
    await import("./sw.js");
    expect(clientsClaim).toHaveBeenCalledOnce();
  });
});
