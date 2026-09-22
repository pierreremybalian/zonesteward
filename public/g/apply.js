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

    function show(n) {
      i = n;
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

    f.addEventListener("submit", function (e) {
      for (var k = 0; k < steps.length; k++) { if (!stepValid(k)) { show(k); return e.preventDefault(); } }
      e.preventDefault();
      submit.disabled = true;
      var was = submit.textContent;
      submit.textContent = "Sending…";
      msg.hidden = true;

      fetch(f.action, { method: "POST", body: new FormData(f), headers: { accept: "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          if (!(d && d.ok)) throw new Error((d && d.error) || "That didn't go through.");
          steps.forEach(function (s) { s.hidden = true; });
          f.querySelector(".step-nav").hidden = true;
          f.querySelector(".steps").hidden = true;
          msg.hidden = false;
          msg.className = "apply-msg good";
          msg.innerHTML = "<b>You're on the list.</b> We read every one of these — if it's a fit you'll hear from us with a workspace.";
        })
        .catch(function (err) {
          submit.disabled = false;
          submit.textContent = was;
          msg.hidden = false;
          msg.className = "apply-msg bad";
          msg.textContent = err.message + " You can also just email us.";
        });
    });

    show(0);
  }
  document.querySelectorAll("form.apply").forEach(setup);
})();
