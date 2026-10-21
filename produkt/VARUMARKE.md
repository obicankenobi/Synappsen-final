# Synappsen – varumärkesanalys och identitet

**Internt · version 4, 2026-08-21**

> **Vad detta är:** en nedskrivning av beslut som redan fattats, spridda över flera dokument
> och ett antal samtal.
>
> **Vad det inte är:** mission, vision, värdeord, arketyper, illustrationsmanér.
>
> **Var källdokumenten ligger:** samtliga finns numera i git-repot och pekarna nedan går att
> följa från en arbetskopia — `saljmaterial/MARKNADSANALYS.md`,
> `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md`, `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md`,
> `produkt/GRAFISK-PROFIL.md` och, sedan 2026-09-05, webbplatsen (`synappsen-web/`).
> **P2 i §14 är därmed helt avklarad.** Den här raden påstod motsatsen fram till 2026-09-05,
> då den sista av dem committades; bevakas nu av `tests/docs/webbplats.test.js`.
>
> **Underhållsregel:** visuella beslut bor i `produkt/GRAFISK-PROFIL.md`, priser i
> `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md`. Detta dokument pekar dit och upprepar dem aldrig.

---

## 1. Vad som faktiskt skyddar affären

Det som skyddar Synappsen mot en konkurrent är inte tonen i texterna. Vem som helst kan
läsa webbplatsen och skriva lika öppet på en eftermiddag. Ärlighet är en attityd och
attityder är gratis att kopiera.

Det som inte går att kopiera på en eftermiddag är underlaget bakom den. PUB-avtalsmallen,
DPIA-underlaget, underbiträdesförteckningen, IT-faktabladet, incidentresponsplanen,
tillgänglighetsredogörelsen med uppmätta kontrastvärden, regeltesterna som bevisar
organisationsisoleringen och körs i CI vid varje release, och de dokumenterade
säkerhetsgenomgångarna. Aktuella antal finns i `granskningar/SAKERHETSRAPPORT.md` och i testsviterna, och
ska hämtas därifrån varje gång de ska anges. Att producera materialet tog månader.

**Var vallgraven faktiskt går, formulerat smalare än det är frestande att göra.** Centuri,
CANEA och Stratsys har med all sannolikhet motsvarande underlag. De är etablerade bolag med
jurister. Skyddet ligger alltså inte i dokumenten i sig, utan i kombinationen: en svensk
vårdvertikal, ett färdigt avtalspaket, ett publicerat pris, och en leverantör som är liten nog
att sälja till en enskild klinik för 39 000 kronor. En nystartad konkurrent kan inte producera
underlaget snabbt. En etablerad konkurrent vill inte sälja till en enhet i taget.
**[bedömning, inte mätt]**

Skillnaden i praktiken: "vi är öppna med våra brister" är ett påstående. "Här är
underlaget, kontrollera själv" är en inbjudan som bara den kan skicka som har underlaget.
Rösten är alltså inte tillgången, den är hur vallgraven syns.

Grunden är samtidigt tunn på ett sätt som ingen text kan dölja. Det finns ingen kund. Varje
påstående om nytta är i dag en uppskattning, vilket gör att det enda som går att sälja på är
just det som går att visa.

---

## 2. Position

> **Synappsen är den lokala kunskapsbanken för en vårdenhet: enhetens egna rutiner, förråd
> och introduktioner, sökbara på mobilen mitt i ett arbetspass. Byggd för att användas i
> stunden, inte för att förvalta dokument. Innehåller inga patientuppgifter, vilket är ett
> konstruktionsbeslut som går att styrka tekniskt.**

**För:** privata vårdcentraler, specialistkliniker, närakuter, ASIH-team och kommunal omsorg
med 20–150 personer per enhet, där verksamhetschefen eller ägaren kan besluta själv.

**Inte för:** regioner som köper centralt via annonserad upphandling, inte förrän SSO,
flerenhetsmodell och WCAG nivå A är stängda. Och inte som ersättare för ett regionalt
ledningssystem. Där Centuri redan finns är Synappsen ett komplement.

