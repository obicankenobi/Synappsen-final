import { useContext } from "react";
import { AuthContext } from "../context/authContextDef";

export function useAuth() {
  return useContext(AuthContext);
}
