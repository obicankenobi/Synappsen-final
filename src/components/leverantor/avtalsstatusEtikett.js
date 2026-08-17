// Etapp 15d: avtalssignering och betalning sker MEDVETET utanför appen – det här är bara en
// statusflagga leverantörsadmin sätter manuellt, se ETAPPLAN3.md beslutspunkt 6.
// Delad mellan OrganisationsListaSektion.jsx (filterraden) och OrganisationsRad.jsx (varje
// rads avtalsstatus-väljare) sedan Etapp 67e – tidigare definierad en gång i Leverantor.jsx.
export const AVTALSSTATUS_ETIKETT = {
  offert: "Offert",
  signerat: "Signerat",
  aktiv: "Aktiv",
  pausad: "Pausad",
  avslutad: "Avslutad",
};
