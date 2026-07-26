import { Component } from "react";
import { Sentry } from "../sentry.js";
import "./ErrorBoundary.css";

// Fångar renderingsfel i sina children (t.ex. ett Firestore-dokument i ett oväntat format)
// så EN sidas krasch inte tar ner hela appen med en helvit skärm. Måste vara en klasskomponent
// – React stödjer bara error boundaries via getDerivedStateFromError/componentDidCatch, det
// finns ingen hook-motsvarighet.
export default class ErrorBoundary extends Component {
  state = { harFel: false };

  static getDerivedStateFromError() {
    return { harFel: true };
  }

  componentDidCatch(fel, info) {
    console.error("Något gick fel i vyn:", fel, info);
    Sentry.captureException(fel, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.harFel) {
      return (
        <div className="error-boundary">
          <h2>Något gick fel</h2>
          <p>Den här vyn kunde inte visas. Ladda om sidan för att försöka igen.</p>
          <button className="knapp" onClick={() => window.location.reload()}>
            Ladda om
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
