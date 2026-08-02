import { useAuth } from "../hooks/useAuth";
import { useAndringsforslag, FORSLAG_STATUS } from "../hooks/useAndringsforslag";
import { StatusBadge } from "./Badge";
import { formateraDatum } from "../utils/datum";
import "./MinaForslag.css";

// Etapp 38b: "Vad hände med min ändring?" – planens egen bedömning är att det här är den
// enskilt viktigaste raden i hela etappen: ett förslagsflöde utan synlig återkoppling slutar
// användas. Före den här komponenten fanns INGEN plats i appen där en medarbetare kunde se
// status på ett förslag hon lämnat – bara redaktörens granskningskö (ForslagSektion.jsx)
// visste vad som hänt. Återanvänder det befintliga statusbadge-systemet (badgen har egna
// nyckelord "vantar/godkand/avvisad" – mappade om här från förslagens egna
// "ny/infort/avvisat", istället för att uppfinna en ny badgevariant).
const BADGE_FOR_STATUS = {
  [FORSLAG_STATUS.NY]: "vantar",
  [FORSLAG_STATUS.INFORT]: "godkand",
  [FORSLAG_STATUS.AVVISAT]: "avvisad",
};

export default function MinaForslag() {
  const { currentUser } = useAuth();
  const { forslag: forslagKlin } = useAndringsforslag("kliniskt-stod");
  const { forslag: forslagAdmin } = useAndringsforslag("administration");

  const minaForslag = [...forslagKlin, ...forslagAdmin]
    .filter((f) => f.foreslagenAv === currentUser?.uid)
    .sort((a, b) => (b.tidpunkt?.toMillis?.() ?? 0) - (a.tidpunkt?.toMillis?.() ?? 0))
    .slice(0, 10);

  if (minaForslag.length === 0) return null;

  return (
    <section className="hem__sektion mina-forslag">
      <h2>✏️ Mina ändringsförslag</h2>
      <ul className="mina-forslag__lista">
        {minaForslag.map((f) => (
          <li key={f.id} className="mina-forslag__rad">
            <div>
              <p className="mina-forslag__rutin">{f.rutinTitel}</p>
              <p className="mina-forslag__text">{f.forslag}</p>
              {f.status === FORSLAG_STATUS.AVVISAT && f.avvisningsMotivering && (
                <p className="mina-forslag__motivering">
                  <strong>Motivering:</strong> {f.avvisningsMotivering}
                </p>
              )}
              {f.hanteradDatum && (
                <p className="mina-forslag__datum">Hanterat {formateraDatum(f.hanteradDatum)}</p>
              )}
            </div>
            <StatusBadge status={BADGE_FOR_STATUS[f.status]} />
          </li>
        ))}
      </ul>
    </section>
  );
}
