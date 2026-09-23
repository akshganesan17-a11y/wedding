/* ==========================================================================
   ORBYT sample — interface behaviour
   cursors, ambient canvas scenes
   ========================================================================== */
(function (window, document) {
  'use strict';

  var scenes = window.OrbytScenes;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* --------------------------------------------------------------- cursors */
  var trailCanvas = document.getElementById('cursorTrail');
  var trail = (!isTouch && trailCanvas) ? scenes.cursorTrail(trailCanvas) : null;

  if (trail) {
    var trailShown = false;

    window.addEventListener('mousemove', function (e) {
      if (!trailShown) {
        trailShown = true;
        gsap.to(trailCanvas, { opacity: 1, duration: 0.4 });
      }
      trail.point(e.clientX, e.clientY);
    });

    /* flare brighter and wider over anything clickable */
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button')) trail.setActive(true);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button')) trail.setActive(false);
    });
  }

  /* -------------------------------------------------------- ambient scenes */
  scenes.footerHaze(document.getElementById('farewellCanvas'));
  scenes.petals(document.getElementById('farewellPetals'), { count: 10 });

  /* the deep-space bed starts as soon as the page is ready */
  var starfieldStarted = false;
  function startStarfield() {
    if (starfieldStarted) return;
    starfieldStarted = true;
    scenes.starfield(document.getElementById('starfield'));
    scenes.petals(document.getElementById('mainPetals'), { count: 14 });
  }
  window.addEventListener('orbyt:ready', startStarfield, { once: true });
  window.setTimeout(startStarfield, 3000);

  /* the invitation's own reveal: bow, then kicker, then each name line,
     staggered in one after another — the first thing a visitor reads
     should arrive gently rather than snap fully into view the instant
     the intro clears */
  var heroBow = document.querySelector('.hero-mark__bow');
  var heroKicker = document.querySelector('.hero-mark__kicker');
  var heroNameLines = gsap.utils.toArray('.hero-mark__names span');
  if (heroBow && heroKicker && heroNameLines.length) {
    if (scenes.reduceMotion) {
      gsap.set([heroBow, heroKicker].concat(heroNameLines), { opacity: 1 });
    } else {
      gsap.set(heroBow, { opacity: 0, y: -10, scale: .82 });
      gsap.set(heroKicker, { opacity: 0, y: 14 });
      gsap.set(heroNameLines, { opacity: 0, y: 26 });

      window.addEventListener('orbyt:ready', function () {
        gsap.timeline({ delay: .2 })
          .to(heroBow, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'power2.out' })
          .to(heroKicker, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, '-=0.35')
          .to(heroNameLines, { opacity: 1, y: 0, duration: .85, ease: 'power2.out', stagger: .22 }, '-=0.25');
      }, { once: true });
    }
  }

  /* scroll hint: appears once the intro clears, disappears for good on
     the visitor's first scroll (so it never lingers once they know) */
  var scrollHint = document.getElementById('scrollHint');
  if (scrollHint) {
    var showScrollHint = function () { scrollHint.classList.add('is-visible'); };
    var hideScrollHint = function () {
      scrollHint.classList.remove('is-visible');
      window.removeEventListener('wheel', hideScrollHint);
      window.removeEventListener('touchmove', hideScrollHint);
      window.removeEventListener('keydown', hideScrollHint);
    };
    window.addEventListener('orbyt:ready', function () {
      window.setTimeout(showScrollHint, 400);
    }, { once: true });
    window.addEventListener('wheel', hideScrollHint, { passive: true });
    window.addEventListener('touchmove', hideScrollHint, { passive: true });
    window.addEventListener('keydown', hideScrollHint);
  }

  /* colour arcs behind the white act — drawn as conic gradient rings so the
     count adapts to the viewport instead of shipping fourteen PNGs */
  var ringWrap = document.getElementById('filmRingsWrap');
  if (ringWrap) {
    var palette = ['#FF007F', '#D089BA', '#F291A3', '#F4A77C', '#E1BA71', '#7fe4ff', '#8A2BE2', '#5B8CFF'];
    var total = window.innerWidth <= 570 ? 12 : 19;
    for (var i = 0; i < total; i++) {
      var ring = document.createElement('i');
      var pct = 10 + (i / total) * 92;
      var sweep = 40 + ((i * 53) % 190);
      var from = (i * 47) % 360;
      var colour = palette[i % palette.length];
      var thick = i % 4 === 0 ? 2 : 1.2;

      ring.className = 'film__ring';
      ring.style.width = pct + '%';
      ring.style.height = pct + '%';
      ring.style.background = 'conic-gradient(from ' + from + 'deg, ' + colour +
        ' 0deg, ' + colour + ' ' + sweep + 'deg, rgba(255,255,255,0) ' + sweep + 'deg)';
      ring.style.webkitMaskImage = 'radial-gradient(circle, rgba(0,0,0,0) calc(50% - ' + thick +
        'px), #000 calc(50% - ' + thick + 'px) 50%, rgba(0,0,0,0) 50%)';
      ring.style.maskImage = ring.style.webkitMaskImage;
      ringWrap.appendChild(ring);
    }
  }
})(window, document);
