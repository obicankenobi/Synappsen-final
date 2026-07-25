// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function KraschandeKomponent() {
  throw new Error("Testfel");
}

describe("ErrorBoundary", () => {
  it("renderar sina barn normalt när inget fel inträffar", () => {
    render(
      <ErrorBoundary>
        <p>Vanligt innehåll</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Vanligt innehåll")).toBeTruthy();
  });

  it("fångar ett fel i ett barn och visar reservvyn istället för att krascha", () => {
    // React loggar felet till console.error – dämpa bruset i testkörningen.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <KraschandeKomponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Något gick fel")).toBeTruthy();
    expect(screen.getByText("Ladda om")).toBeTruthy();
    consoleError.mockRestore();
  });
});
