# Synappsen – Incidentresponsplan

**Dokumenttyp:** Policy (extern – får delas med kund, kundens IT-säkerhetsfunktion och vid
upphandling)
**Version:** 1.2
**Fastställd:** 2026-08-08
**Gäller från:** 2026-08-08
**Nästa översyn:** vid varje större release, dock minst var sjätte månad (se avsnitt 12)

> **Läsanvisning.** Detta dokument beskriver *vad* som ska ske vid en incident och *varför* –
> det är styrande policy. Den operativa steg-för-steg-hanteringen finns i det interna
> dokumentet `INCIDENT-CHECKLISTA.md`, som inte delas externt eftersom det innehåller
> driftdetaljer. Vid konflikt mellan dokumenten gäller denna plan.

---

## 1. Syfte och omfattning

Planen beskriver hur Synappsen upptäcker, begränsar, utreder, kommunicerar och lär av
säkerhetsincidenter som rör tjänsten eller kunders personuppgifter.

Den omfattar:

- Obehörig åtkomst till, ändring av eller spridning av kunddata.
- Förlust av tillgänglighet i tjänsten.
- Komprometterade konton, nycklar eller behörigheter.
- Sårbarheter i tjänsten eller dess beroenden som bedöms utnyttjbara.

Planen kompletterar och ska läsas tillsammans med:

| Dokument | Reglerar |
|---|---|
| `avtal/PUB-AVTAL-MALL.md` p. 8 | Den avtalade skyldigheten att underrätta kund inom 72 timmar |
| `avtal/DPIA-UNDERLAG.md` p. 9 | Konsekvensbedömningens incidentrutin |
| `avtal/UNDERBITRADEN.md` | Underbiträden som kan beröras av en incident |
| `SAKERHETSRAPPORT.md` | Tjänstens säkerhetsarkitektur och kända begränsningar |

---

## 2. Definitioner

**Säkerhetsincident** – en inträffad eller starkt misstänkt händelse som påverkar
konfidentialitet, riktighet eller tillgänglighet i tjänsten eller dess data.

**Personuppgiftsincident** – en säkerhetsincident som leder till oavsiktlig eller olaglig
förstöring, förlust, ändring, obehörigt röjande av eller obehörig åtkomst till personuppgifter
(GDPR art. 4.12). **Alla personuppgiftsincidenter är säkerhetsincidenter, men inte tvärtom.**

**Kännedom** – tidpunkten då leverantören har rimlig grad av visshet om att en
personuppgiftsincident har inträffat. Detta är den tidpunkt då 72-timmarsfristen börjar löpa.
En obekräftad avvikelseindikation utgör inte kännedom; en bekräftad obehörig åtkomst gör det.

**Patientsäkerhetspåverkan** – en incident eller en åtgärd mot en incident som kan försvåra
för vårdpersonal att nå information de behöver i en vårdsituation. Se avsnitt 7.

---

## 3. Klassificering

Klassificeringen styr svarstid och kommunikation. Vid tveksamhet klassas incidenten **högre**,
aldrig lägre.

| Nivå | Innebörd | Exempel i Synappsen |
|---|---|---|
| **P1 – Kritisk** | Bekräftad eller starkt misstänkt exponering av kunddata, eller att kliniskt innehåll inte går att nå | Data från en organisation har varit läsbar för en annan; misstänkt uttag av data i stor omfattning; akutläget otillgängligt under pågående drift; totalt avbrott |
| **P2 – Allvarlig** | Begränsad påverkan, en organisation, ingen bekräftad spridning | Misstänkt kapat konto; obehörig behörighetshöjning; backupjobbet har misslyckats upprepat; komprometterad API-nyckel |
| **P3 – Begränsad** | Ingen känd dataexponering, ingen driftpåverkan | Sårbarhet i beroende utan känd utnyttjandeväg; avvikelselarm som visar sig ofarligt; enstaka felaktig behörighetsregel utan exponering |

**Omklassificering sker löpande.** En incident som börjar som P2 och visar sig ha berört flera
organisationer blir P1 omedelbart, med de tidskrav som följer.

---

## 4. Roller och ansvar

Leverantören drivs som en verksamhet med **en ansvarig person**. Det redovisas öppet, eftersom
det påverkar realistiska svarstider – och eftersom kompenserande kontroller därför är
inbyggda i tjänsten snarare än beroende av bemanning.

| Roll | Innehas av | Ansvar |
|---|---|---|
| Incidentansvarig | Leverantörens ansvariga person | Beslutar klassificering, begränsningsåtgärder, och om kännedom föreligger |
| Personuppgiftsansvarig | Kunden (vårdorganisationen) | Beslutar om anmälan till IMY och om underrättelse till registrerade |
| Teknisk motpart hos kund | Kundens angivna kontakt | Tar emot underrättelse, samordnar hos kunden |
| Externt stöd | Enligt avsnitt 11 | Anlitas vid P1 eller när kompetensen inte räcker |

