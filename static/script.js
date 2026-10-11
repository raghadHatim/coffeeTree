(function () {
  var svg = document.getElementById('tree');
  if (!svg) return;   // pages without the tree (like the shop) skip this part
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mq = window.matchMedia('(max-width: 820px), (max-aspect-ratio: 1/1)');
  function setPAR() { svg.setAttribute('preserveAspectRatio', mq.matches ? 'xMaxYMin slice' : 'xMaxYMin meet'); }
  setPAR();
  if (mq.addEventListener) mq.addEventListener('change', setPAR);

  if (window.matchMedia('(hover: none)').matches) {
    document.getElementById('hint').textContent = 'Drag a finger through the branches.';
  }

  /* ---------- helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20261010);
  function R(a, b) { return a + (b - a) * rnd(); }
  function f(n) { return +n.toFixed(1); }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function cr(a, b, c, d, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }
  function catmull(pts, steps) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        out.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function resample(pts, step) {
    var cum = [0], i;
    for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var L = cum[cum.length - 1];
    var n = Math.max(2, Math.round(L / step));
    var out = [], j = 1;
    for (var k = 0; k <= n; k++) {
      var s = L * k / n;
      while (j < pts.length - 1 && cum[j] < s) j++;
      var u = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
      out.push({ x: pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, y: pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u, s: s });
    }
    for (i = 0; i < out.length; i++) {
      var a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
      out[i].a = Math.atan2(b.y - a.y, b.x - a.x);
    }
    return { dense: out, L: L, n: n };
  }

  /* ---------- layers ---------- */
  var gBack = el('g', {}, svg);
  var gBranch = el('g', {}, svg);
  var gBerry = el('g', {}, svg);
  var gFront = el('g', {}, svg);

  var items = [];

  function pickLeafGrad() {
    var r = rnd();
    if (r < .22) return 0;
    if (r < .42) return 1;
    if (r < .58) return 2;
    if (r < .74) return 3;
    if (r < .86) return 4;
    return 5;
  }
  function pickBerryGrad() {
    var r = rnd();
    if (r < .36) return 0;
    if (r < .66) return 1;
    if (r < .86) return 2;
    return 3;
  }

  /* ---------- leaf ---------- */
  function makeLeaf(parent, px, py, angDeg, len) {
    var g = el('g', { transform: 'translate(' + f(px) + ' ' + f(py) + ') rotate(' + f(angDeg) + ')' }, parent);
    var W = len * 0.29, asym = R(-.12, .12), Wt = W * (1 + asym), Wb = W * (1 - asym), b = len * R(-.07, .07);
    var d = 'M0 0C' + f(.18 * len) + ' ' + f(-Wt) + ' ' + f(.62 * len) + ' ' + f(-Wt * 1.05 + b * .6) + ' ' + f(len) + ' ' + f(b) +
      'C' + f(.62 * len) + ' ' + f(Wb * 1.05 + b * .6) + ' ' + f(.18 * len) + ' ' + f(Wb) + ' 0 0Z';
    el('path', { d: 'M-6 0L0 0', stroke: '#4b2a1b', 'stroke-width': 1.8, 'stroke-linecap': 'round', fill: 'none' }, g);
    el('path', { d: d, fill: 'url(#lg' + pickLeafGrad() + ')' }, g);
    var vd = '';
    for (var i = 1; i <= 5; i++) {
      var x = len * (.1 + .155 * i), ym = b * Math.pow(x / len, 2), x2 = x + len * .14, k = (.74 - i * .09);
      vd += 'M' + f(x) + ' ' + f(ym) + 'L' + f(x2) + ' ' + f(ym - Wt * k) + 'M' + f(x) + ' ' + f(ym) + 'L' + f(x2) + ' ' + f(ym + Wb * k);
    }
    el('path', { d: vd, stroke: 'rgba(205,225,160,.22)', 'stroke-width': .8, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M0 0Q' + f(.5 * len) + ' ' + f(b * .2) + ' ' + f(len * .97) + ' ' + f(b * .97), stroke: 'rgba(205,225,160,.5)', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round' }, g);
    items.push({
      g: g, px: px, py: py, rot0: angDeg, dir0: angDeg * Math.PI / 180,
      ang: 0, vel: 0, ang2: 0, vel2: 0,
      k: R(.085, .125), damp: R(.935, .955), fl: 1, gain: .7 + len / 110, moved: false
    });
  }

  /* ---------- berry ---------- */
  function makeBerry(px, py, ox, oy, r) {
    var g = el('g', { transform: 'translate(' + f(px) + ' ' + f(py) + ') rotate(0)' }, gBerry);
    el('line', { x1: 0, y1: 0, x2: f(ox), y2: f(oy), stroke: '#6b4a2f', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: f(ox), cy: f(oy), r: f(r), fill: 'url(#bg' + pickBerryGrad() + ')' }, g);
    el('ellipse', { cx: f(ox - r * .3), cy: f(oy - r * .38), rx: f(r * .3), ry: f(r * .18), fill: 'rgba(255,255,255,.42)', transform: 'rotate(-30 ' + f(ox - r * .3) + ' ' + f(oy - r * .38) + ')' }, g);
    items.push({
      g: g, px: px, py: py, rot0: 0, dir0: Math.atan2(oy, ox),
      ang: 0, vel: 0, ang2: 0, vel2: 0,
      k: R(.07, .105), damp: R(.93, .95), fl: .5, gain: 1.15, moved: false
    });
  }

  /* ---------- branches ---------- */
  function widthAt(br, t) { return br.w1 + (br.w0 - br.w1) * Math.pow(1 - t, 1.25); }

  function branch(key, w0, w1, parent, size) {
    if (parent) {
      var best = 1e9, bp = null;
      parent.dense.forEach(function (p) {
        var d = Math.hypot(p.x - key[0][0], p.y - key[0][1]);
        if (d < best) { best = d; bp = p; }
      });
      key[0] = [bp.x, bp.y];
    }
    var rs = resample(catmull(key, 16), 4);
    var br = { dense: rs.dense, L: rs.L, n: rs.n, w0: w0, w1: w1, size: size || 1 };
    var left = [], right = [];
    br.dense.forEach(function (p) {
      var t = p.s / br.L, h = widthAt(br, t) / 2, nx = -Math.sin(p.a), ny = Math.cos(p.a);
      left.push(f(p.x + nx * h) + ' ' + f(p.y + ny * h));
      right.push(f(p.x - nx * h) + ' ' + f(p.y - ny * h));
    });
    el('path', { d: 'M' + left.join('L') + 'L' + right.reverse().join('L') + 'Z', fill: '#4b2a1b' }, gBranch);
    var hl = [], avg = (w0 + w1) / 2;
    br.dense.forEach(function (p) {
      var t = p.s / br.L;
      if (t > .85) return;
      var h = widthAt(br, t), nx = -Math.sin(p.a), ny = Math.cos(p.a);
      hl.push(f(p.x - nx * h * .2) + ' ' + f(p.y - ny * h * .2));
    });
    el('path', { d: 'M' + hl.join('L'), fill: 'none', stroke: '#9a7352', 'stroke-opacity': .5, 'stroke-width': Math.max(1, avg * .16), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gBranch);
    var tip = br.dense[br.dense.length - 1];
    el('circle', { cx: f(tip.x), cy: f(tip.y), r: Math.max(1, w1 / 2), fill: '#4b2a1b' }, gBranch);
    return br;
  }

  function at(br, s) {
    var i = Math.min(br.n, Math.max(0, Math.round(s / br.L * br.n)));
    var p = br.dense[i], t = s / br.L;
    return { x: p.x, y: p.y, a: p.a, t: t, w: widthAt(br, t) };
  }

  function dress(br, startFrac, gapMin, gapMax, berryChance) {
    var s = br.L * startFrac;
    while (s < br.L - 8) {
      var n = at(br, s);
      var nx = -Math.sin(n.a), ny = Math.cos(n.a);
      el('circle', { cx: f(n.x), cy: f(n.y), r: f(n.w * .62 + .4), fill: '#4b2a1b' }, gBranch);
      for (var side = -1; side <= 1; side += 2) {
        var ang = n.a + side * R(46, 80) * Math.PI / 180;
        var vx = Math.cos(ang), vy = Math.sin(ang) + 0.3;
        ang = Math.atan2(vy, vx);
        var len = (116 - 62 * Math.pow(n.t, .9)) * R(.85, 1.15) * br.size;
        makeLeaf(rnd() < .5 ? gBack : gFront, n.x + nx * side * n.w * .4, n.y + ny * side * n.w * .4, ang * 180 / Math.PI, len);
      }
      if (n.t > .12 && rnd() < berryChance) {
        var cnt = Math.floor(R(7, 14)), cl = [];
        for (var k = 0; k < cnt; k++) {
          var r = R(5, 31), th = R(0, Math.PI * 2);
          cl.push({ ox: Math.cos(th) * r, oy: Math.sin(th) * r * .9 + 6, rad: R(6.4, 8.8) * (1 - .15 * n.t) });
        }
        cl.sort(function (a, b) { return a.oy - b.oy; });
        cl.forEach(function (c) { makeBerry(n.x, n.y, c.ox, c.oy, c.rad); });
      }
      s += R(gapMin, gapMax);
    }
    var tip = br.dense[br.dense.length - 1];
    [-34, 0, 34].forEach(function (o) {
      var ang = (tip.a * 180 / Math.PI) + o + R(-6, 6);
      makeLeaf(rnd() < .5 ? gBack : gFront, tip.x, tip.y, ang, R(40, 58) * br.size);
    });
  }

  /* tree: enters from the top-right corner and sweeps down and to the left */
  var M = branch([[990, -50], [890, 50], [800, 140], [705, 220], [605, 285], [500, 350], [400, 420], [300, 500], [215, 585]], 32, 3, null, 1);
  var A = branch([[850, 90], [770, 62], [680, 44], [590, 36], [500, 46], [415, 78]], 13, 2.5, M, .9);
  var B = branch([[795, 145], [835, 235], [845, 335], [825, 435], [785, 535], [735, 625], [675, 715]], 15, 2.5, M, 1);
  var C = branch([[605, 285], [625, 375], [605, 465], [565, 555], [505, 640], [445, 720]], 10, 2, M, .95);
  var E = branch([[500, 350], [472, 272], [425, 212], [355, 172], [285, 152]], 7, 2, M, .85);
  var F = branch([[400, 420], [382, 500], [352, 580], [305, 650]], 6, 2, M, .85);
  var H = branch([[785, 535], [705, 558], [625, 600], [565, 660]], 6, 2, B, .85);

  dress(M, .1, 30, 40, .95);
  dress(A, .12, 30, 40, .95);
  dress(B, .12, 30, 40, .95);
  dress(C, .12, 30, 40, .95);
  dress(E, .12, 28, 38, .95);
  dress(F, .12, 28, 38, .95);
  dress(H, .12, 28, 38, .95);

  /* ---------- wind ---------- */
  /* ============ EDIT THESE NUMBERS TO TUNE THE WIND ============ */
  var CONFIG = {
    speed: 1.9,     // how fast leaves swing: 1 = slow, 1.6 = quick, 2.2 = very fast
    strength: 0.9,  // how hard the wind pushes: 0.7 = breath, 0.9 = light wind, 2 = strong
    settle: 0.5,    // how quickly they calm down: 0.6 = sway longer, 1.5 = stop sooner
    radius: 130,    // how far the cursor's wind reaches around it
    response: 7    // how instantly leaves react to the mouse: 1 = lazy, 3 = default, 4 = instant
  };
  /* ============================================================= */
  var SPEED = CONFIG.speed, STRENGTH = CONFIG.strength, SETTLE = CONFIG.settle;
  var GAIN = (reduce ? 0.03 : 0.075) * STRENGTH;   // direct push under the cursor
  var GG = (reduce ? 0 : 0.009) * STRENGTH;        // trailing gusts that spread and carry on
  var S1 = CONFIG.radius, S2 = S1 * 2.2;
  var BLEND = Math.min(.95, .2 * CONFIG.response);
  var D2 = Math.pow(.84, SPEED), GDEC = Math.pow(.965, SPEED);
  items.forEach(function (it) { it.dampS = Math.pow(it.damp, SPEED * SETTLE); });
  var mx = -1e4, my = -1e4, lx = null, ly = null, accx = 0, accy = 0, wx = 0, wy = 0;
  var gusts = [], gTick = 0;
  var breeze = null, running = false;
  var pt = svg.createSVGPoint();

  function toSvg(e) {
    var m = svg.getScreenCTM();
    if (!m) return null;
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(m.inverse());
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function lift() { lx = null; ly = null; }

  window.addEventListener('pointermove', function (e) {
    var p = toSvg(e);
    if (!p) return;
    if (lx !== null) { accx += p.x - lx; accy += p.y - ly; }
    lx = p.x; ly = p.y; mx = p.x; my = p.y;
    kick();
  }, { passive: true });
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  document.addEventListener('mouseleave', lift);
  window.addEventListener('blur', lift);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function frame(now) {
    var vx = clamp(accx, -45, 45), vy = clamp(accy, -45, 45);
    accx = 0; accy = 0;
    wx = wx * (1 - BLEND) + vx * BLEND;
    wy = wy * (1 - BLEND) + vy * BLEND;
    var wm = Math.hypot(wx, wy), windy = wm > .25;

    // release a gust every few frames while the cursor is moving
    gTick++;
    if (GG > 0 && wm > 1.5 && gTick % 2 === 0) {
      gusts.push({ x: mx, y: my, vx: wx, vy: wy, age: 0, str: 1, s2: 2 * S1 * S1, cut: 10 * S1 * S1 });
      if (gusts.length > 14) gusts.shift();
    }
    for (var gi = gusts.length - 1; gi >= 0; gi--) {
      var G = gusts[gi];
      G.age += SPEED;
      if (G.age > 90) { gusts.splice(gi, 1); continue; }
      G.x += G.vx * .45 * SPEED; G.y += G.vy * .45 * SPEED;
      G.vx *= GDEC; G.vy *= GDEC;
      G.str = Math.exp(-G.age / 26);
      var rr = S1 + G.age * 3.2;
      G.s2 = 2 * rr * rr;
      G.cut = 5 * G.s2;
    }

    // opening breeze: a wave from the top-right corner toward the lower left
    var front = 0, bActive = false;
    if (breeze) {
      var prog = (now - breeze) / (1900 / SPEED);
      if (prog > 1.15) breeze = null;
      else { bActive = true; front = prog * 1400; }
    }

    var anyMoving = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], force = 0;
      var a = it.dir0 + (it.ang + it.ang2) * Math.PI / 180;
      var sa = Math.sin(a), ca = Math.cos(a);
      if (windy) {
        var dx = it.px - mx, dy = it.py - my, d2 = dx * dx + dy * dy;
        if (d2 < 9 * S2 * S2) {
          var infl = Math.exp(-d2 / (2 * S1 * S1)) + .25 * Math.exp(-d2 / (2 * S2 * S2));
          if (infl > .004) force += infl * (-sa * wx + ca * wy) * GAIN * it.gain;
        }
      }
      for (var q = 0; q < gusts.length; q++) {
        var g2 = gusts[q], gx = it.px - g2.x, gy = it.py - g2.y, gd = gx * gx + gy * gy;
        if (gd < g2.cut) force += Math.exp(-gd / g2.s2) * g2.str * (-sa * g2.vx + ca * g2.vy) * GG * it.gain;
      }
      if (bActive) {
        var proj = (980 - it.px) * .85 + it.py * .5, dd = proj - front;
        var bi = Math.exp(-dd * dd / (2 * 110 * 110));
        if (bi > .004) force += bi * (-sa * -14 + ca * 8) * GAIN * it.gain * 1.2;
      }
      // main swing
      it.vel += (force - it.k * it.ang) * SPEED;
      it.vel *= it.dampS;
      it.ang = clamp(it.ang + it.vel * SPEED, -34, 34);
      // quick secondary flutter on top
      it.vel2 += (force * .9 * it.fl - .3 * it.ang2) * SPEED;
      it.vel2 *= D2;
      it.ang2 = clamp(it.ang2 + it.vel2 * SPEED, -8, 8);

      if (Math.abs(it.ang) + Math.abs(it.ang2) > .04 || Math.abs(it.vel) > .04 || Math.abs(it.vel2) > .04) {
        it.g.setAttribute('transform', 'translate(' + f(it.px) + ' ' + f(it.py) + ') rotate(' + (it.rot0 + it.ang + it.ang2).toFixed(2) + ')');
        it.moved = true;
        anyMoving = true;
      } else if (it.moved) {
        it.ang = 0; it.vel = 0; it.ang2 = 0; it.vel2 = 0; it.moved = false;
        it.g.setAttribute('transform', 'translate(' + f(it.px) + ' ' + f(it.py) + ') rotate(' + it.rot0.toFixed(2) + ')');
      }
    }
    if (windy || bActive || anyMoving || gusts.length) requestAnimationFrame(frame);
    else running = false;
  }

  if (!reduce) {
    setTimeout(function () { breeze = performance.now(); kick(); }, 500);
  }
})();

