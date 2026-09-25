/* The product tour's tabs. Progressive: the markup is a nav of anchors and six
   stacked panels that work with no script at all. This upgrades them to a
   real tablist (roles, roving tabindex, arrow keys) and mirrors the active tab
   in the hash as #tour-<id> so a tab is linkable — the Why strip and the
   role pages deep-link into it. replaceState, never pushState: switching tabs
   must not grow the back stack. Same idiom as apply.js. */
(function () {
  var root = document.querySelector(".tour");
  if (!root) return;
  var nav = root.querySelector(".tour-nav");
  var tabs = [].slice.call(nav.querySelectorAll("a[data-tab]"));
  var panels = [].slice.call(root.querySelectorAll(".tour-panel[data-panel]"));
  if (!tabs.length || tabs.length !== panels.length) return;

  nav.setAttribute("role", "tablist");
  tabs.forEach(function (a) {
    a.setAttribute("role", "tab");
    a.id = "tab-" + a.dataset.tab;
    a.setAttribute("aria-controls", "tour-" + a.dataset.tab);
  });
  panels.forEach(function (p) {
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", "tab-" + p.dataset.panel);
    p.tabIndex = 0;
  });

  function has(id) { return tabs.some(function (t) { return t.dataset.tab === id; }); }
  function fromHash() {
    var m = /^#tour-([a-z]+)$/.exec(location.hash);
    return m && has(m[1]) ? m[1] : null;
  }
  function select(id, opts) {
    opts = opts || {};
    tabs.forEach(function (a) {
      var on = a.dataset.tab === id;
      a.setAttribute("aria-selected", on ? "true" : "false");
      a.tabIndex = on ? 0 : -1;
      if (on && opts.focus) a.focus();
    });
    panels.forEach(function (p) { p.hidden = p.dataset.panel !== id; });
    if (opts.hash && location.hash !== "#tour-" + id) history.replaceState(null, "", "#tour-" + id);
    if (opts.scroll) root.scrollIntoView({ block: "start" });
  }

  tabs.forEach(function (a, i) {
    a.addEventListener("click", function (e) { e.preventDefault(); select(a.dataset.tab, { hash: true }); });
    a.addEventListener("keydown", function (e) {
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(tabs[j].dataset.tab, { hash: true, focus: true });
    });
  });

  /* A link elsewhere on the page (or an inbound URL) names a tab. */
  window.addEventListener("hashchange", function () {
    var id = fromHash();
    if (id) select(id, { scroll: true });
  });

  root.dataset.js = "1";
  var initial = fromHash();
  select(initial || tabs[0].dataset.tab, { scroll: !!initial });
})();
