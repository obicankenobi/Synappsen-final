import "./DiffVy.css";

// Etapp 38c: delad diffvisning – extraherad ur VersionsHistorik.jsx så samma radbaserade
// LCS-diff (utils/diff.js) kan visa en ändringsförslags påverkan innan den införs, inte bara
// gamla versioner av en rutin.
export default function DiffVy({ rader }) {
  return (
    <pre className="diff-vy">
      {rader.map((r, i) => (
        <div key={i} className={`diff-vy__rad diff-vy__rad--${r.typ}`}>
          {r.typ === "tillagd" ? "+ " : r.typ === "borttagen" ? "- " : "  "}
          {r.text}
        </div>
      ))}
    </pre>
  );
}
