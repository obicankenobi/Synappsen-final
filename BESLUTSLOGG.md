# Beslutslogg

**Syfte:** ett samlat register över ägarbeslut, framåtriktat från 2026-08-04 (Etapp 45f).
Löser problemet att ett redan avgjort beslut annars bara finns begravt i en `CLAUDE_STATUS.md`-
uppföljning bland byggnoteringar – och riskerar att tas upp igen om några månader utan att
någon minns svaret eller varför.

**Byggs framåtriktat, inte retroaktivt.** En fullständig genomgång av alla historiska beslut
i `CLAUDE_STATUS.md` bedömdes kosta mer än den ger (se `ETAPPLAN9.md` Beslut 3) – de finns
redan där, kronologiskt, om än utspridda. Den här filen fylls på från och med dagens datum.

**En rad i `OPPNA-PUNKTER.md` som blir ett beslut** (ägaren säger ja/nej, med eller utan ett
omprövningsvillkor) flyttas hit och tas bort därifrån – ett beslut är inte längre en öppen
punkt.

---

## Format

| Datum | Fråga | Beslut | Motivering | Vad det påverkade/låste upp |
|---|---|---|---|---|
| 2026-08-06 | Etapp 49a: bygg automatiserad radering vid avetablering nu, eller vänta? | **Ja, bygg – men som en av kunden själv begärd, tidsfördröjd (48h) radering** kunden själv triggar, inte en leverantör-konsol-knapp | Ger bäst av två världar: uppfyller avtalslöftet på riktigt (kunden kan själv begära radering) samtidigt som ett fönster skyddar mot misstag/kapade konton | Låste upp bygget av `begarRaderingAvOrganisation`/`avbrytRaderingAvOrganisation`/`raderaOrganisationensData`, en ny UI-sektion i `/admin` och `/leverantor`, samt uppdatering av `avtal/PUB-AVTAL-MALL.md` p. 6 |
| 2026-08-06 | Etapp 49a: ska backupfiler raderas direkt vid genomförd radering, eller behålla den befintliga 90-dagarsgallringen? | **Behåll 90-dagarsgallringen** som ett extra skyddsnät | En kund skulle teoretiskt kunna be om återställning upp till 90 dagar efter "radering" – avvägt medvetet, dokumenterat ärligt i `avtal/PUB-AVTAL-MALL.md` p. 6 | `raderaOrganisationensData` rör aldrig `backups/{orgId}/...` |
| 2026-08-08 | Etapp 49b: produktionslik RTO-mätning – alternativ A, B eller C? | **Alternativ A** – en riktig mätning mot skarp infrastruktur, med en syntetisk testorganisation (inte en separat testmiljö) | Snabbast väg till en trovärdig siffra; ingen kontraktuell RTO-SLA gör risken av att röra produktion med syntetisk data godtagbar | Genomfördes 2026-08-09 via en ny GitHub Actions-workflow (`.github/workflows/rto-matning.yml`) som återanvänder deploy.yml:s befintliga service account-hemlighet – resultat: 1 136 ms för 100 dokument mot skarp Firestore/Storage, skrivet in i `avtal/IT-FAKTABLAD.md` p. 6. Etapp 49 (49a–49d) därmed helt klar |
| 2026-08-09 | Etapp 50b: ska tillfällig, kundinitierad supportåtkomst byggas alls, och i så fall hur långt fönster? | **Ja, bygg – alternativ A, med fönstret satt till 6 timmar** (utkastet föreslog 4h) | Löser upphandlingsfrågan "vem hos er kan se våra uppgifter, och hur vet vi när de gör det?" på riktigt, med kunden själv som den enda som kan öppna fönstret; 6h ger mer marginal för tidszoner/support utanför kontorstid än 4h utan att göra fönstret orimligt långt | Låste upp bygget av `beviljaSupportAtkomst`/`avslutaSupportAtkomst`, det nya `farSupportlasa()`-regelmönstret i `firestore.rules`, samt nya UI-sektioner i `/admin` och `/leverantor` |

---

*Se `CLAUDE.md`s underhållsregel för den här filen. Se `OPPNA-PUNKTER.md` för frågor som
INTE ännu är avgjorda.*