/* =====================================================
   HEADER: mobile menu
   ===================================================== */
(function () {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

/* =====================================================
   ABOUT: coffee beans fall into the sack when it scrolls into view
   ===================================================== */
(function () {
  var sack = document.getElementById('sack');
  var layer = document.getElementById('beanLayer');
  if (!sack || !layer) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- tune here ---- */
  var COUNT = 90;      // how many beans fall
  var GRAVITY = 5200;  // higher = faster fall
  var DURATION = 1.1;  // seconds the pouring lasts
  /* ------------------- */

  var TOP = -300;      // top of the beans' space (matches the svg viewBox)
  // top edge of the bean heap in the sack picture: [x, y] in picture units
  var contour = [[100, 275], [140, 226], [180, 204], [220, 187], [260, 160], [300, 141], [340, 123], [380, 113], [420, 112], [460, 95], [500, 83], [540, 87], [580, 100], [620, 110], [660, 121], [700, 137], [740, 153], [780, 164], [820, 197], [860, 213]];

  function heapY(x) {
    for (var i = 1; i < contour.length; i++) {
      if (x <= contour[i][0]) {
        var a = contour[i - 1], b = contour[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return contour[contour.length - 1][1];
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var beans = [], raf = 0, last = 0, t = 0, played = false;

  function draw(b) {
    b.node.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') rotate(' + b.r.toFixed(0) + ') scale(' + b.s.toFixed(2) + ')');
  }
  function clear() {
    cancelAnimationFrame(raf); raf = 0;
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    beans = [];
  }
  function build() {
    clear();
    for (var i = 0; i < COUNT; i++) {
      var tx = clamp(512 + (Math.random() + Math.random() + Math.random() - 1.5) * 250, 215, 815);
      var node = document.createElementNS(NS, 'use');
      node.setAttribute('href', '#bean');
      layer.appendChild(node);
      var b = {
        node: node, x: tx, y: TOP - 80 - rnd(0, 40), vx: 0, vy: 0,
        r: rnd(0, 360), w: rnd(-360, 360), s: rnd(.85, 1.1),
        ty: heapY(tx) + rnd(0, 22) - Math.min(i * .28, 22),   // where it comes to rest (pile slowly grows)
        delay: Math.pow(i / COUNT, 1.05) * DURATION + rnd(0, .12),
        bounces: 0, done: false
      };
      beans.push(b);
      draw(b);
    }
  }
  function step(now) {
    var dt = Math.min(.033, (now - last) / 1000);
    last = now; t += dt;
    var active = false;
    for (var i = 0; i < beans.length; i++) {
      var b = beans[i];
      if (b.done) continue;
      active = true;
      if (t < b.delay) continue;
      b.vy += GRAVITY * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.r += b.w * dt;
      if (b.y >= b.ty && b.vy > 0) {
        b.y = b.ty;
        if (b.bounces < 2 && b.vy > 260) {          // small bounce on the heap
          b.vy = -b.vy * .3; b.vx = rnd(-70, 70); b.w *= .4; b.bounces++;
        } else {                                      // settle
          b.done = true; b.vx = 0; b.vy = 0; b.w = 0;
        }
      }
      draw(b);
    }
    raf = active ? requestAnimationFrame(step) : 0;
  }
  function play() {
    build();
    t = 0; last = performance.now();
    raf = requestAnimationFrame(step);
  }

  if (reduce) {                                       // no motion: beans are simply already in the sack
    build();
    beans.forEach(function (b) { b.y = b.ty; draw(b); });
    return;
  }

  if (!('IntersectionObserver' in window)) { play(); return; }

  // watch the top part of the sack (where the beans land), not the whole sack:
  // when you scroll UP, the bottom of the sack appears first and the pour used to finish before you could see it
  var trigger = document.getElementById('sackTrigger') || sack;
  var timer = 0;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= .6 && !played) {
        played = true;
        timer = setTimeout(play, 300);                      // let the sack fade in first
      } else if (!e.isIntersecting && played) {
        played = false; clearTimeout(timer); clear();       // replays next time you scroll back
      }
    });
  }, { threshold: [0, .6] }).observe(trigger);
})();