**Fienden är SharePoint, den delade mappen och pärmen.** Inte Centuri, inte Stratsys.
Marginalkostnaden för status quo är noll, och det formar hela säljsamtalet: produkten ska
inte jämföras funktion mot funktion, den ska jämföras mot att leta.

---

## 3. Löftena

Skrivna i första person, eftersom de kommer att hamna i offerten och på webbplatsen där
"vi" från ett enmansbolag genomskådas i första samtalet.

**1. Ni får veta hur lång tid det tar att hitta en rutin hos er, före och efter.**
Tid-att-hitta, andel nollträffar och kvitteringsgrad mäts och visas. Mätningen är byggd.

**2. Ni ser vilka rutiner som håller på att förfalla innan någon följer en inaktuell.**
Innehållshälsa per område, med nedbrytning och åtgärdsknappar. Byggt.

**3. Systemet innehåller inga patientuppgifter, och ni får underlaget som styrker det.**
Personnummerspärr i tre lager, plus DPIA-underlag och IT-faktablad.

### Vad som medvetet inte står där

Löfte 1 säger inte att det går snabbare. Det säger att ni får siffran. Skillnaden är hela
poängen: en verksamhetschef som ser sin egen mätning drar slutsatsen själv, och då är den
hennes och inte mitt påstående. Ett löfte om utfall hade dessutom fallit igenom bevisregeln
i §7.

Löfte 3 är strikt taget inte en nytta i arbetet, det är frånvaron av ett problem. Men för
det dataskyddsombud som ska godkänna inköpet är det ändå det som avblockerar affären. Nytta
i beslut, inte nytta i pass.

**Jag lovar inte:** tidsbesparing i procent, färre avvikelser, bättre patientsäkerhet, eller
att systemet ersätter ett ledningssystem. Inget av det går att styrka, och
marknadsföringslagen kräver att den som påstår något ska kunna styrka det.

### De två frågor som avgör samtalet

Båda kommer, och det är i dem positionen förhandlas bort om svaret improviseras. Ha båda
färdiga. Reglerna för talad text i §7 gäller ordagrant här: varje löfte i en replik ska ha en
klausul eller en byggd funktion bakom sig.

#### Fråga 1: "Hur mycket tid sparar vi på det här?"

> "Jag vet inte, och den som säger en siffra åt er nu gissar. Det jag kan göra är att mäta
> det hos er. Piloten är sex veckor, sedan har ni era egna siffror och bestämmer själva om
> ni vill fortsätta."

Det svaret gör osäkerheten till ett erbjudande i stället för till en brist.

**Kontrollerat mot avtalet:** repliken lovar bara att piloten är tidsbegränsad och att beslutet
om fortsättning är kundens. Den lovar ingen uppsägningsrätt i ett löpande abonnemang, eftersom
något huvudavtal med löptid och uppsägningsvillkor inte finns skrivet än. Se **B1** i §14.

#### Fråga 2: "Vad händer om du blir sjuk?"

Den ställs oftast av kundens jurist eller av verksamhetschefen själv, och den är svårare än
fråga 1 eftersom den inte går att lösa med en mätning. Den går inte heller att lösa med en
klausul i dag, eftersom klausulen inte är skriven. Repliken måste därför beskriva läget som
det är, inte det som är på väg.

> "Att jag är ensam är den rimligaste invändningen mot att köpa av mig. Källkodsdeposition
> och exitklausul är inte skrivna än. När de är det får ni dem svart på vitt, och tills dess
> tänker jag inte påstå att frågan är löst.
>
> Det som gäller i dag: er data ligger avskild från alla andra kunders, jag kan ta ut hela
> innehållet och lämna över det, och varje sådan uttagning loggas så att ni ser att den
> skett. Att ni ska kunna hämta ut det själva, utan mig, är det som saknas. Den knappen
> bygger jag."

Samma rörelse som i fråga 1: osäkerheten blir ett åtagande i stället för en undanflykt. Men
till skillnad från fråga 1 finns här ett löfte om framtiden, och det binder.

