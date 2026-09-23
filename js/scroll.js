/* ==========================================================================
   ORBYT sample — scroll choreography
   ScrollSmoother for the smoothed scroll on desktop, GSAP ScrollTrigger for
   the pinned acts. Lenis (a third-party smooth-scroll library) previously
   drove this everywhere, but its syncTouch touch handling has a
   well-documented conflict with ScrollTrigger's pin mechanism on real touch
   devices — the pinned act would simply stop responding to further input
   partway through. Swapping to ScrollSmoother (GSAP's own first-party
   plugin) fixed that, but ScrollSmoother's own wrapper mechanism (a fixed
   wrapper with the content moved via transform) turns out to still cause
   visible jittering/shaking on iOS Safari specifically while a section is
   pinned — a separate, also well-documented issue, confirmed here on a
   real iPhone. GSAP's own recommended fix for both: don't run ScrollSmoother
   on touch devices at all — desktop keeps the smooth wheel-scroll feel,
   touch devices get plain native scroll, which is ScrollTrigger's own
   best-tested, default mode and has neither issue. One builder runs for
   every breakpoint; only the scrub lengths change.
   ========================================================================== */
(function (window, document) {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother);

  /* a real ScrollTrigger-level setting, not a ScrollSmoother option — it
     stops a touch device's vertical browser-chrome resize (the address
     bar sliding away as you scroll) from firing ScrollTrigger.refresh()
     mid-scroll, which recalculates the pin's start/end positions while
     it's actively pinned and can break it. Previously this was only set
     inside the ScrollSmoother config below, so it silently stopped
     applying at all once touch devices stopped using ScrollSmoother. */
  ScrollTrigger.config({ ignoreMobileResize: true });

  var scenes = window.OrbytScenes;

  /* touch devices skip ScrollSmoother entirely (see comment above) and
     fall back to plain native scroll; body.is-locked's CSS already
     handles the intro's scroll-lock without needing smoother.paused(),
     and js/intro.js's window.scrollTo(0,0) already covers the reset
     when there's no smoother to call .scrollTop() on. */
  var smoother = null;
  if (!ScrollTrigger.isTouch) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1
    });
    smoother.paused(true);
  }
  window.smoother = smoother;
  gsap.ticker.lagSmoothing(0);

  /* ============================================================== builder */
  var mm = gsap.matchMedia();

  var PROFILES = [
    { query: '(min-width: 1025px)', philosophy: 1500 },
    { query: '(min-width: 821px) and (max-width: 1024px)', philosophy: 1200 },
    { query: '(min-width: 571px) and (max-width: 820px)', philosophy: 1200 },
    { query: '(max-width: 570px)', philosophy: 700 }
  ];

  PROFILES.forEach(function (profile) {
    mm.add(profile.query, function () { return build(profile); });
  });

  function build(cfg) {
    var q = function (sel) { return document.querySelector(sel); };

    /* ------------------------------------------------------- 01 / pinned act
       Deep-space act: the circle swallows the screen, two sphere clusters
       fly past, then the white film act resolves out of it.                 */
    gsap.set('.act-text .tx02', { yPercent: 100, opacity: 0 });
    gsap.set('.film', { opacity: 0 });
    gsap.set('.film__white, .film__blur, .film__rings', { opacity: 0 });
    gsap.set('.film__disc', { scale: 0, opacity: 0 });
    gsap.set('.film__copy', { opacity: 0, y: 100 });
    gsap.set('.film__ring', { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
    gsap.set('.spheres__box', { scale: 0 });
    gsap.set('.orb', { opacity: 0, z: -2000 });
    gsap.set('.expand__dots', { opacity: 0, rotate: 0, scale: 2.5 });

    var rings = gsap.utils.toArray('.film__ring');
    var ringSpin = gsap.to(rings, {
      rotate: '-=360',
      duration: 15,
      ease: 'none',
      repeat: -1,
      paused: true
    });

    var expandText = q('.expand__text');

    var actOne = gsap.timeline({
      scrollTrigger: {
        trigger: '#philosophy',
        start: 'top top',
        end: '+=' + cfg.philosophy + '%',
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
        pinSpacing: true,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        refreshPriority: 1,
        onLeave: function () { ringSpin.pause(); },
        onLeaveBack: function () { ringSpin.pause(); }
      }
    });

    /* the invitation is wide, so it clears the frame before the circle grows
       past it — otherwise the tail of the name pokes out at the edge */
    actOne.fromTo('.hero-mark__type',
      { opacity: 1, scale: 1 },
      { opacity: 0, scale: 0.96, duration: 0.025, ease: 'none' });

    /* the kolam ring belongs to the hero moment only — it's `position:
       fixed` so it would otherwise stay on screen behind every act after
       this (orbs, the white reveal, even the farewell page). Fade it out
       in lockstep with the hero names and it never reappears. Its own
       CSS animation (a continuous 220s rotation) keeps recalculating
       transform every frame regardless of opacity, so pause it outright
       once the fade-out finishes — an ongoing cost for the rest of the
       visit otherwise — and resume it if the visitor scrolls back up
       past this point. */
    var heroKolamEl = q('.hero-kolam');
    actOne.fromTo('.hero-kolam',
      { opacity: .16 },
      {
        opacity: 0, duration: 0.025, ease: 'none',
        onComplete: function () { if (heroKolamEl) heroKolamEl.style.animationPlayState = 'paused'; },
        onReverseComplete: function () { if (heroKolamEl) heroKolamEl.style.animationPlayState = 'running'; }
      }, '<');

    actOne.fromTo('.expand',
      { left: '9.8%', scale: 0, opacity: 1 },
      { left: '48%', scale: 3, opacity: 1, duration: 0.1, ease: 'power2.out' }, '<')
      .fromTo('.expand__box', { left: -12 }, { left: 0, duration: 0.1, ease: 'power2.out' }, '<');

    actOne.fromTo(expandText,
      { x: function () { return expandText.offsetWidth * (window.innerWidth <= 1280 ? 0.5 : 0.3); } },
      { x: function () { return -expandText.offsetWidth; }, duration: 0.2, ease: 'power1.inOut' },
      '<+=0.1');

    actOne.fromTo('.expand__ring',
      { scale: 1, opacity: 1 },
      { scale: 3, opacity: 0, duration: 0.2, ease: 'power2.out' }, '<')
      .fromTo('.expand__core',
        { backgroundColor: '#ffffff' },
        { backgroundColor: 'rgba(255,255,255,0)', duration: 0.1, ease: 'none' }, '<')
      .fromTo('.expand__dots',
        { opacity: 0, rotate: 0, scale: 2.5 },
        { opacity: 1, rotate: 180, scale: 3.5, duration: 0.12 }, '<');

    actOne.fromTo('.expand__core-fill', { scale: 1 }, { scale: 0, duration: 0.05, ease: 'power2.out' }, '>')
      .fromTo('.expand__dots',
        { opacity: 1, rotate: -180, scale: 3.5 },
        { opacity: 0, rotate: 0, scale: 0, duration: 0.1, ease: 'power3.out' }, '<')
      .fromTo(expandText, { opacity: 1 }, { opacity: 0, duration: 0.1 }, '<');

    actOne.fromTo('.act-text--1',
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.03, ease: 'power2.in' }, '<');

    /* two clusters of word orbs */
    [
      { text: '.act-text--2', box: '.spheres__box--1', scale: 1 },
      { text: '.act-text--3', box: '.spheres__box--2', scale: 0.3 }
    ].forEach(function (step, i) {
      var prev = i === 0 ? '.act-text--1' : ['.act-text--2', '.act-text--3'][i - 1];
      var prevBox = i === 0 ? null : ['.spheres__box--1', '.spheres__box--2'][i - 1];

      if (i === 0) {
        actOne.fromTo(prev, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0, duration: 0.03, ease: 'power2.out' });
      } else {
        actOne.fromTo(prevBox, { opacity: 1, scale: 1 }, { opacity: 0, scale: 5, duration: 0.05, ease: 'power1.out' });
        actOne.fromTo(prev + ' .tx02',
          { opacity: 1, yPercent: 0 },
          { opacity: 0, yPercent: -100, duration: 0.02, ease: 'power2.out' }, '<');
      }

      actOne.fromTo(step.text + ' .tx02',
        { opacity: 0, yPercent: 100 },
        { opacity: 1, yPercent: 0, duration: 0.02, ease: 'power1.in' }, '<')
        .fromTo(step.box, { scale: 0 }, { scale: 1, duration: 0.02, ease: 'power2.inOut' }, '<')
        .fromTo(step.box + ' .orb',
          { opacity: 0, scale: step.scale, z: -2000 },
          { opacity: 1, scale: 1, z: 0, ease: 'back.out(1.05)', stagger: 0.004, duration: 0.02 }, '<');
    });

    /* clusters out, white act in */
    actOne.fromTo('.spheres', { opacity: 1 }, { opacity: 0, duration: 0.05, ease: 'power2.out' })
      .fromTo('.spheres__box--2', { opacity: 1, scale: 1 }, { opacity: 0, scale: 5, duration: 0.1, ease: 'power1.out' }, '<')
      .fromTo('.act-text', { opacity: 1 }, { opacity: 0, duration: 0.05, ease: 'power2.out' }, '<')
      .to({}, { duration: 0.01 }, '<');

    actOne.to('.film', { opacity: 1, duration: 0.1, ease: 'power2.in' }, '<')
      .to('.film__white', { opacity: 1, duration: 0.05, ease: 'power2.out' }, '<')
      .to('.film__rings', { opacity: 1, duration: 0.04, ease: 'none' }, '<')
      .fromTo('.film__ring',
        { opacity: 0, rotate: 0, scale: 0, xPercent: -50, yPercent: -50 },
        {
          opacity: 1, scale: 1, rotate: -360, xPercent: -50, yPercent: -50,
          duration: 0.12,
          stagger: 0.002,
          immediateRender: false,
          onComplete: function () {
            gsap.set(rings, { rotate: -360 });
            ringSpin.restart();
          },
          onReverseComplete: function () { ringSpin.pause(); }
        }, '>')
      .to('.film__disc', { opacity: 1, scale: 1, duration: 0.05, ease: 'power1.out' }, '<')
      .fromTo('.film__txt--top .tx02',
        { opacity: 0, xPercent: 55 },
        { opacity: 1, xPercent: 0, duration: 0.05, ease: 'power2.out' }, '<')
      .fromTo('.film__txt--bottom .tx02',
        { opacity: 0, xPercent: -55 },
        { opacity: 1, xPercent: 0, duration: 0.05, ease: 'power2.out' }, '<')
      .fromTo('.film__copy',
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, '<')
      .fromTo('.film__copy .pill',
        { pointerEvents: 'none' },
        { pointerEvents: 'auto', duration: 0.01 }, '<')
      .to('.film__blur', { opacity: 1, duration: 0.05 }, '<')
      .to({}, { duration: 0.04 });

    /* ----------------------------------------------- seam: white -> black */
    var seamTl = gsap.timeline({
      scrollTrigger: { trigger: '#seam', start: 'top 60%', end: '+=5%', scrub: 0.5 }
    });
    seamTl.to('#seam', { backgroundColor: '#000', duration: 0.1, ease: 'none' });

    /* ------------------------------------------------------ 02 / farewell
       the closing page — no pin, just a scrub reveal: the couple slide in
       from either side and meet at the top, their speech bubbles pop in
       right after like a comic-book beat, then the closing line fades in */
    gsap.set('#groomFigure', { x: -110, opacity: 0 });
    gsap.set('#brideFigure', { x: 110, opacity: 0 });
    gsap.set('#groomFigure .farewell__bubble', { xPercent: -50, x: -40, opacity: 0, scale: .7 });
    gsap.set('#brideFigure .farewell__bubble', { xPercent: -50, x: 40, opacity: 0, scale: .7 });
    gsap.set('.farewell__copy .tx02', { opacity: 0, y: 20 });

    gsap.timeline({
      scrollTrigger: { trigger: '#farewell', start: 'top 65%', end: 'center center', scrub: 1 }
    })
      .to(['#groomFigure', '#brideFigure'], { opacity: 1, duration: 0.4, ease: 'none' }, 0)
      .to('#groomFigure', { x: 0, duration: 0.6, ease: 'none' }, 0)
      .to('#brideFigure', { x: 0, duration: 0.6, ease: 'none' }, 0)
      .to('.farewell__bubble', { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, '>-0.1')
      .to('.farewell__copy .tx02', { opacity: 1, y: 0, duration: 0.4, ease: 'none' }, '>-0.05');

    /* cleanup for the matchMedia context */
    return function () {
      ringSpin.kill();
      gsap.set('.expand, .expand__box, .expand__ring, .expand__core, .expand__core-fill, .expand__dots, .expand__text', { clearProps: 'all' });
      gsap.set('.orb, .spheres, .spheres__box, .act-text, .act-text .tx02, .hero-mark__type, .hero-kolam', { clearProps: 'all' });
      gsap.set('.film, .film__white, .film__blur, .film__rings, .film__ring, .film__disc, .film__copy, .film__txt .tx02', { clearProps: 'all' });
      gsap.set('#groomFigure, #brideFigure, .farewell__bubble, .farewell__copy .tx02', { clearProps: 'all' });
    };
  }

  /* refresh once fonts and layout are settled */
  window.addEventListener('orbyt:ready', function () {
    ScrollTrigger.refresh();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})(window, document);