/* HEADER: language switch (EN / AR) - only the button state for now */
(function () {
  var box = document.querySelector('.lang');
  if (!box) return;
  box.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    box.querySelectorAll('button').forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // later: translate the page text here based on btn.dataset.lang ("en" or "ar")
  });
})();

/* =====================================================
   MOTION: fast eased scrolling for menu links, reveal on scroll, active menu link
   ===================================================== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1) menu / footer links: quick, eased scroll (replaces the browser's slow smooth-scroll) ---- */
  var raf = 0;
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function scrollToY(y) {
    stop();
    var start = window.pageYOffset, dist = y - start;
    if (!dist) return;
    if (reduce) { window.scrollTo(0, y); return; }
    var dur = Math.min(850, Math.max(450, Math.abs(dist) * .3));   // short trips ~0.45s, long ones max 0.85s
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + dist * easeInOut(p));
      raf = p < 1 ? requestAnimationFrame(step) : 0;
    })(t0);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {      // you take over -> the animation stops
    window.addEventListener(ev, stop, { passive: true });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }               // placeholder links: do nothing
    var target;
    try { target = document.querySelector(id); } catch (err) { return; }
    if (!target) return;
    e.preventDefault();
    scrollToY(Math.max(0, target.getBoundingClientRect().top + window.pageYOffset));
    try { history.pushState(null, '', id); } catch (err) { }
  });

  /* ---- 2) reveal on scroll: elements with data-reveal fade up one after another ---- */
  var items = document.querySelectorAll('[data-reveal]');
  var lastParent = null, n = 0;
  items.forEach(function (el) {                                   // small delay between siblings
    if (el.parentNode !== lastParent) { lastParent = el.parentNode; n = 0; }
    el.style.setProperty('--d', (n++ * 0.09).toFixed(2) + 's');
  });
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { reveal.observe(el); });
  }

  /* ---- 3) menu link of the section you are on stays underlined ---- */
  var map = { '#top': 'home', '#about': 'about', '#origins': 'origins' };
  var pairs = [];
  document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (a) {
    var sec = map[a.getAttribute('href')] && document.getElementById(map[a.getAttribute('href')]);
    if (sec) pairs.push({ a: a, sec: sec });
  });
  if (pairs.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        pairs.forEach(function (p) { if (p.sec === e.target) p.a.classList.toggle('is-active', e.isIntersecting); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    pairs.forEach(function (p) { spy.observe(p.sec); });
  }
})();

/* =====================================================
   SHOP PAGE: add to cart + category buttons
   ===================================================== */
(function () {
  /* ---- cart number in the header---- */
  var badge = document.querySelector('.cart-count');

  function show(count, bump) {
    if (!badge) return;
    badge.textContent = count;
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.add') : null;
    if (!btn) return;

    var productId = btn.dataset.productId || btn.getAttribute('data-product-id');
    if (!productId) return;

    fetch('/cart/add/' + productId + '/', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          show(data.cart_count, true);

          if (!btn.dataset.label) btn.dataset.label = btn.textContent;
          btn.textContent = 'Added \u2713';
          btn.classList.add('added');
          clearTimeout(btn._t);
          btn._t = setTimeout(function () {
            btn.textContent = btn.dataset.label;
            btn.classList.remove('added');
          }, 1400);
        }
      })
      .catch(err => console.log('Error:', err));
  });

  /* ---- the category button of the section you are looking at gets highlighted ---- */
  var tabs = document.querySelectorAll('.shop-tabs a[href^="#"]');
  if (!tabs.length || !('IntersectionObserver' in window)) return;
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      tabs.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  tabs.forEach(function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) spy.observe(sec);
  });
})();