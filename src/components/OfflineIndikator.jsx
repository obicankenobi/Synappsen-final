import { useEffect, useState } from "react";
import "./OfflineIndikator.css";

export default function OfflineIndikator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    function satOnline() {
      setOnline(true);
    }
    function satOffline() {
      setOnline(false);
    }
    window.addEventListener("online", satOnline);
    window.addEventListener("offline", satOffline);
    return () => {
      window.removeEventListener("online", satOnline);
      window.removeEventListener("offline", satOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-indikator" role="status">
      📴 Ingen internetanslutning – visar sparad data, ändringar synkas när du är online igen.
    </div>
  );
}
