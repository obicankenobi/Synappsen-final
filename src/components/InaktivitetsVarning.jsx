import "./InaktivitetsVarning.css";

export default function InaktivitetsVarning({ onFortsatt }) {
  return (
    <div className="inaktivitets-varning-overlag">
      <div className="inaktivitets-varning">
        <h3>Är du kvar?</h3>
        <p>Du loggas ut om en kort stund på grund av inaktivitet, av säkerhetsskäl.</p>
        <button className="knapp" onClick={onFortsatt}>
          Fortsätt vara inloggad
        </button>
      </div>
    </div>
  );
}
