/* ==========================================================================
   ORBYT sample — canvas scenes
   Every visual that would normally be a video or a 90 frame image sequence is
   drawn procedurally here, so the whole site is self contained.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = function () { return window.innerWidth <= 570; };

  /* --------------------------------------------------------------- helpers */
  function fitCanvas(canvas, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round((rect.width || window.innerWidth) * dpr));
    var h = Math.max(1, Math.round((rect.height || window.innerHeight) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { dpr: dpr, w: w, h: h };
  }

  /* A raf loop that only runs while its canvas is on screen. */
  function Loop(canvas, draw) {
    var raf = null;
    var visible = true;
    var self = this;

    function frame(t) {
      draw(t || 0);
      raf = window.requestAnimationFrame(frame);
    }
    this.start = function () {
      if (raf === null && visible) raf = window.requestAnimationFrame(frame);
      return self;
    };
    this.stop = function () {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
      return self;
    };
    this.once = function () { draw(0); return self; };

    if ('IntersectionObserver' in window && canvas) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) self.start(); else self.stop();
      }, { rootMargin: '10% 0px' }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self.stop();
      else if (visible) self.start();
    });
  }

  /* ============================================================ starfield
     Perspective streaks flying past the camera — the deep space bed behind
     the philosophy act.
     ========================================================================= */
  var STAR_COLORS = [
    [0, 255, 255], [255, 0, 170], [180, 0, 255], [0, 255, 150], [255, 255, 255]
  ];

  function starfield(canvas, opts) {
    if (!canvas) return null;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var size = fitCanvas(canvas, 1.75);
    var count = opts.count || (isSmall() ? 200 : 300);
    var speed = opts.speed || 3.5;
    var fov = 400;
    var streak = 15;
    var stars = [];
    var state = { boost: 1 };

    function reset(s, initial) {
      s.x = (Math.random() - 0.5) * size.w * 3;
      s.y = (Math.random() - 0.5) * size.h * 3;
      s.z = initial ? Math.random() * size.w : size.w;
      s.c = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
      s.m = 0.8 + Math.random() * 0.5;
    }
    for (var i = 0; i < count; i++) {
      var s = {};
      reset(s, true);
      stars.push(s);
    }

    window.addEventListener('resize', function () {
      size = fitCanvas(canvas, 1.75);
    });

    var loop = new Loop(canvas, function () {
      ctx.fillStyle = opts.bg || '#000000';
      ctx.fillRect(0, 0, size.w, size.h);
      var cx = size.w / 2;
      var cy = size.h / 2;

      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.z -= speed * st.m * state.boost * size.dpr;
        if (st.z < 1) reset(st, false);

        var sx = (st.x / st.z) * fov + cx;
        var sy = (st.y / st.z) * fov + cy;
        var pz = st.z + speed * streak * st.m * state.boost * size.dpr;
        var px = (st.x / pz) * fov + cx;
        var py = (st.y / pz) * fov + cy;

        if ((sx < 0 || sx > size.w || sy < 0 || sy > size.h) &&
            (px < 0 || px > size.w || py < 0 || py > size.h)) continue;

        var o = 1 - st.z / size.w;
        if (o < 0) o = 0; else if (o > 1) o = 1;
        var lw = (fov / st.z) * 0.8 * size.dpr;
        if (lw < 0.5) lw = 0.5; else if (lw > 8 * size.dpr) lw = 8 * size.dpr;

        var g = ctx.createLinearGradient(px, py, sx, sy);
        var c = st.c;
        g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + o + ')');

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = g;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    state.loop = loop;
    if (!reduceMotion) loop.start(); else loop.once();
    return state;
  }

  /* ================================================================ warp
     Hyperspace tunnel for the second half of the intro. `state.speed` is
     ramped by the intro timeline. Optionally carries the couple's own
     photos as a second layer of "shards" flying the same outward path as
     the light streaks — small, fading in as they leave the centre,
     growing as they approach, fading out again before they'd clip the
     frame edge. Plain 2D drawImage, no WebGL: cheap enough that nothing
     ever has to stall waiting on a GPU upload, and it works everywhere,
     phones included.
     ========================================================================= */
  function warp(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var size = fitCanvas(canvas, 1.5);
    var state = { speed: 0.2, hue: 268 };
    var lines = [];
    var count = isSmall() ? 160 : 320;

    function make(initial) {
      return {
        a: Math.random() * Math.PI * 2,
        r: initial ? Math.random() : 0.02 + Math.random() * 0.08,
        v: 0.004 + Math.random() * 0.012,
        h: state.hue + (Math.random() * 120 - 60),
        w: 0.6 + Math.random() * 1.8
      };
    }
    for (var i = 0; i < count; i++) lines.push(make(true));

    var photos = null;
    var shards = [];
    var MAX_SHARD_R = 1.1;

    function makeShard(initial) {
      var img = photos[(Math.random() * photos.length) | 0];
      return {
        img: img,
        ar: (img.naturalWidth / img.naturalHeight) || 1,
        a: Math.random() * Math.PI * 2,
        r: initial ? Math.random() * MAX_SHARD_R : 0.03 + Math.random() * 0.05,
        v: 0.007 + Math.random() * 0.01
      };
    }
    state.setPhotos = function (imgs) {
      photos = imgs;
      var n = isSmall() ? 3 : 5;
      for (var i = 0; i < n; i++) shards.push(makeShard(true));
    };

    window.addEventListener('resize', function () { size = fitCanvas(canvas, 1.5); });

    var loop = new Loop(canvas, function () {
      ctx.fillStyle = 'rgba(4,2,10,0.34)';
      ctx.fillRect(0, 0, size.w, size.h);
      var cx = size.w / 2;
      var cy = size.h / 2;
      var max = Math.hypot(cx, cy);

      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        l.r += l.v * state.speed;
        if (l.r > 1.25) lines[i] = make(false);

        var r1 = l.r * max;
        var r2 = (l.r - 0.09 * Math.min(2.4, state.speed)) * max;
        if (r2 < 0) r2 = 0;
        var cos = Math.cos(l.a);
        var sin = Math.sin(l.a);
        var alpha = Math.min(1, l.r * 1.6) * 0.85;

        var g = ctx.createLinearGradient(cx + cos * r2, cy + sin * r2, cx + cos * r1, cy + sin * r1);
        g.addColorStop(0, 'hsla(' + l.h + ',95%,70%,0)');
        g.addColorStop(1, 'hsla(' + l.h + ',95%,72%,' + alpha + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = l.w * size.dpr * (0.6 + l.r);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + cos * r2, cy + sin * r2);
        ctx.lineTo(cx + cos * r1, cy + sin * r1);
        ctx.stroke();
      }

      if (photos && photos.length) {
        for (var j = 0; j < shards.length; j++) {
          var sh = shards[j];
          sh.r += sh.v * state.speed;
          if (sh.r > MAX_SHARD_R) { shards[j] = makeShard(false); continue; }

          var rr = sh.r * max;
          var px = cx + Math.cos(sh.a) * rr;
          var py = cy + Math.sin(sh.a) * rr;
          var w = Math.min(size.w, size.h) * (0.05 + sh.r * 0.22);
          var h = w / sh.ar;

          var alpha;
          if (sh.r < 0.15) alpha = sh.r / 0.15;
          else if (sh.r > MAX_SHARD_R * 0.75) alpha = Math.max(0, (MAX_SHARD_R - sh.r) / (MAX_SHARD_R * 0.25));
          else alpha = 1;

          ctx.save();
          ctx.globalAlpha = alpha * 0.95;
          ctx.filter = 'brightness(.88) saturate(.9)';
          ctx.drawImage(sh.img, px - w / 2, py - h / 2, w, h);
          ctx.restore();
        }
      }
    });

    state.loop = loop;
    return state;
  }

  /* ============================================================== petals
     The surreal thread running through the whole site: marigold petals
     drifting upward through the cosmos, each one dissolving into a burst
     of starlight partway through its climb — tradition becoming myth.
     ========================================================================= */
  var PETAL_COLORS = [
    [255, 183, 39],  // marigold
    [244, 162, 97],  // saffron
    [255, 214, 140], // pale gold
    [216, 122, 22]   // deep amber
  ];

  function petals(canvas, opts) {
    if (!canvas) return null;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var size = fitCanvas(canvas, 1.5);
    var count = opts.count || (isSmall() ? 10 : 18);
    var items = [];

    function reset(p, initial) {
      p.x = Math.random() * size.w;
      p.y = initial ? Math.random() * size.h : size.h + Math.random() * size.h * 0.4;
      p.size = (7 + Math.random() * 11) * size.dpr;
      p.speed = (0.14 + Math.random() * 0.22) * size.dpr;
      p.swayAmp = 14 + Math.random() * 30;
      p.swaySpeed = 0.0005 + Math.random() * 0.0007;
      p.swayPhase = Math.random() * Math.PI * 2;
      p.baseX = p.x;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.0016;
      p.color = PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0];
      p.dissolveAt = size.h * (0.2 + Math.random() * 0.3);
      p.dissolving = false;
      p.dissolveT = 0;
      p.sparks = null;
      p.alphaIn = initial ? 1 : 0;
    }
    for (var i = 0; i < count; i++) { var p = {}; reset(p, true); items.push(p); }

    window.addEventListener('resize', function () { size = fitCanvas(canvas, 1.5); });

    function drawPetal(px, py, rotation, scale, color, alpha) {
      var w = 10 * size.dpr * scale;
      var h = w * 1.85;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotation);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 0.6);
      g.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (0.9 * alpha) + ')');
      g.addColorStop(0.7, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (0.35 * alpha) + ')');
      g.addColorStop(1, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 2, -h / 5, w / 2, h / 5, 0, h / 2);
      ctx.bezierCurveTo(-w / 2, h / 5, -w / 2, -h / 5, 0, -h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    var loop = new Loop(canvas, function (t) {
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < items.length; i++) {
        var pt = items[i];

        if (pt.alphaIn < 1) pt.alphaIn = Math.min(1, pt.alphaIn + 0.01);

        if (!pt.dissolving) {
          pt.y -= pt.speed;
          pt.x = pt.baseX + Math.sin(t * pt.swaySpeed + pt.swayPhase) * pt.swayAmp;
          pt.rotation += pt.rotSpeed;

          if (pt.y < pt.dissolveAt) {
            pt.dissolving = true;
            pt.sparks = [];
            var sparkCount = 5 + ((Math.random() * 5) | 0);
            for (var s = 0; s < sparkCount; s++) {
              var ang = Math.random() * Math.PI * 2;
              var spd = (0.25 + Math.random() * 0.5) * size.dpr;
              pt.sparks.push({
                x: pt.x, y: pt.y,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 0.35 * size.dpr,
                life: 1
              });
            }
          } else {
            drawPetal(pt.x, pt.y, pt.rotation, 1, pt.color, pt.alphaIn);
          }
        }

        if (pt.dissolving) {
          pt.dissolveT += 0.018;
          var shrink = Math.max(0, 1 - pt.dissolveT * 1.4);
          if (shrink > 0) drawPetal(pt.x, pt.y, pt.rotation, shrink, pt.color, pt.alphaIn);

          for (var j = 0; j < pt.sparks.length; j++) {
            var sp = pt.sparks[j];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.life -= 0.016;
            if (sp.life > 0) {
              var r = 1.3 * size.dpr * sp.life;
              ctx.beginPath();
              ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,244,214,' + (sp.life * 0.95) + ')';
              ctx.fill();
            }
          }

          if (pt.dissolveT >= 1.15) reset(pt, false);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    });

    if (!reduceMotion) loop.start(); else loop.once();
    return loop;
  }

  /* ========================================================= footer haze
     A quiet drifting glow so the closing page is not a flat black plate.
     ========================================================================= */
  function footerHaze(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var size = fitCanvas(canvas, 1.2);
    window.addEventListener('resize', function () { size = fitCanvas(canvas, 1.2); });

    var loop = new Loop(canvas, function (t) {
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 3; i++) {
        var p = t * 0.00008 + i * 2.1;
        var x = size.w * (0.5 + Math.sin(p) * 0.3);
        var y = size.h * (0.55 + Math.cos(p * 1.2) * 0.22);
        var r = Math.min(size.w, size.h) * (0.44 + 0.08 * Math.sin(p * 1.6));
        var hue = 256 + i * 26;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'hsla(' + hue + ',90%,60%,0.2)');
        g.addColorStop(1, 'hsla(' + hue + ',90%,50%,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    });

    if (!reduceMotion) loop.start(); else loop.once();
    return loop;
  }

  /* ======================================================== cursor trail
     A shooting star that traces the pointer instead of a plain ring. ui.js
     feeds it live coordinates via .point(x, y); this owns the drawing —
     a fading, tapering streak through the last ~0.2s of positions plus a
     bright sparkling head, colour slowly cycling through the same neon
     palette as the starfield so it reads as part of the same sky.
     ========================================================================= */
  function cursorTrail(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var size = fitCanvas(canvas, 2);
    window.addEventListener('resize', function () { size = fitCanvas(canvas, 2); });

    var MAX_AGE = 220;   // ms a point survives in the trail
    var MAX_PTS = 26;
    var pts = [];
    var active = false;  // true while hovering something clickable

    function point(x, y) {
      var now = performance.now();
      pts.push({ x: x * size.dpr, y: y * size.dpr, t: now });
      if (pts.length > MAX_PTS) pts.shift();
    }

    var loop = new Loop(canvas, function () {
      var now = performance.now();
      while (pts.length && now - pts[0].t > MAX_AGE) pts.shift();

      ctx.clearRect(0, 0, size.w, size.h);
      var n = pts.length;
      if (!n) return;

      var hue = (now * 0.05) % 360;

      for (var i = 1; i < n; i++) {
        var p0 = pts[i - 1];
        var p1 = pts[i];
        var k = 1 - (now - p1.t) / MAX_AGE;
        if (k <= 0) continue;

        var alpha = Math.pow(k, 1.6) * (active ? 0.95 : 0.75);
        var width = (active ? 5.5 : 3.2) * Math.pow(k, 0.8) * size.dpr;
        if (width < 0.4 * size.dpr) continue;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = 'hsla(' + ((hue + i * 6) % 360) + ',90%,' + (60 + k * 20) + '%,' + alpha + ')';
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      /* bright sparkling head at the newest point */
      var head = pts[n - 1];
      var headAlpha = Math.max(0, 1 - ((now - head.t) / MAX_AGE) * 1.3);
      if (headAlpha > 0) {
        var r = (active ? 10 : 6) * size.dpr;
        var glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r * 2.6);
        glow.addColorStop(0, 'rgba(255,255,255,' + (0.95 * headAlpha) + ')');
        glow.addColorStop(0.35, 'hsla(' + hue + ',95%,72%,' + (0.55 * headAlpha) + ')');
        glow.addColorStop(1, 'hsla(' + hue + ',95%,60%,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();

        var s = r * 1.8;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * headAlpha) + ')';
        ctx.lineWidth = 1.2 * size.dpr;
        ctx.beginPath();
        ctx.moveTo(head.x - s, head.y); ctx.lineTo(head.x + s, head.y);
        ctx.moveTo(head.x, head.y - s); ctx.lineTo(head.x, head.y + s);
        ctx.stroke();
      }
    });

    if (!reduceMotion) loop.start(); else loop.once();

    return {
      point: point,
      setActive: function (v) { active = !!v; },
      loop: loop
    };
  }

  window.OrbytScenes = {
    starfield: starfield,
    warp: warp,
    petals: petals,
    footerHaze: footerHaze,
    cursorTrail: cursorTrail,
    reduceMotion: reduceMotion
  };
})(window, document);