**Kontrollerat mot koden:** exporten finns (`exporteraOrganisation`) men kräver
plattformsadmin, alltså mig. Kunden kan i dag begära radering av sin egen organisation själv,
med 48 timmars ångerfönster, men inte exportera själv. Repliken lovar därför en överlämning,
inte en självbetjäningsknapp. Meningen "den knappen bygger jag" är ett åtagande som måste
hållas, annars ska den strykas ur repliken. Se **B2** i §14.

---

## 4. Ärligheten kostar, och det är inte ett fel

Att redovisa luckor självmant är inte gratis. I varje kravlista där en konkurrent kryssar
"uppfyller WCAG 2.1 AA" och du skriver "delvis förenlig, brister på nivå A kvarstår, ingen
skärmläsartestning genomförd" förlorar du poäng. Ibland förlorar du affären. Privata
kliniker använder kravlistor de också, även om de slipper LOU.

**Räkna med det priset i förväg.** Den som vet att en förlorad affär är den förväntade
kostnaden ger inte upp positionen efter den första. Den som trott att ärlighet är kostnadsfri
gör det, och då finns ingen väg tillbaka: en leverantör som en gång rundat en brist kan
aldrig mer använda sitt underlag som argument.

Motvärdet kommer senare och hos en annan person. IT-avdelningen och dataskyddsombudet läser
underlaget noggrant, och där vinner öppenheten det som kravlistan förlorade. Det betyder att
ärligheten ska säljas till rätt läsare: nämn inte bristerna först i ett samtal med en
verksamhetschef, men se till att de står i materialet hon skickar vidare.

**Tillfrågad direkt svarar du rakt, alltid.** Att välja i vilken ordning saker tas upp är
tillåtet. Att svara undvikande på en rak fråga är det inte, och skillnaden är inte
förhandlingsbar. Den här meningen står här därför att raden ovanför är den enda i dokumentet
som går att läsa som ett tillstånd att slingra sig.

### Gränsen

Ärlighetsprincipen behöver en gräns, annars blir den självsabotage. Du redovisar självmant
det som uppfyller något av dessa:

- Köparen skulle betrakta det som väsentligt för beslutet.
- Köparen skulle känna sig vilseledd om hon upptäckte det efter signering.
- Det står redan i ett dokument hon kommer att läsa, och tystnad skulle se ut som ett försök.

Du redovisar **inte** varje öppen bugg, varje idé i backloggen eller varje sak du själv är
missnöjd med. Det är inte ärlighet, det är oredigerat.

---

## 5. Personlighet

Fyra drag. Varje har en gräns, eftersom ett personlighetsdrag utan gräns är ett värdeord.

**Ärlig innan man blir tvungen.** Luckor redovisas i säljmaterial, inte bara i teknisk
dokumentation.
*Gränsen:* se §4. Och ärlighet är inte självförakt. "Inte byggt" och "medvetet bortvalt" är
två olika saker och ska hållas isär.

**Konkret före abstrakt.** CVK-setet i skåpet, vikarien på sitt tredje pass, sjuksköterskan
utan täckning i ett hem i Upplands Väsby.
*Gränsen:* konkretion får inte bli påhittad. Exempel ur startbiblioteket och demodata, aldrig
en kunds verkliga innehåll, aldrig ett hittepå-citat.

**Kortfattad.** Kunden har fem minuter mellan två patienter.
*Gränsen:* korthet går aldrig ut över en varning eller ett förbehåll.

**Behärskad.** Inga utropstecken, inga superlativ, ingen brådska.
*Gränsen:* behärskad är inte anonym. En sida får ha en åsikt.

---

## 6. Rösten

**1. Skriv siffror med den precision de har.** 11 vårdcentraler, inte "ett tiotal". Är
siffran uppskattad, skriv **[uppskattning]** intill. Avrundning uppåt är den vanligaste
formen av oärlighet i branschen.

**2. Varje påstående ska ha en källa eller en brasklapp.** Ingen mellanväg.

**3. Ett avsnitt om vad som saknas i varje säljdokument.** En IT-avdelning som hittar en
lucka på egen hand utgår från att det finns fler.

**4. Ingen jargong utan förklaring.** Skriv "er data är avskild från andra kunders" och lägg
termen i parentes om den behövs.

