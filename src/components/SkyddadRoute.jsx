import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Skyddar sidor som kräver inloggning
export default function SkyddadRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/logga-in" replace />;
  }
  return children;
}
