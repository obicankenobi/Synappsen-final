import { useContext } from "react";
import { DialogContext } from "../context/dialogContextDef";

export function useDialog() {
  return useContext(DialogContext);
}
