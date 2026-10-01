/* Disclosure menus (<details data-menu>): close on outside click, on Escape,
   and when another menu opens. Works without this file; it's only polish. */
(function () {
  var menus = [].slice.call(document.querySelectorAll("details[data-menu]"));
  if (!menus.length) return;
  document.addEventListener("click", function (e) {
    menus.forEach(function (m) { if (m.open && !m.contains(e.target)) m.open = false; });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    menus.forEach(function (m) {
      if (m.open) { m.open = false; var s = m.querySelector("summary"); if (s) s.focus(); }
    });
  });
  menus.forEach(function (m) {
    m.addEventListener("toggle", function () {
      if (m.open) menus.forEach(function (o) { if (o !== m) o.open = false; });
    });
  });
})();