### Kompenserande kontroller vid ensam bemanning

Eftersom leverantören inte kan garantera bemanning dygnet runt är följande inbyggt i tjänsten
så att kunden **aldrig är utlämnad till leverantörens tillgänglighet** i ett akut läge:

- **Kundens egen superadmin kan omedelbart återkalla en sessions giltighet** för valfri
  användare i den egna organisationen, utan leverantörens medverkan (funktionen "tvinga
  utloggning" i adminpanelen; åtkomsten är begränsad till den egna organisationen och
  kontrolleras server-side).
- Kundens superadmin kan omedelbart ändra roller och därmed begränsa behörighet.
- Kundens superadmin kan aktivera tvingande tvåfaktorsautentisering för valda roller.

Kunden uppmanas att i sin egen incidentrutin ange vem hos dem som får använda dessa
funktioner, och rekommenderas att göra det **utan att invänta leverantören** vid misstänkt
kontokapning.

---

## 5. Faser

### 5.1 Upptäck

Incidenter kan komma till kännedom genom automatiska avvikelselarm, felrapportering, en
kunds anmälan, eller extern rapport. Alla kanaler leder till samma process.

**Kontaktväg för säkerhetsrapporter:** anges i `avtal/IT-FAKTABLAD.md`. Rapporter tas emot
utan krav på föranmälan, även från personer utan avtalsrelation.

### 5.2 Begränsa

Målet är att stoppa pågående skada utan att skapa ny. Åtgärderna väljs enligt principen i
avsnitt 7. Tillgängliga åtgärder inkluderar återkallande av sessioner, ändrad behörighet,
pausning av en organisation och avstängning av enskilda funktionsmoduler. En begärd permanent
radering av en organisation genomförs aldrig omedelbart – ett fönster (48 timmar) medger att
Biträdet stoppar en obehörig eller felaktig begäran innan något faktiskt raderas.

**Bevis säkras före städning.** Ingen loggpost, användarpost eller konfiguration raderas innan
den dokumenterats, även om raderingen i sig vore en rimlig åtgärd.

### 5.3 Utred

Utredningen ska besvara, i denna ordning:

1. Vilka organisationer är berörda?
2. Vilka uppgiftskategorier har varit exponerade?
3. Under vilken tidsperiod?
4. Är exponeringen avslutad?
5. Är det en personuppgiftsincident enligt definitionen i avsnitt 2?

Fråga 5 avgör om 72-timmarsfristen löper. **Beslutet ska dokumenteras med tidsstämpel och
motivering, även när svaret är nej.**

### 5.4 Underrätta

Se avsnitt 6 och 8.

### 5.5 Återställ

Tjänsten återförs till normalt läge. Om data gått förlorad återställs den från backup enligt
den rutin som beskrivs i `avtal/IT-FAKTABLAD.md`. Återställning loggas i revisionsloggen.

### 5.6 Lär

Se avsnitt 10.

---

## 6. Tidskrav

| Åtgärd | Mål |
|---|---|
| Påbörjad hantering, P1 | Inom 4 timmar från kännedom |
| Påbörjad hantering, P2 | Inom 24 timmar från kännedom |
| Påbörjad hantering, P3 | Nästa arbetsdag |
| **Underrättelse till kund vid personuppgiftsincident** | **Utan onödigt dröjsmål, senast 72 timmar från kännedom** (avtalskrav, PUB-avtalet p. 8) |
| Preliminär lägesbild till kund vid P1 | Så snart berörda organisationer är identifierade |
| Slutrapport till kund | Inom 15 arbetsdagar efter avslutad incident |

**72-timmarsfristen får aldrig invänta en fullständig utredning.** Om alla uppgifter inte
finns tillgängliga underrättas kunden inom fristen med den information som finns, och
kompletteras därefter löpande. Detta följer av GDPR art. 33.4.

---

## 7. Patientsäkerhetsprincipen

Synappsen används i vårdmiljö, i vissa fall under tidskritiska förlopp. Därför gäller en
uttrycklig avvägningsregel som skiljer sig från många andra tjänsters incidenthantering:

> **En begränsningsåtgärd får aldrig med hög sannolikhet orsaka större skada än den incident
> den avser att begränsa.**

Konkreta följder:

- **Automatiserad utestängning av vårdpersonal används inte.** Avvikelsedetektion larmar till
  en människa; den låser inte konton på egen hand. Ett falsklarm som stänger ute en
  sjuksköterska mitt i ett akutförlopp bedöms som en större risk än den obehöriga åtkomst
  larmet skulle förhindra.
