// Etapp 56c: härleder välkomstchecklistans stegstatus ur faktisk data i stället för en
// självrapporterad checkbox. Ren funktion, separerad från useValkomstchecklista.js för att
// vara testbar utan att mocka Firestore-lyssnare (samma mönster som kompetensStatus.js).
//
// Måste matcha functions/index.js STANDARD_TAK_ORE (200 kr) – samma dupliceringsmönster som
// andra klient/server-konstantpar i projektet (t.ex. KAN_HANTERA_FORRAD).
export const STANDARD_TAK_ORE = 20000;

export function harledStegStatus({ anvandare, egetUid, rutiner, orgData, budgetData }) {
  return {
    // "En annan än jag själv har blivit medlem" – kräver att inbjudan faktiskt lösts in,
    // inte bara skickats, eftersom inbjudningar/{token} av säkerhetsskäl aldrig går att läsa
    // direkt från klienten (se firestore.rules, hela hemligheten ÄR token).
    bjud_in_kollegor: anvandare.length > 1,
    // Minst en medlem UTÖVER mig själv har en roll skild från standardrollen "personal" –
    // dvs. ett medvetet rollval har gjorts, inte bara ett accepterat förval.
    satt_roller: anvandare.some((a) => a.id !== egetUid && a.role !== "personal"),
    // "kalla: 'verksamhetsmall'" sätts ENDAST av startbibliotekets seedning
    // (skapaOrganisation) – vilken som helst annan rutin bevisar ett riktigt importsteg,
    // oavsett hur den skapades (foto, PDF eller manuellt).
    importera_rutiner: rutiner.some((r) => r.kalla !== "verksamhetsmall"),
    // sakerhet.* skrivs ENDAST av uppdateraMfaPolicy, aldrig av skapaOrganisation – fältets
    // blotta EXISTENS bevisar att ett medvetet ställningstagande gjorts, även om beslutet
    // blev "inget krav".
    aktivera_2fa_policy: orgData?.sakerhet !== undefined,
    // taketOre sätts till standardvärdet redan vid etablering (skapaOrganisation) – bara en
    // avvikelse FRÅN det värdet bevisar en medveten justering.
    satt_gemini_budget: budgetData != null && budgetData.taketOre !== STANDARD_TAK_ORE,
  };
}
