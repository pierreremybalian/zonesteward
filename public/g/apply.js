/* Drives every form.apply on the page: three steps, per-step validation,
   fetch submit with a native-post fallback. Classic script, loaded once. */
(function () {
  function setup(f) {
    var steps = Array.prototype.slice.call(f.querySelectorAll(".step"));
    var tabs = Array.prototype.slice.call(f.querySelectorAll("[data-step-tab]"));
    var prev = f.querySelector("[data-prev]");
    var next = f.querySelector("[data-next]");
    var submit = f.querySelector("[data-submit]");
    var note = f.querySelector("[data-note]");
    var msg = f.querySelector(".apply-msg");
    var i = 0;
    var DRAFT = "zs-apply-draft";

    /* /apply/2 means step two. Written on every step change so the URL is
       always the place you are, and read on load so a link or a reload lands
       you back there. /apply/<n> are real pages, so the path is always valid. */
    function onApplyPath() { return /^\/apply(?:\/|$)/.test(location.pathname); }
    function stepFromHash() {
      var m = /^\/apply(?:\/(\d))?\/?$/.exec(location.pathname);
      return m && m[1] ? Math.min(steps.length, Math.max(1, +m[1])) - 1 : null;
    }
    function writeHash(n) {
      var want = "/apply/" + (n + 1);
      if (location.pathname === want) return;
      var st = history.state || {};
      st.apply = true;
      history.replaceState(st, "", want + location.search);
    }

    /* Draft: every answer, saved as it is typed, restored on the next visit,
       cleared on success. Per-browser convenience only — never the record. */
    function saveDraft() {
      try {
        var o = {};
        new FormData(f).forEach(function (v, k) { if (k === "company_url") return; (o[k] = o[k] || []).push(v); });
        localStorage.setItem(DRAFT, JSON.stringify({ t: Date.now(), o: o }));
      } catch (e) {}
    }
    function restoreDraft() {
      try {
        var raw = localStorage.getItem(DRAFT); if (!raw) return false;
        var d = JSON.parse(raw);
        if (!d || Date.now() - d.t > 7 * 864e5) { localStorage.removeItem(DRAFT); return false; }
        var any = false;
        Object.keys(d.o).forEach(function (k) {
          var vals = d.o[k];
          f.querySelectorAll('[name="' + k + '"]').forEach(function (el) {
            if (el.type === "checkbox" || el.type === "radio") el.checked = vals.indexOf(el.value) !== -1;
            else el.value = vals[0] || "";
            if (el.value || el.checked) any = true;
          });
        });
        return any;
      } catch (e) { return false; }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} }
    f.addEventListener("input", saveDraft);
    f.addEventListener("change", saveDraft);

    function show(n, opts) {
      i = n;
      if (!(opts && opts.silent)) writeHash(n);
      steps.forEach(function (s, k) { s.hidden = k !== n; });
      tabs.forEach(function (t, k) {
        t.classList.toggle("done", k < n);
        if (k === n) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current");
      });
      prev.hidden = n === 0;
      next.hidden = n === steps.length - 1;
      submit.hidden = n !== steps.length - 1;
      if (note) note.textContent = n === steps.length - 1 ? "We read every one. No newsletter, no drip." : "Takes about two minutes.";
      var focus = steps[n].querySelector("input, select, textarea");
      if (focus && document.activeElement !== focus) focus.focus({ preventScroll: true });
      steps[n].scrollIntoView({ block: "nearest" });
    }

    /* Validate only the fields on the visible step, and show the browser's own
       message on the first bad one. reportValidity on the whole form would
       point at a field the user cannot see. */
    function stepValid(n) {
      var fields = steps[n].querySelectorAll("input, select, textarea");
      for (var k = 0; k < fields.length; k++) {
        var el = fields[k];
        if (el.type === "radio") {
          var group = steps[n].querySelectorAll('input[name="' + el.name + '"]');
          var any = Array.prototype.some.call(group, function (r) { return r.checked; });
          if (el.required && !any) { group[0].reportValidity(); return false; }
          continue;
        }
        if (!el.checkValidity()) { el.reportValidity(); return false; }
      }
      return true;
    }

    next.addEventListener("click", function () { if (stepValid(i)) show(i + 1); });
    prev.addEventListener("click", function () { show(i - 1); });

    // Enter inside a text field on a non-final step means "continue", not "submit"
    f.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && !submit.hidden === false) {
        e.preventDefault(); next.click();
      }
    });

    /* Read the answers back from the DOM so the receipt uses the same words the
       applicant just saw — no second copy of the option labels to drift. */
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function answers() {
      var rows = [];
      function text(name) { var el = f.querySelector('[name="' + name + '"]'); return el && el.value.trim(); }
      function pick(name) {
        var el = f.querySelector('select[name="' + name + '"]');
        return el && el.value ? el.options[el.selectedIndex].text : "";
      }
      function many(name) {
        return Array.prototype.map.call(f.querySelectorAll('input[name="' + name + '"]:checked'), function (c) {
          var l = c.closest("label"); return l ? l.textContent.trim() : c.value;
        }).join(", ");
      }
      function row(k, v, cls) { if (v) rows.push({ k: k, v: v, cls: cls || "" }); }
      row("Name", text("name")); row("Email", text("email")); row("Company", text("company")); row("Website", text("site"));
      row("Zones", pick("zones")); row("Monthly requests", pick("traffic")); row("Plans", many("plans"));
      row("Time goes on", many("focus")); row("Managed by", pick("role")); row("Anthropic key", pick("anthropic"));
      row("What goes wrong", text("today"), "long");
      row("The beta trade", f.querySelector('input[name="agreed"]:checked') ? "Agreed — monthly questions, two calls, honest feedback" : "");
      return rows;
    }

    function receipt(rows) {
      var email = (rows.filter(function (r) { return r.k === "Email"; })[0] || {}).v || "you";
      var when = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      var html = '<div class="done">' +
        '<span class="sc">Application received · ' + esc(when) + "</span>" +
        '<h2 class="done-title">You\u2019re on the list.</h2>' +
        '<p class="done-lede">Here\u2019s what you told us. We read every one of these ourselves, usually within a few days.</p>' +
        '<dl class="receipt">';
      rows.forEach(function (r) {
        html += '<div class="rr' + (r.cls ? " " + r.cls : "") + '"><dt>' + esc(r.k) + "</dt><dd>" + esc(r.v) + "</dd></div>";
      });
      html += "</dl>" +
        '<div class="next"><span class="sc">What happens next</span><ol>' +
        "<li>We read it. A person, not a filter.</li>" +
        "<li>If it\u2019s a fit, an invitation lands at <b>" + esc(email) + "</b> with your workspace ready.</li>" +
        "<li>If it isn\u2019t yet, we\u2019ll say so, and why.</li>" +
        "</ol></div>" +
        '<p class="done-foot">Need to change something? Reply to the confirmation, or write to <a href="mailto:hello@zonesteward.com">hello@zonesteward.com</a>.</p>' +
        '<p class="done-actions"><a href="/" class="btn btn-ghost">Back to the site</a>' +
        (document.getElementById("apply-dlg") ? ' <button type="button" class="btn btn-primary" data-done-close>Done</button>' : "") +
        "</p></div>";
      return html;
    }

    f.addEventListener("submit", function (e) {
      for (var k = 0; k < steps.length; k++) { if (!stepValid(k)) { show(k); return e.preventDefault(); } }
      e.preventDefault();
      var rows = answers();
      submit.disabled = true;
      var was = submit.textContent;
      submit.textContent = "Sending\u2026";
      msg.hidden = true;

      fetch(f.action, { method: "POST", body: new FormData(f), headers: { accept: "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          if (!(d && d.ok)) throw new Error((d && d.error) || "That didn\u2019t go through.");
          steps.forEach(function (s) { s.hidden = true; });
          f.querySelector(".step-nav").hidden = true;
          f.querySelector(".steps").hidden = true;
          msg.hidden = false;
          msg.className = "apply-msg good";
          msg.innerHTML = receipt(rows);
          clearDraft();
          var st = history.state || {}; st.apply = true;
          history.replaceState(st, "", "/apply/done" + location.search);
          var dc = msg.querySelector("[data-done-close]");
          if (dc) dc.addEventListener("click", function () { var d = document.getElementById("apply-dlg"); if (d) d.close(); });
          msg.scrollIntoView({ block: "start" });
        })
        .catch(function (err) {
          submit.disabled = false;
          submit.textContent = was;
          msg.hidden = false;
          msg.className = "apply-msg bad";
          msg.textContent = err.message + " You can also just email us.";
        });
    });

    /* Land on the step in the URL, but never past the first step that would
       not validate — a deep link into step three with an empty step one is
       a dead end, not a shortcut. */
    function landOn(target) {
      var n = 0;
      while (n < target && stepValidQuiet(n)) n++;
      show(n);
    }
    function stepValidQuiet(n) {
      var fields = steps[n].querySelectorAll("input, select, textarea");
      for (var k = 0; k < fields.length; k++) {
        var el = fields[k];
        if (el.type === "radio") {
          if (el.required && !steps[n].querySelector('input[name="' + el.name + '"]:checked')) return false;
          continue;
        }
        if (!el.checkValidity()) return false;
      }
      return true;
    }
    var resumed = restoreDraft();
    var fromHash = stepFromHash();
    if (fromHash !== null) landOn(fromHash);
    else if (resumed) { landOn(steps.length - 1); }
    else show(0, { silent: !onApplyPath() });
    if (resumed && note) note.textContent = "Picked up where you left off.";

    addEventListener("popstate", function () {
      var n = stepFromHash();
      if (n !== null && n !== i) landOn(n);
    });
  }
  document.querySelectorAll("form.apply").forEach(setup);
})();
