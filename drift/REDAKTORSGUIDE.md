# Redaktörsguide

**Syfte:** förberett material inför Etapp 52 (`etapplaner/ETAPPLAN10.md`, pilotpaketet) – en kort guide
att ge en riktig redaktör (sektionsledare, VÖL, VEC eller förrådsansvarig) INNAN en pilot körs,
så personen inte behöver upptäcka funktionerna på egen hand under sitt första riktiga pass.
Bygger vidare på `src/pages/Hjalp.jsx` (allmän hjälp för alla roller) – dubblerar inte den,
utan fördjupar de delar som bara gäller redaktörsrollen. Skriven 2026-08-11 (Etapp 63b,
`etapplaner/ETAPPLAN12.md`) som förberedelse, inte som resultat av en genomförd pilot.

## Vem är det här för?

Du som har rätt att skapa, redigera eller godkänna innehåll i Kliniskt stöd, Logistik eller
Administration – d.v.s. rollerna Sektionsledare, VÖL, VEC eller Förrådsansvarig. Superadmin
har allt detta plus adminpanelen (se separat genomgång vid behov, den täcks inte här).

## Skapa och redigera en rutin

1. Öppna sektionen (Kliniskt stöd eller Administration) och tryck **"Lägg till ny rutin"**.
2. Fyll i titel, innehåll (stöder enkel formatering – rubriker, punktlistor, fetstil),
   eventuella referenser och taggar.
3. **Checklistläge** (valfritt): lägg till konkreta steg istället för löpande text, om rutinen
   är en åtgärdskedja snarare än bakgrundsinformation. Varje steg kan ha en egen bild och en
   varningstext.
4. **Ägare:** sätt alltid en ägare (en roll eller en specifik person) om du vet vem som ansvarar
   för innehållets aktualitet. Rutiner utan ägare flaggas i adminpanelens innehållshälsa och
   går inte att inkludera i en granskningsrundas automatiska påminnelser.
5. Spara. Om din roll kräver godkännande från någon annan skapas rutinen som ett **utkast** –
   den syns bara för redaktörer tills den godkänns.

## Godkänna, granska, arkivera

- **Utkastkön** visas överst i sektionen om du har godkännarrätt. Godkänn eller neka enskilt,
  eller flera på en gång via "Markera flera".
- **"Markera som granskad"** uppdaterar rutinens granskningsdatum – gör detta varje gång du
  bekräftat att innehållet fortfarande stämmer, annars flaggas rutinen som "bör granskas"
  efter ca 180 dagar.
- **Granskningsrundor** (adminpanelen, superadmin): ett sätt att be flera redaktörer granska
  en samling äldre rutiner samtidigt, med en gemensam deadline.
- **Arkivera** en rutin som inte längre gäller men som ska finnas kvar sökbar i historiken
  (skiljer sig från att ta bort den helt, vilket flyttar den till papperskorgen).

## Ändringsförslag från personal

Vem som helst kan föreslå en ändring direkt på en rutin utan att kunna redigera den själv.
Förslaget visas för dig som ett separat kort under rutinen. **"Inför"** öppnar redigeraren med
förslaget färdiginfogat som ett citat – granska/justera/städa bort markeringen precis som vid
vilken annan redigering som helst, förslaget markeras "infört" först när du faktiskt sparar.
**"Avvisa"** kräver en kort motivering som visas för den som föreslog ändringen.

## Läskvittering med deadline

Om en rutin är viktig nog att alla behöver bekräfta att de läst den, sätt en kvitteringsfrist.
Adminpanelen visar vilka som inte kvitterat i tid.

## Nya genvägar (byggda 2026-08-11, Etapp 62)

- **Veckopulsen** (adminpanelen, öppen som standard högst upp): en samlad "vad är värt att
  göra först"-lista – utgångna rutiner, obesvarade ändringsförslag och sökningar utan träffar,
  var och en med en direktlänk. Ett bra ställe att börja varje vecka.
- **"Skapa rutin" från en sökning utan träff:** i adminpanelens "Sökningar utan träffar"-lista
  finns nu en knapp per sökning som öppnar rutinformuläret med sökordet redan ifyllt som
  titel – den snabbaste vägen att täcka en kunskapslucka någon faktiskt efterfrågat.
- **Tilldela ägare direkt** i innehållshälsans "behöver uppmärksamhet"-tabell, utan att öppna
  hela rutinformuläret.

## Vanliga misstag

- **Patientuppgifter:** skriv aldrig personnummer, namn på patienter eller annat som kan
  identifiera en enskild patient i en rutintext. Appen varnar automatiskt om ett mönster som
  liknar ett personnummer upptäcks, men varningen är ett skyddsnät, inte en garanti.
- **Källor:** länkar till externa källor accepteras bara från en godkänd lista med
  myndighets-/kunskapsdomäner (t.ex. 1177, Socialstyrelsen) – en länk till en annan domän
  avvisas med en förklaring om varför.
- **Utgångsdatum:** sätt ett utgångsdatum bara för innehåll som faktiskt SKA sluta gälla vid
  ett känt datum (t.ex. ett säsongsbeslut) – inte som en påminnelse om att granska, det är vad
  granskningsdatumet är till för.

---

*Se `etapplaner/ETAPPLAN10.md` Etapp 52 och `saljmaterial/PILOTUPPLAGG.md` för hur den här guiden används i en
kommande pilot.*