**5. Talspråkets rytm, skriftspråkets precision.** Går meningen inte att säga i ett andetag,
dela den.

**6. Inga tankstreck som retorisk paus.** Punkt, komma eller parentes i stället. Tankstreck i
mängd är den tydligaste signalen om maskinskriven text. Webbplatsen gick från 46 till två vid
genomgången 2026-08-20, och de två som är kvar sitter i tomma tabellceller.

**7. Symmetri är tillåten som figur, inte som mönster.** En spegling i en text är en poäng.
Fem är en maskinsignatur. Det som avslöjar en genererad text är att *varje* punktlista har tre
lika långa punkter, *varje* rubrik är byggd som en poäng och *varje* påstående har en perfekt
motvikt. Regeln är alltså inte att aldrig skriva en balanserad mening, utan att räkna dem och
stryka de flesta.

Formulerad så här därför att den tidigare lydelsen ("bryt symmetrin") bröts av dokumentets egen
författare i två versioner i rad, på samma plats. En regel som ingen följer är sämre än en
snävare regel som går att följa.

**8. Beröm aldrig din egen ärlighet.** "Vi skriver ut det i stället för att låta er upptäcka
det" är att ta betalt två gånger för samma sak. Skriv ut bristen och gå vidare.

### Före och efter, ur webbplatsens omarbetning

| Före | Efter |
|---|---|
| "Priset står här. Det gör det inte hos någon annan." | "Priser" |
| "Byggd för att användas under ett arbetspass, inte för att förvalta dokument i en pärm." | "Personalen söker i den på mobilen under passet." |
| "Öppen punkt vi inte döljer:" | "En öppen punkt." |
| "Det är ett medvetet skyddsnät mot ett misstag, och vi skriver ut det i stället för att låta er upptäcka det." | "Det är ett medvetet skyddsnät om någon råkar radera fel, men det är också en sak ni bör känna till." |

Mönstret: rubriken slutar vara en poäng, meningen slutar spegla sig själv, texten slutar
berömma sig för sin egen öppenhet.

---

## 7. Bevisregeln

Innan ett påstående publiceras, tre frågor:

1. **Är det mätt?** Om ja, ange var och när.
2. **Är det bevisbart om någon frågar?** Kan jag visa testsviten, konfigurationen,
   skärmdumpen?
3. **Är det en uppskattning?** Publicera med **[uppskattning]** och skriv vad den bygger på.

Faller påståendet igenom alla tre, publicera det inte.

### Den vanligaste fällan: utfall kontra mekanism

Ett **utfallspåstående** säger vad som händer hos kunden. "Personalen hittar rutinen
snabbare." "Färre avvikelser." Det kräver mätdata från en verklig verksamhet och kan aldrig
styrkas i förväg.

Ett **mekanismpåstående** säger vad produkten gör. "Tid-att-hitta mäts per sökning och visas
i ledningsrapporten." Det kan styrkas med en skärmdump i dag.

Nästan varje påstående som faller igenom bevisregeln går att rädda genom att skrivas om från
utfall till mekanism, och det blir oftast bättre säljargument på köpet. Löfte 1 i §3 är
skrivet så av precis det skälet.

### Talad text har ett krav till

Allt som är skrivet för att sägas högt, alltså repliker, demomanus och telefonöppningar, måste
klara ett fjärde test: **varje löfte i en replik ska ha en klausul bakom sig.**

Skälet är praktiskt. Den som säger meningen står i ett kök på en vårdcentral utan avtalstexten
framför sig, och kan inte nyansera i stunden. Ett löfte i skrift kan läsaren jämföra med
avtalet. Ett löfte i tal blir det kunden minns.

Innan en replik skrivs in i detta dokument eller i ett demomanus: leta upp klausulen som gör
den sann. Finns ingen klausul, formulera om repliken tills den beskriver något som gäller i
dag. Version 2 av det här dokumentet bröt mot regeln, i just den replik som §3 utpekar som
det mest kritiska ögonblicket i hela säljsamtalet.

En variant av samma krav gäller löften om framtiden. Säger en replik att något ska byggas, som
exportknappen i §3, är det ett åtagande och inte en beskrivning. Det ska då också stå som en
åtgärd i §14, annars är det bara en trevlig mening i ett kök.

