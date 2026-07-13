// Fördefinierade skelett att utgå från när en ny rutin skapas.
export const RUTIN_MALLAR = [
  {
    namn: "Behandlingsrutin",
    innehall: `# Bakgrund

Kort om varför rutinen finns och när den gäller.

# Handläggning

1. Första steget
2. Andra steget
3. Tredje steget

# Varningstecken

- Vad som ska föranleda eskalering/läkarkontakt`,
  },
  {
    namn: "Checklista",
    innehall: `# Syfte

Vad checklistan säkerställer.

# Punkter

- [ ] Punkt 1
- [ ] Punkt 2
- [ ] Punkt 3`,
  },
  {
    namn: "Larmrutin",
    innehall: `# Larmtyp

Vilket larm/situation rutinen gäller.

# Vid larm

1. Vem gör vad, i vilken ordning
2. Vilken utrustning/vilka resurser krävs
3. Vem ska kontaktas`,
  },
];
