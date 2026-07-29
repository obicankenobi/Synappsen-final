// Etapp 27a: kameraskanning av QR-/streckkoder i förrådet. BarcodeDetector (Chrome/Android)
// används när den finns; annars lazy-laddas jsqr som en egen chunk (genomgående krav 9 – en
// streckkodsavkodare hör inte hemma i huvudpaketet som laddas åt alla, även de som aldrig
// skannar). Koden avgör bara VAD som skannades (en text) – det är anroparens ansvar (se
// tolkaSkannadLank) att avgöra om texten pekar på något giltigt i appen.
import { useEffect, useRef, useState } from "react";
import { useDialog } from "../hooks/useDialog";
import "./SkannaModal.css";

export default function SkannaModal({ onResultat, onAvbryt }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const stoppadRef = useRef(false);
  const [fel, setFel] = useState(null);
  const { visaMeddelande } = useDialog();

  useEffect(() => {
    let jsQRModul = null;
    const detektor = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

    async function starta() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!detektor) {
          jsQRModul = (await import("jsqr")).default;
        }
        lasAvBildruta();
      } catch {
        setFel("Kunde inte starta kameran. Kontrollera att appen har kameratillstånd.");
      }
    }

    async function lasAvBildruta() {
      if (stoppadRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          if (detektor) {
            const traffar = await detektor.detect(video);
            if (traffar.length > 0) {
              hanteraTraff(traffar[0].rawValue);
              return;
            }
          } else if (jsQRModul) {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const bild = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const resultat = jsQRModul(bild.data, bild.width, bild.height);
            if (resultat?.data) {
              hanteraTraff(resultat.data);
              return;
            }
          }
        } catch {
          // Enstaka avkodningsfel i en bildruta är normalt – försök igen på nästa.
        }
      }
      requestAnimationFrame(lasAvBildruta);
    }

    function hanteraTraff(text) {
      stoppadRef.current = true;
      onResultat(text);
    }

    starta();
    return () => {
      stoppadRef.current = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fel) {
      visaMeddelande(fel);
      onAvbryt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fel]);

  return (
    <div className="skanna-modal__bakgrund" role="dialog" aria-label="Skanna QR-kod">
      <div className="skanna-modal">
        <video ref={videoRef} className="skanna-modal__video" playsInline muted />
        <canvas ref={canvasRef} className="skanna-modal__canvas" />
        <div className="skanna-modal__ram" aria-hidden="true" />
        <p className="skanna-modal__hjalptext">Rikta kameran mot en QR-kod</p>
        <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
          Avbryt
        </button>
      </div>
    </div>
  );
}
