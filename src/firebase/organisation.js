// Etapp 1 (multi-tenant-grund): varje användare och varje dokument hör till en organisation.
// STANDARD_ORG är organisationen som all befintlig data/alla befintliga konton tillhör tills
// vidare (en enda installation = en organisation). Nya organisationer får ett eget orgId när
// produkten säljs till fler kunder (se ETAPP1-ARBETSUPPGIFTER.md).
//
// Både klient och regler (firestore.rules) faller tillbaka på detta värde när ett dokument
// eller en användare saknar organisationId (t.ex. innan migreringsfunktionen körts), så att
// driftsättningen aldrig kan låsa ute befintliga användare – se kommentaren i firestore.rules.
export const STANDARD_ORG = "default";