---

## 8. Vi och jag

**Kundvänt material säger "jag".** Webbplats, offert, mejl, faktablad. Ett "vi" från ett
enmansbolag genomskådas ändå i första telefonsamtalet, och "jag läser inte ert innehåll"
låter som en person medan "vi läser inte ert innehåll" låter som en policy.

**Interna dokument får säga "vi"** om bolaget som enhet. Detta dokument gör det.

**Fällan:** avsnitt som §3 är interna men skrivna för att kopieras rakt in i kundmaterial.
De skrivs därför i "jag" redan här. Den som skriver nästa text kopierar formen, inte regeln.

Byt till "vi" den dag ni faktiskt är fler än en.

---

## 9. Ord

**Använd:** rutin · enhet · pass · kvittera · ägare · giltighetstid · innehållshälsa ·
förråd · hyllplats · introduktionsspår · vikarie · verksamhetschef · redaktör

| Undvik | Varför |
|---|---|
| lösning, plattform | Säger ingenting. Skriv app eller verktyg. |
| revolutionerar, transformerar, sömlös, kraftfull | Superlativ utan innehåll. |
| AI-driven, intelligent, smart | Drar mot den invändning vi vill undvika. |
| digitalisering, digital resa | Konsultspråk. Kunden har ett problem, inte en resa. |
| användarvänlig | Alla påstår det. Visa i stället. |
| patientsäkerhet som löfte | Får beskrivas som ändamål, aldrig som garanterat utfall. |
| kunskapsdelning, synergier | Tomt. |
| vi är stolta över | Ingen kund bryr sig. |

---

## 10. Pilotens pris

`saljmaterial/PILOTUPPLAGG.md` nämner inte pris med ett ord, medan §13 rankar gratiskunden som tredje
värsta tänkbara. Den konflikten avgörs här, i förväg, innan den första kunden ställer frågan
i telefon.

**En tidsbegränsad pilot till reducerat pris är inte en gratiskund. En pilot till noll kronor
är det.**

- Referenskundsrabatten gäller abonnemanget år ett och lämnas mot ett dokumenterat, i
  revisionsloggen loggat medgivande att användas som namngiven referens. **Rabattsatsen står i
  `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md` och upprepas inte här**, av samma skäl som all annan
  prissättning.
- **Uppstartsavgiften rabatteras aldrig.** Den är ditt arbete, inte ett abonnemang, och den är
  dessutom största kassaflödesposten år ett enligt kostnadskalkylen.
- LOU-resonemanget i `saljmaterial/MARKNADSANALYS.md` §7.4 om kostnadsfri kontra betald pilot gäller
  offentliga köpare. För en privat vårdgivare finns den problematiken inte, så där är en betald
  pilot både enklare och bättre.

Skälet till att detta måste stå nedskrivet: piloten är det enda som konverterar varje
**[uppskattning]** i det här dokumentet till en mätt siffra. Att förhandla fram fel form på
den i stundens hetta kostar mer än rabatten.

---

## 11. Namnet

**Stavning:** Synappsen, två p, versalt S. Aldrig SynAppsen, SYNAPPSEN eller Synapsen.

**Uttal:** som synaps med ett extra p-ljud in i "appsen". Bokstaveras i telefon: "med två p".

**Introducera produkten före namnet.** "Ett verktyg där en avdelning samlar sina rutiner. Det
heter Synappsen, efter synapsen som överför signaler." Aldrig omvänt, eftersom namnet ensamt
lika gärna kan läsas som något med syn.

**Dubbel-p:et gör ett jobb.** Utan det syns inte ordleken och app-kopplingen försvinner. Det
gör dessutom namnet till en konstruktion i stället för ett ordboksord, vilket underlättar en
eventuell varumärkesregistrering hos PRV. Kontrollera med jurist när det blir aktuellt.