- **Bred avstängning är sista utvägen.** Riktade åtgärder (enskild session, enskilt konto)
  föredras framför pausning av en hel organisation.
- **Om en åtgärd riskerar att göra kliniskt innehåll otillgängligt ska kunden informeras
  före åtgärden**, om det är praktiskt möjligt utan att skadan förvärras.
- Undantag: åtgärder som enbart berör **leverantörens egna** administratörskonton får
  automatiseras fullt ut, eftersom de aldrig kan påverka vårdverksamhet.

---

## 8. Kommunikation

### Till kund

Underrättelse enligt PUB-avtalet p. 8 ska innehålla: incidentens art, berörda
uppgiftskategorier och ungefärligt antal registrerade, sannolika konsekvenser, vidtagna och
föreslagna åtgärder, samt kontaktuppgift för vidare frågor.

### Till Integritetsskyddsmyndigheten (IMY)

**Anmälan till IMY görs av kunden**, som är personuppgiftsansvarig. Leverantören är
personuppgiftsbiträde och ansvarar för att i tid ge kunden det underlag som krävs för
anmälan. Leverantören anmäler inte i kundens ställe.

### Till registrerade

Beslut om underrättelse till registrerade fattas av kunden (GDPR art. 34).

### Externt

Ingen extern kommunikation om en pågående incident sker utan kundens kännedom.

---

## 9. Bevarande av bevis

- Loggar, revisionsloggposter och relevant systemtillstånd bevaras oförändrade under
  utredningen och i minst 12 månader efter avslutad incident.
- Revisionsloggen är utformad så att manipulation kan upptäckas (hashkedja). Dess integritet
  kontrolleras som en del av varje P1- och P2-utredning.
- Bevarande av bevis väger tyngre än normal gallring. Om en incident berör data som annars
  skulle gallrats, pausas gallringen för den datan tills utredningen är avslutad.

---

## 10. Efterhandsgenomgång

Efter varje P1- och P2-incident genomförs en genomgång som besvarar:

1. Vad hände, i tidsordning?
2. Hur upptäcktes det – och hur snabbt hade det kunnat upptäckas?
3. Fungerade begränsningsåtgärderna?
4. Vad i denna plan eller i checklistan visade sig otillräckligt?
5. Vilken konkret ändring i tjänsten eller rutinen följer?

**Genomgången är inte skuldsökande.** Dess enda syfte är att förändra systemet eller rutinen.
Slutsatserna förs in i denna plan, i `INCIDENT-CHECKLISTA.md` och vid behov som en punkt i den
aktiva etapplanen.

---

## 11. Externt stöd

Leverantören ska ha tillgång till extern incidentkompetens som kan anlitas vid P1, eller när
den egna kompetensen inte räcker. Detta kan tillgodoses genom cyberförsäkring med
incidentstöd, avtal med säkerhetskonsult, eller motsvarande.

**Status:** ⬜ Ej på plats. Detta är en känd brist och en uttrycklig öppen punkt – se den
aktiva etapplanen. Så länge den inte är åtgärdad utgör kundens egen säkerhetsfunktion, och de
kompenserande kontrollerna i avsnitt 4, den faktiska beredskapen vid P1.

Denna öppenhet är avsiktlig: en plan som beskriver en beredskap som inte finns är sämre än
ingen plan alls.

---

## 12. Förvaltning av denna plan

- Planen ses över vid varje större release och minst var sjätte månad.
- Den uppdateras omedelbart när tjänstens säkerhets- eller detektionsförmåga ändras, så att
  den aldrig beskriver kapacitet som inte finns.
- Ändringar dokumenteras i versionshistoriken nedan.
- Planen prövas praktiskt genom en skrivbordsövning minst en gång per år.

### Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-07-31 | Första fastställda versionen. Upprättad som del av Etapplan 5 (säkerhet, upptäckt och incidentberedskap). |
| 1.1 | 2026-07-31 | Avsnitt 5.5 (Återställ): återställningsfunktionen som avsnittet beskrev existerade inte tidigare – den finns nu, är testad och loggar till revisionsloggen (Etapp 33a/33b). Gallring av gamla backuper väntar fortfarande på ett retentionsbeslut (Etapp 33c). |
| 1.2 | 2026-08-08 | Avsnitt 5.2 (Begränsa): en begärd permanent radering av en organisation kan nu genomföras av kundens egen superadmin, men verkställs aldrig direkt – ett 48-timmarsfönster medger att Biträdet stoppar en obehörig eller felaktig begäran (Etapp 49a). |
