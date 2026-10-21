// @vitest-environment happy-dom
// Laddningsläget i AuthProvider ska vara ett riktigt landmärke, inte en tom sida. Utan detta
// möts en skärmläsare på en långsam enhet av ett dokument utan <main> tills inloggningsstatus
// är löst (se kommentaren i AuthContext.jsx). onAuthStateChanged mockas så att den ALDRIG
// svarar – det är precis "inloggningsstatus ännu inte löst".
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const authCallbacks = [];
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: (_auth, cb) => {
    authCallbacks.push(cb);
    return () => {};
  },
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock("../firebase/config", () => ({ auth: {}, db: {}, rensaLokalaAnvandardata: vi.fn() }));
vi.mock("../firebase/functions", () => ({ losInInbjudan: vi.fn(), rapporteraAppVersion: vi.fn() }));

import { AuthProvider } from "./AuthContext";

afterEach(() => {
  cleanup();
  authCallbacks.length = 0;
});

describe("AuthProvider – laddningsläge", () => {
  it("renderar ett <main id=huvudinnehall> med en statusrad medan inloggningsstatus är olöst", () => {
    const { container } = render(
      <AuthProvider>
        <p>appinnehåll</p>
      </AuthProvider>
    );
    const main = container.querySelector("main#huvudinnehall");
    expect(main, "laddningsläget saknar <main> – en tom sida för en skärmläsare").not.toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/Laddar/);
  });

  it("renderar INTE appens innehåll förrän inloggningsstatus är löst (ingen läcka av skyddat innehåll)", () => {
    render(
      <AuthProvider>
        <p>appinnehåll</p>
      </AuthProvider>
    );
    expect(screen.queryByText("appinnehåll")).toBeNull();
  });

  it("byter ut laddningsläget mot innehållet när statusen är löst – aldrig två <main> samtidigt", async () => {
    const { container } = render(
      <AuthProvider>
        <main id="huvudinnehall">
          <p>appinnehåll</p>
        </main>
      </AuthProvider>
    );
    expect(container.querySelectorAll("main").length).toBe(1);
    const { act } = await import("react");
    await act(async () => {
      authCallbacks.forEach((cb) => cb(null));
    });
    expect(screen.getByText("appinnehåll")).toBeTruthy();
    expect(container.querySelectorAll("main").length).toBe(1);
    expect(container.querySelector(".sida--laddar")).toBeNull();
  });
});