**Stavrisken är begränsad av kanalen.** Produkten säljs utgående, kontakt för kontakt. Köparen
klickar på en länk i ett mejl eller en offert och skriver aldrig in domänen från minnet. Den
risk som återstår gäller referensledet: en kund som muntligt tipsar en kollega på en annan
klinik transmitterar stavningen utan att bry sig om ordleken, och det inträffar först när det
finns kunder att bli rekommenderad av. **[uppskattning, ingen mätning finns]**

**Domäner:** `synappsen.se` är hemvist. `synappsen.online` är omdirigering och testmiljö.
`synapsen.com` är registrerad av annan part. `synapsen.se` svarade inte vid DNS-kontroll
2026-08-20, vilket inte säkert betyder att den är ledig.

---

## 12. Visuellt

Symbol, färger, typografi, appikoner och formregler ligger i **`produkt/GRAFISK-PROFIL.md`**. Tre
saker hör dock hemma här:

**Symbolen är en synaps i genomskärning**, inte en abstrakt form. Presynaptisk terminal,
klyfta, mottagaryta, riktning från övre vänster till nedre höger. Den går att förklara.

Ritad och inlagd 2026-08-21, se `public/icons/`. Terminalen är en **fylld kropp** och
mottagarytan en **öppen båge**, alltså två olika sorters form. Det är den skillnaden som ger
riktning utan förklaring; ett tidigare utkast med två speglade klumpar lästes som ett ben.
Klyftan har **konstant bredd** eftersom bågen ritas från samma centrum som terminalen, vilket
är det som gör märket skalbart: en klyfta som är bredare på ett ställe sluter sig alltid på
det smalaste först, och då är synapsen borta. Riktningen är 30 grader, flackare än 45 för
renare kanter mot pixelrutnätet. Två varianter: `symbol.svg` utan axon för storlekar under
48 px, `symbol-axon.svg` med axon över.

**Öppet:** ingen har ännu sett symbolen utan att veta vad den föreställer, och ordmärket är
inte ritat.

**Aldrig neurala nätverk, noder eller hjärnor i bildspråket.** Produkten tonar medvetet ned
AI, och nodgrafen är den mest generiska tech-symbolen som finns. Två av tre logotypförslag
från en bildmodell blev nätverksgrafer, så dragningen är stark och måste motstås aktivt.

**Inga bilder på vårdpersonal.** Inga leende sjuksköterskor i stockfoto, inga händer som
håller om andra händer. En verksamhetschef som sett tusen sådana bilder läser dem som att
avsändaren inte har något att visa. Visa gränssnittet, alltid med demodata, aldrig en kunds
verkliga innehåll.

---

## 13. Vad som skulle skada varumärket

Rangordnat.

1. **En nyttosiffra utan täckning.** River hela positionen på en mening och går inte att bygga
   upp igen.
2. **Ett säljmaterial utan avsnittet om vad som saknas.** Första gången det utelämnas blir det
   norm.
3. **En pilot till noll kronor.** En kund som inte betalar är en testanvändare. Se §10.
4. **Att sälja Full-nivån med AI som huvudargument.** Bekräftar exakt den invändning som är
   svårast.
5. **Att lova flerenhetsöverblick innan 54c/54d är byggt.** Det är det en flerenhetskund
   frågar om först, och frestelsen är verklig.
6. **Stockfoto på vårdpersonal.**

---

## 14. Att göra

Listan är delad i två därför att en odelad lista får den som läser den att börja med det
som känns görbart i stället för det som släpper fram en affär. Punkterna nedan har bokstav
och nummer i stället för löpnummer, så att en insättning i mitten inte tyst bryter en
hänvisning någon annanstans i dokumentet. Det hände mellan version 2 och 3.

### Blockerar den första kunden

Ingen av dem går att skriva själv, och båda ryms i samma möte med jurist. Ingen kund kan
tecknas förrän B1 finns, och B2 är den fråga varje kunds jurist ställer först.

