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
