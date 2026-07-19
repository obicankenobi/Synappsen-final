import "./Skelett.css";

// Grå platshållarkort under laddning, istället för en ensam "Laddar..."-textrad – ger en
// tydligare känsla av att sidan faktiskt bygger upp innehåll.
export default function Skelett({ antal = 3 }) {
  return (
    <div className="skelett-lista" aria-hidden="true">
      {Array.from({ length: antal }).map((_, i) => (
        <div key={i} className="skelett-kort">
          <div className="skelett-rad skelett-rad--titel" />
          <div className="skelett-rad" />
          <div className="skelett-rad skelett-rad--kort" />
        </div>
      ))}
    </div>
  );
}
