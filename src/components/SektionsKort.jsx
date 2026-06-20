import { Link } from "react-router-dom";
import "./SektionsKort.css";

export default function SektionsKort({ titel, beskrivning, ikon, lank }) {
  return (
    <Link to={lank} className="sektionskort">
      <span className="sektionskort__ikon">{ikon}</span>
      <h3>{titel}</h3>
      <p>{beskrivning}</p>
    </Link>
  );
}