| # | Åtgärd | Insats |
|---|---|---|
| **B1** | **Skriv huvudavtalet med löptid och uppsägningsvillkor.** `avtal/PUB-AVTAL-MALL.md` §10 pekar på ett huvudavtal som inte finns, och §3:s replik om piloten begränsas av att det saknas. Utan det går det inte att teckna en kund ens om någon vill. | Kräver jurist |
| **B2** | **Formulera exitsvaret:** källkodsdeposition, dokumenterad exitväg, avtalsklausul. Publicera på webbplatsen när det finns. Avgör i samma veva om **kundstyrd export** ska byggas: `exporteraOrganisation` kräver i dag plattformsadmin, alltså att leverantören är i tjänst, vilket är precis den förutsättning frågan ifrågasätter. §3:s replik utfäster att knappen byggs. | Kräver jurist, samma möte som B1. Exportknappen är ett eget bygge |

### Kan göras parallellt

| # | Åtgärd | Insats |
|---|---|---|
| ~~**P1**~~ | ~~Skriv bakgrundsstycket på webbplatsens startsida~~ **KLAR 2026-10-21.** Skrivet utifrån tre uppgifter från ägaren (arbetar kliniskt inom akutsjukvården, byggde för det dagliga letandet, gränser från dag ett). Ägarens läsning kvarstår, se `OPPNA-PUNKTER.md` | Klart |
| ~~**P2**~~ | ~~Committa `produkt/GRAFISK-PROFIL.md`~~ **KLAR 2026-08-22 (Etapp 68f).** ~~**Kvar:** committa `saljmaterial/MARKNADSANALYS.md`, `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md` och `synappsen-web/`~~ **HELT KLAR 2026-09-05.** Webbplatsen var den sista och låg bara som en publicerad artefakt – enda kopian. Den ligger nu i `synappsen-web/`, är rättad mot den grafiska profilen (den skrevs före Etapp 68b/68d och bar utgångna färgvärden), och är bevakad av `tests/docs/webbplats.test.js` | Klart |
| **P3** | **Rätta de inaktuella siffrorna i `saljmaterial/MARKNADSANALYS.md`.** Den anger 149 regeltester och fyra säkerhetsgenomgångar. Faktiskt läge 2026-08-21: **179** test i `organisationsisolering.test.mjs`, **322** i hela regelsviten, och **åtta** `## Tillägg`-block i `granskningar/SAKERHETSRAPPORT.md`. Eftersom marknadsanalysen är källdokument för prismodell och värdering bör även övriga siffror kontrolleras | 1 timme |
| **P4** | Skriv om `saljmaterial/PITCH.md`s exempel för privat vårdcentral och klinik, se `saljmaterial/MARKNADSANALYS.md` §10 | Dagar |
| ~~**P5**~~ | ~~Rätta knappkontrasten i mörkt läge~~ **KLAR 2026-08-22 (Etapp 68c).** Premissen var dessutom delvis fel: primärknappen hade aldrig defekten, eftersom `.knapp` sätter `color: var(--yta)` som växlar med temat. Den riktiga defekten var vit text på färgad yta i sju andra regler, värst 1,74:1 på grön accent, inklusive hoppa-till-innehall-länken. | Klart |
| **P6** | Kontrollera om `synapsen.se` är ledig och registrera den i så fall. Låg prioritet, se §11 | 10 min + 289 kr/år |

---

## 15. För den som skriver nästa text

Fyra kontroller innan något publiceras:

1. Kör varje påstående genom bevisregeln i §7. Faller det, skriv om det från utfall till
   mekanism innan du stryker det.
2. Räkna tankstrecken. Fler än ett par per sida betyder att texten behöver skrivas om, inte
   redigeras.
3. Läs igenom och leta efter meningar som speglar sig själva. Ta bort motvikten i minst
   hälften av dem.
4. Ska något sägas högt, leta upp klausulen bakom varje löfte i det. Se §7.

Och en femte som är svårare: om texten känns färdig och välbalanserad efter första utkastet
är den förmodligen skriven i någon annans röst.

---

## 16. Ändringslogg

### Version 4, 2026-08-21

Två beställda ändringar, plus tre följdfel som upptäcktes på vägen:

- **Enmansfrågan har fått en replik.** §3 har nu två förberedda svar i stället för ett, och
  de är samlade under rubriken "De två frågor som avgör samtalet". Repliken är skriven mot
  vad koden faktiskt gör: `exporteraOrganisation` kräver plattformsadmin, så kunden kan i dag
  inte exportera själv. Ett tidigare utkast lovade "er data går att exportera när ni vill",
  vilket hade brutit mot regeln om talad text i §7 på samma sätt som pilotrepliken gjorde i
  version 2.
