import { createContext } from "react";

// Etapp 8e: ersätter native confirm()/alert() med en egen inline-dialog i appens stil
// istället för webbläsarens (som inte går att styla och känns malplacerad på mobil).
// confirm() returnerar ett Promise<boolean> (samma anropsmönster som window.confirm, bara
// asynkront). visaMeddelande() ersätter alert() – fire-and-forget, ingen väntan krävs.
export const DialogContext = createContext({
  confirm: () => Promise.resolve(false),
  visaMeddelande: () => {},
});
