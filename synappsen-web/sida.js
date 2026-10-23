  // Markera aktuell sektion i BÅDA registren (sidokolumnen och mobilflikarna).
  var lankar = Array.prototype.slice.call(
    document.querySelectorAll(".index a, .topp__index a")
  );
  var idn = lankar.map(function (a) { return a.getAttribute("href"); });
  var unika = idn.filter(function (v, i) { return idn.indexOf(v) === i; });
  var sektioner = unika
    .map(function (h) { return document.querySelector(h); })
    .filter(Boolean);

  if (window.IntersectionObserver && sektioner.length) {
    var aktiv = new IntersectionObserver(function (poster) {
      poster.forEach(function (post) {
        if (!post.isIntersecting) return;
        lankar.forEach(function (a) {
          a.setAttribute(
            "aria-current",
            a.getAttribute("href") === "#" + post.target.id ? "true" : "false"
          );
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sektioner.forEach(function (s) { aktiv.observe(s); });
  }

  // Kopiera e-postadressen. Knappen är dold i markupen och visas bara om webbläsaren
  // faktiskt kan skriva till urklipp (kräver https), annars finns adressen som vanlig text.
  var kopieraKnappar = Array.prototype.slice.call(document.querySelectorAll("[data-kopiera]"));
  if (navigator.clipboard && window.isSecureContext) {
    kopieraKnappar.forEach(function (knapp) {
      knapp.hidden = false;
      var besked = knapp.parentNode.querySelector(".kopierat");
      var tid;
      knapp.addEventListener("click", function () {
        navigator.clipboard.writeText(knapp.getAttribute("data-kopiera")).then(
          function () { visa("Kopierad"); },
          function () { visa("Kunde inte kopiera, markera adressen i stället"); }
        );
      });
      function visa(text) {
        if (!besked) return;
        besked.textContent = text;
        clearTimeout(tid);
        tid = setTimeout(function () { besked.textContent = ""; }, 3000);
      }
    });
  }

// Utskrift och "Spara som PDF": bilder med loading="lazy" som inte scrollats fram är ännu
// inte hämtade och blir tomma rutor på papperet. Hämta dem innan utskriften byggs.
window.addEventListener("beforeprint", function () {
  Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (bild) {
    bild.loading = "eager";
  });
});