- **§14 delad i blockerande och parallella åtgärder**, och omnumrerad till B1–B2 och P1–P6.
- **Följdfel 1: hänvisningen i inledningsrutan pekade fel.** Den sa "se åtgärd 3 i §14" men
  syftade på committandet av källdokumenten, som blev åtgärd 4 när huvudavtalet sattes in som
  tvåa i version 3. Bokstavsnumreringen finns för att det inte ska kunna upprepas.
- **Följdfel 2: §15 sa "Tre kontroller" och listade fem.**
- **Följdfel 3: §7 saknade en regel om löften om framtiden.** Repliken i §3 utfäster att en
  exportknapp ska byggas, vilket är ett åtagande och inte en beskrivning. Sådana löften ska nu
  också stå som en åtgärd i §14.

**Medvetet inte ändrat:** version 1 hade sex namngivna risker i sitt §3. Tre flyttades till
§11 och §12 i version 2, tre försvann: enmansfrågan, att rösten hänger på en person, och att
`#2F5FD6` är korrekt men inte särskiljande. Den första är nu tillbaka som en replik. De två
andra är fortfarande borttagna, och den sista är värd att återinföra någonstans, eftersom en
framtida formgivare annars kommer att vilja "rätta" en färg som är vald med avsikt.

### Version 3, 2026-08-20

Granskad mot repot av en andra läsare. Sju ändringar:

- **§1:s bärande påstående var för brett.** "En konkurrent i samma storleksklass har det inte"
  smög in ett kvalificerande ord för att bli sant. Etablerade konkurrenter har sannolikt
  motsvarande underlag. Vallgraven omformulerad som en kombination, och märkt som bedömning.
- **Räkneorden borttagna ur §1.** 149 regeltester och fyra säkerhetsgenomgångar var hämtade ur
  `saljmaterial/MARKNADSANALYS.md`, som är inaktuell mot koden. Antal hör hemma på ett ställe. Rättningen av
  källdokumentet ligger som **P3**.
- **§3:s replik lovade en uppsägningsrätt som inget avtal ger.** Omskriven till vad som gäller i
  dag, med en not om vad den inte lovar.
- **Ny regel i §7 om talad text.** Varje löfte i en replik ska ha en klausul bakom sig. Det var
  den generella bristen bakom replikfelet.
- **§4 fick en rad om att raka frågor besvaras rakt.** Sekvensering är tillåtet, undvikande inte.
- **Regel 7 omskriven.** Symmetri som mönster, inte som figur. Den gamla lydelsen bröts av
  dokumentets egen författare i två versioner i rad.
- **Rabattsatsen borttagen ur §10**, eftersom dokumentets egen underhållsregel förbjuder att
  priser upprepas här.

### Version 1 till version 2, 2026-08-20

Version 1 skrevs 2026-08-20 och granskades samma dag. Sex fel rättades:

- **§1 skrevs om.** Version 1 påstod att rösten var tillgången. Rösten är hur vallgraven syns;
  vallgraven är artefakterna.
- **Löfte 1 var ett utfallspåstående** som föll igenom dokumentets egen bevisregel. Omskrivet
  till mekanism, och fällan generaliserad i §7.
- **"Ärligheten kostar ingenting" var fel.** Priset är nu utskrivet, tillsammans med en gräns
  för när man inte redovisar.
- **Åtgärdslistan var inverterad.** Domänen låg först, exitsvaret sist. Bytt plats, och
  domänmotiveringen är nu markerad som uppskattning.
- **Pilotens pris saknades**, trots att gratiskunden rankades som tredje värsta risk. Avgjort
  i §10.
- **Dokumentet sa "vi" på ställen som ska kopieras till kundmaterial.** §8 skiljer nu på
  internt och kundvänt, och §3 är skrivet i "jag".

Dessutom: version 1:s inledande mening var en perfekt antites, vilket bryter mot dess egen
regel 7.
