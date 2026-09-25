/* Screenshots open full-size in a <dialog>. Any figure.plate whose plate-in
   holds an image becomes a button; the dialog shows the largest candidate in
   the picture's srcset (the AVIF or WebP the browser would pick at 1600px),
   with the figcaption as its caption. Escape, ×, backdrop click all close.
   No history entry — a zoomed image is not a place. */
(function () {
  var plates = [].slice.call(document.querySelectorAll("figure.plate .plate-in"));
  plates = plates.filter(function (p) { return p.querySelector("img"); });
  if (!plates.length) return;

  var dlg = document.createElement("dialog");
  dlg.className = "lb";
  dlg.innerHTML = '<button type="button" class="lb-close" aria-label="Close">×</button><img alt=""><p class="lb-cap"></p>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector("img"), cap = dlg.querySelector(".lb-cap");

  function largest(picture) {
    var best = null, bestW = 0;
    var sources = picture ? [].slice.call(picture.querySelectorAll("source")) : [];
    sources.forEach(function (s) {
      (s.srcset || "").split(",").forEach(function (c) {
        var m = /(\S+)\s+(\d+)w/.exec(c.trim());
        if (m && +m[2] > bestW) { bestW = +m[2]; best = m[1]; }
      });
    });
    return best;
  }

  function open(plate) {
    var i = plate.querySelector("img");
    var src = largest(plate.querySelector("picture")) || i.currentSrc || i.src;
    img.src = src; img.alt = i.alt || "";
    var fc = plate.parentElement.querySelector("figcaption");
    cap.textContent = fc ? [].map.call(fc.children.length ? fc.children : [fc], function (n) { return n.textContent.trim(); }).filter(Boolean).join(" \u00b7 ") : "";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("dlg-open");
  }
  function close() {
    if (dlg.open) dlg.close();
  }
  dlg.addEventListener("close", function () { document.documentElement.classList.remove("dlg-open"); img.removeAttribute("src"); });
  dlg.querySelector(".lb-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });

  plates.forEach(function (p) {
    p.classList.add("zoomable");
    p.setAttribute("role", "button");
    p.tabIndex = 0;
    p.setAttribute("aria-label", "View full size");
    p.addEventListener("click", function () { open(p); });
    p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(p); } });
  });
})();
