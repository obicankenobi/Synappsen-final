# Synappsen – plan för fortsatt utveckling

*Senast uppdaterad 2026-07-28 · utgår från version 5.45.3.*

> **Denna fil skrevs ursprungligen 2026-07-14 (utgångsläge v5.7.0) och blev sedan liggande
> oanvänd i 38 versioner** medan `ETAPPLAN2.md`, `ETAPPLAN3.md` och `ETAPPLAN4.md` tog över
> som de faktiska, löpande underhållna planeringsdokumenten. Nästan allt som stod här
> (rutinägare, schemalagd backup, offline-center, 2FA-policy m.m.) är sedan länge byggt. Filen
> är nu omskriven till en KORT pekare mot var den verkliga, aktuella planen finns, istället för
> att duplicera innehåll som redan underhålls på ett ställe – se `CLAUDE.md` för hela
> dokumentkartan.

## Var den faktiska planen finns

**`ETAPPLAN4.md`** är den aktiva planen (Etapp 22–30). Etapp 22–25 samt en
UI-designjustering (domän-/statusfärger, temaanpassning "Nordic Clinical"/"Midnight Ward",
rubrikgenomgång) är klara och deployade (v5.45.3). Kvarstående, i den ordning de bör tas:

- **Etapp 26 – Medarbetarens röst (föreslå ändring i en rutin).**
- **Etapp 27 – Skanna och hitta i förrådet** (QR/streckkod).
- **Etapp 28 – Kundens egen profil** (logotyp + accentfärg per organisation).
- **Etapp 29 – Offline på riktigt** (utöka offline-centret till kontakter/förrådsartiklar/
  bilder, kö för åtgärder utan nät).
- **Etapp 30 – Snabbhet och WCAG AA** (medvetet sist, men avgörande).

Se `ETAPPLAN4.md` för fullständiga delmål, klart-kriterier och de fem
**beslutspunkter som kräver ägaren** (bl.a. prioritering mot 13f/SSO och Etapp 16/veckopuls
från `ETAPPLAN3.md`, som båda väntar på ett ägarbeslut och inte är bortglömda).

## Stående underhåll (varje release, gäller oavsett vilken etapp som pågår)

- Säkerhets-/beroendegenomgång vid större ändringar.
- Håll `GODKANDA_KALLDOMANER` (klient) och sökmotorns domänlista synkade vid ändringar av
  klinikstöd-källorna.
- Bevaka Custom Search-kvoten och Gemini-budgeten i adminpanelen när användningen växer.
- Bygg ut enhetstesterna i takt med att säkerhetskritisk logik tillkommer.
- **Vid varje release:** bumpa `package.json`s `"version"` (INTE `src/version.js` – den läser
  numera versionen direkt från `package.json`, se `CLAUDE.md`) och lägg till en post överst i
  `src/data/andringslogg.js`. Två separata bakåtgående sessioner missade det senare i minst 19
  respektive 6 releaser i rad innan det upptäcktes (2026-07-28) – se `ETAPPLAN4.md`s
  sidofynd-anteckningar vid Etapp 24/25 för den fullständiga historien.

## Kända öppna punkter (dokumenterade, ej aktivt planerade)

- Kvitteringsfrist finns bara på anslag, inte rutiner (medvetet – rutiner har eget
  granskningsdatum).
- Regelbaserade personnummerfiltret i `firestore.rules` saknar Luhn-validering (tekniskt
  omöjligt i Firestore-regler; det fulla, Luhn-validerade filtret finns i klient +
  Cloud Functions).
- Kioskläge (`FEATURE.KIOSK_MODE`) är reserverat som en feature-flagga men aldrig byggt –
  enda kvarvarande punkten från det ursprungliga Operations-paketet, se `MODULPLAN.md`.
