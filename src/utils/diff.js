// Etapp 8: radbaserad diff (LCS) mellan två textinnehåll. Extraherad ur VersionsHistorik.jsx
// (Etapp 38c) så samma logik kan återanvändas för att visa en ändringsförslags diff innan den
// införs, inte bara för versionshistorik.
export function diffRader(gammal, ny) {
  const a = (gammal ?? "").split("\n");
  const b = (ny ?? "").split("\n");
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const resultat = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      resultat.push({ typ: "lika", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      resultat.push({ typ: "borttagen", text: a[i] });
      i++;
    } else {
      resultat.push({ typ: "tillagd", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    resultat.push({ typ: "borttagen", text: a[i] });
    i++;
  }
  while (j < m) {
    resultat.push({ typ: "tillagd", text: b[j] });
    j++;
  }
  return resultat;
}
