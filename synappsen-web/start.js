// Laddas bara av startsidan (index.html).
//
// Före 2026-10-23 var vårdsidan startsida, och länkar med ankare (synappsen.se/#paket,
// synappsen.se/#pilot) har gått ut i säljutskick. Startsidan är nu ett vägval utan de
// ankarna, så en sådan länk skickas vidare till vårdsidan med samma ankare. Ett ankare
// tas aldrig emot av servern, så det här kan inte göras med en redirect i firebase.json.
(function () {
  var ankare = window.location.hash;
  if (ankare && ankare !== "#huvudinnehall") {
    window.location.replace("/vard" + ankare);
  }
})();
