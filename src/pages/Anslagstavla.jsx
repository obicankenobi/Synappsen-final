import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAnslag } from "../hooks/useAnslag";
import { useAnvandare } from "../hooks/useAnvandare";
import { KAN_HANTERA_ANSLAG } from "../firebase/roles";
import AnslagFormular from "../components/AnslagFormular";
import AnslagKort from "../components/AnslagKort";
import Skelett from "../components/Skelett";

export default function Anslagstavla() {
  const { currentUser, role, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const { anslag, laddar, skapaAnslag, uppdateraAnslag, taBortAnslag } = useAnslag();
  const { anvandare } = useAnvandare();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);

  const farHantera = KAN_HANTERA_ANSLAG.includes(role);

  async function hanteraSpara(varden) {
    if (redigerar) {
      await uppdateraAnslag(redigerar.id, varden, currentUser.uid);
    } else {
      await skapaAnslag({ ...varden, skapadAv: currentUser.uid, skapadAvNamn: mittNamn });
    }
    setVisaFormular(false);
    setRedigerar(null);
  }

  function oppnaRedigering(post) {
    setRedigerar(post);
    setVisaFormular(true);
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>📢 Anslagstavla</h1>
      <p className="sida__beskrivning">Meddelanden och information från ledningen.</p>

      {farHantera && !visaFormular && (
        <button className="knapp" onClick={() => setVisaFormular(true)}>
          Nytt anslag
        </button>
      )}

      {visaFormular && (
        <AnslagFormular
          initialaVarden={redigerar}
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
          }}
        />
      )}

      {laddar && <Skelett />}

      {!laddar && anslag.length === 0 && (
        <div className="platshallare">
          <p>Inga anslag publicerade ännu.</p>
        </div>
      )}

      {anslag.map((post) => (
        <AnslagKort
          key={post.id}
          anslag={post}
          farHantera={farHantera}
          anvandare={anvandare}
          onRedigera={oppnaRedigering}
          onTaBort={(id) => taBortAnslag(id, currentUser.uid)}
        />
      ))}
    </div>
  );
}
