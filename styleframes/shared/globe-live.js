/* Zonesteward — the live stage globe.
 *
 * The 157 real Cloudflare PoPs from shared/globe.js, the Natural Earth
 * coastline from shared/land.js, drawn to a rotating canvas in four layers
 * that each mean something:
 *
 *   coast     where the land is, so the sphere reads as Earth and not a ball
 *   mesh      all 157 PoPs, dim. The network. Always complete.
 *   live      the colos that actually served this zone in the window
 *   arcs      colo -> origin. A request that missed cache and reached the box.
 *
 * Arcs are deliberately sparse. Most requests never leave the edge, so an arc
 * is an event, not decoration — and that is the honest picture of a CDN.
 *
 * Classic script, not a module: Chrome blocks module scripts over file://, and
 * these frames are meant to be opened straight off disk. Everything is scoped
 * in an IIFE because shared/globe.js already owns `project` and `d2r` at the
 * top level, and a redeclaration is a SyntaxError that kills the whole file.
 */

(function () {

const d2r = (d) => (d * Math.PI) / 180;

/* lat/lng -> unit vector, +z toward the camera at (0,0) */
function vec(lat, lng) {
  const p = d2r(lat), l = d2r(lng), cp = Math.cos(p);
  return [cp * Math.sin(l), Math.sin(p), cp * Math.cos(l)];
}

/* spin the sphere so (viewLat, viewLng) faces the camera */
function rot(v, l0, p0) {
  const cl = Math.cos(l0), sl = Math.sin(l0);
  const x = v[0] * cl - v[2] * sl;
  const z1 = v[0] * sl + v[2] * cl;
  const cp = Math.cos(p0), sp = Math.sin(p0);
  return [x, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
}

/** @param k radial lift: 1 sits on the surface, >1 floats above it */
function scr(v, R, k) {
  return { x: R + v[0] * R * k, y: R - v[1] * R * k, z: v[2] };
}

/* great-circle interpolation, for arcs that follow the surface */
function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const w = Math.acos(dot);
  if (w < 1e-6) return a;
  const s = Math.sin(w);
  const k0 = Math.sin((1 - t) * w) / s, k1 = Math.sin(t * w) / s;
  return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
}

/**
 * @param {HTMLCanvasElement} cv
 * @param {object} opts
 *   pops    [{c,lat,lng}]        the full mesh (required)
 *   land    [[[lng,lat],…],…]    coastline polylines
 *   live    {COLO: weight 0..1}  colos with traffic in the window
 *   origin  {lat,lng,label}      where cache misses land
 *   spin    degrees per second   (0 disables rotation)
 */
function liveGlobe(cv, opts = {}) {
  const pops = opts.pops || [];
  const landData = opts.land || null;
  const coast = (landData && landData.lines) || [];
  /* Decode the land bitmask into unit vectors once. Projecting 3000 cells a
     frame is cheap; decoding base64 every frame would not be. */
  const stipple = [];
  if (landData && landData.grid) {
    const g = landData.grid, raw = atob(g.bits);
    for (let y = 0; y < g.h; y++) {
      const la = 90 - (y + 0.5) * (180 / g.h);
      for (let x = 0; x < g.w; x++) {
        const b = y * g.w + x;
        if (!(raw.charCodeAt(b >> 3) & (128 >> (b & 7)))) continue;
        stipple.push(vec(la, -180 + (x + 0.5) * (360 / g.w)));
      }
    }
  }
  const origin = opts.origin || null;
  const viewLat = opts.viewLat ?? 18;
  const spin = opts.spin ?? 2.6;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let live = opts.live || {};
  let lng = opts.viewLng ?? -40;
  let raf = 0, last = performance.now(), size = 0, R = 0;
  const ctx = cv.getContext("2d");

  const arcs = [], ripples = [];
  let arcClock = 0, ripClock = 0;
  const oVec = origin ? vec(origin.lat, origin.lng) : null;

  function resize() {
    size = Math.max(1, Math.round(cv.getBoundingClientRect().width));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = size * dpr;
    cv.height = size * dpr;
    cv.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = size / 2;
  }

  function sphere() {
    const g = ctx.createRadialGradient(R * 0.62, R * 0.52, R * 0.05, R, R, R);
    g.addColorStop(0, "#2a2a34");
    g.addColorStop(0.55, "#191921");
    g.addColorStop(1, "#0a0a0e");
    ctx.beginPath();
    ctx.arc(R, R, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function atmosphere() {
    const g = ctx.createRadialGradient(R, R, R * 0.975, R, R, R * 1.022);
    g.addColorStop(0, "rgba(246,130,31,0)");
    g.addColorStop(0.45, "rgba(246,130,31,.16)");
    g.addColorStop(1, "rgba(246,130,31,0)");
    ctx.beginPath();
    ctx.arc(R, R, R * 1.022, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function polylines(lines, l0, p0, stroke, width) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    for (const line of lines) {
      ctx.beginPath();
      let on = false;
      for (const pair of line) {
        const q = scr(rot(vec(pair[1], pair[0]), l0, p0), R, 1);
        if (q.z <= 0.01) { on = false; continue; }
        if (on) ctx.lineTo(q.x, q.y);
        else { ctx.moveTo(q.x, q.y); on = true; }
      }
      ctx.stroke();
    }
  }

  function graticule(l0, p0) {
    const lines = [];
    for (let la = -60; la <= 60; la += 30) {
      const row = [];
      for (let lo = -180; lo <= 180; lo += 4) row.push([lo, la]);
      lines.push(row);
    }
    for (let lo = -180; lo < 180; lo += 30) {
      const col = [];
      for (let la = -88; la <= 88; la += 4) col.push([lo, la]);
      lines.push(col);
    }
    polylines(lines, l0, p0, "rgba(150,150,170,.10)", 1);
  }

  function spawnArc(hot) {
    if (!oVec || !hot.length) return;
    /* Uniform, not traffic-weighted: weighting buries every arc in the
       North American cluster a couple of degrees from the origin, and the
       long routes are the ones worth drawing. */
    const h = hot[(Math.random() * hot.length) | 0];
    arcs.push({ from: vec(h.p.lat, h.p.lng), t: 0 });
  }

  function drawArc(a, l0, p0) {
    const N = 44, head = Math.min(1, a.t / 1.15), tail = Math.max(0, head - 0.42);
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      if (t < tail || t > head) { prev = null; continue; }
      const v = rot(slerp(a.from, oVec, t), l0, p0);
      const lift = 1 + 0.055 * Math.sin(Math.PI * t);
      const q = scr(v, R, lift);
      if (q.z <= 0.015) { prev = null; continue; }
      if (prev) {
        const near = (t - tail) / 0.42;
        const fade = Math.min(1, q.z * 1.6) * (0.35 + 0.65 * near) * (1 - a.t / 2.4);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = "rgba(255,196,124," + Math.max(0, fade).toFixed(3) + ")";
        ctx.lineWidth = 1.9;
        ctx.stroke();
      }
      prev = q;
    }
    /* the head, so the eye can follow one request */
    if (head < 1) {
      const v = rot(slerp(a.from, oVec, head), l0, p0);
      const q = scr(v, R, 1 + 0.055 * Math.sin(Math.PI * head));
      if (q.z > 0.015) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,226,196,.95)";
        ctx.fill();
      }
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) lng -= spin * dt;
    if (lng < -180) lng += 360;
    const l0 = d2r(lng), p0 = d2r(viewLat);

    ctx.clearRect(0, 0, size, size);
    atmosphere();
    sphere();
    graticule(l0, p0);

    /* Land as stipple. An outlined sphere reads as a black ball; a stippled
       one reads as Earth. Bucketed by depth so the whole field is four fills
       rather than three thousand. */
    const BUCKETS = [[], [], [], []];
    for (const v of stipple) {
      const q = scr(rot(v, l0, p0), R, 1);
      if (q.z <= 0.04) continue;
      BUCKETS[Math.min(3, (q.z * 4) | 0)].push(q);
    }
    const ALPHA = [".07", ".13", ".19", ".25"];
    for (let b = 0; b < 4; b++) {
      if (!BUCKETS[b].length) continue;
      ctx.fillStyle = "rgba(196,204,226," + ALPHA[b] + ")";
      ctx.beginPath();
      for (const q of BUCKETS[b]) ctx.rect(q.x - 0.85, q.y - 0.85, 1.7, 1.7);
      ctx.fill();
    }
    polylines(coast, l0, p0, "rgba(206,214,236,.30)", 1);

    /* mesh first, live colos after, so a live dot always wins the pixel */
    const hot = [];
    for (const p of pops) {
      const q = scr(rot(vec(p.lat, p.lng), l0, p0), R, 1);
      if (q.z <= 0.02) continue;
      const w = live[p.c];
      if (w !== undefined) { hot.push({ p: p, q: q, w: w }); continue; }
      ctx.beginPath();
      ctx.arc(q.x, q.y, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(246,130,31," + (0.3 + 0.42 * q.z).toFixed(3) + ")";
      ctx.fill();
    }

    for (const h of hot) {
      const q = h.q, depth = 0.55 + 0.45 * q.z, r = 2.6 + 3.2 * h.w;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 5.5);
      g.addColorStop(0, "rgba(246,130,31," + (0.42 * depth).toFixed(3) + ")");
      g.addColorStop(1, "rgba(246,130,31,0)");
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 5.5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,208,160," + depth.toFixed(3) + ")";
      ctx.fill();
    }

    if (!reduced) {
      arcClock += dt;
      if (arcClock > 0.42) { arcClock = 0; spawnArc(hot); }
      for (let i = arcs.length - 1; i >= 0; i--) {
        arcs[i].t += dt;
        if (arcs[i].t > 1.9) { arcs.splice(i, 1); continue; }
        drawArc(arcs[i], l0, p0);
      }

      ripClock += dt;
      if (ripClock > 0.5 && hot.length) {
        ripClock = 0;
        const total = hot.reduce(function (s, h) { return s + h.w; }, 0);
        let pick = Math.random() * total;
        for (const h of hot) { pick -= h.w; if (pick <= 0) { ripples.push({ p: h.p, t: 0 }); break; } }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += dt;
        if (rp.t > 1.5) { ripples.splice(i, 1); continue; }
        const q = scr(rot(vec(rp.p.lat, rp.p.lng), l0, p0), R, 1);
        if (q.z <= 0.02) continue;
        const k = rp.t / 1.5;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3 + k * 28, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(246,130,31," + (0.5 * (1 - k) * q.z).toFixed(3) + ")";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    /* the origin last: the one thing on the sphere that is not Cloudflare */
    if (oVec) {
      const q = scr(rot(oVec, l0, p0), R, 1);
      if (q.z > 0.02) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, 4.6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,.72)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        if (origin.label) {
          ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
          ctx.fillStyle = "rgba(255,255,255,.66)";
          ctx.fillText(origin.label, q.x + 10, q.y + 3.5);
        }
      }
    }

    raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", resize, { passive: true });
  raf = requestAnimationFrame(frame);

  return {
    setLive: function (next) { live = next || {}; },
    stop: function () { cancelAnimationFrame(raf); },
  };
}

window.liveGlobe = liveGlobe;

})();
