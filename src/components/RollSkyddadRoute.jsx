import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Skyddar sidor som kräver inloggning och en specifik roll
export default function RollSkyddadRoute({ tillatnaRoller, children }) {
  const { currentUser, role } = useAuth();

  if (!currentUser) {
    return <Navigate to="/logga-in" replace />;
  }
  if (!tillatnaRoller.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
