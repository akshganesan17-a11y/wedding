/* ==========================================================================
   ORBYT sample — intro sequence
   The warp jump: light streaks fly past while the couple's own photos fly
   the same outward path and dissolve, like the tunnel is partly made of
   snapshots. Photos are optional: if none are found, the streaks still
   play alone. Plain 2D canvas throughout (see js/canvas-scenes.js) — no
   WebGL, so there's nothing to stall on a first-use GPU texture upload
   and nothing that can fail to init on a phone.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var scenes = window.OrbytScenes;

  var intro = document.getElementById('intro');
  var warpState = scenes.warp(document.getElementById('introWarp'));
  var petalsLoop = scenes.petals(document.getElementById('introPetals'), { count: 12 });

  var MAX_PHOTOS = 20;
  var MIN_PHOTOS_FOR_SHUFFLE = 2;
  var INTRO_DURATION_S = 3.3;
  var SAFETY_TIMEOUT_MS = 6500;

  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;

    if (window.lenis) window.lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);

    gsap.to(intro, {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: function () {
        intro.classList.add('is-gone');
        if (warpState && warpState.loop) warpState.loop.stop();
        if (petalsLoop) petalsLoop.stop();
      }
    });

    document.body.classList.remove('is-locked');
    if (window.lenis) window.lenis.start();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();

    window.dispatchEvent(new CustomEvent('orbyt:ready'));
  }

  /* never trap the visitor if photo loading or the warp stalls */
  window.setTimeout(finish, SAFETY_TIMEOUT_MS);

  /* -------------------------------------------------------------- photos
     scans images/1 through images/MAX_PHOTOS, trying a couple of common
     extensions for each number. A single missing or renamed photo (a gap
     in the numbering) is skipped rather than treated as "the set ends
     here" — a folder that isn't kept perfectly sequential shouldn't
     silently lose every photo after the gap. */
  var PHOTO_EXTS = ['jpg', 'png'];

  function probePhotos(max) {
    return new Promise(function (resolve) {
      var loaded = [];
      var i = 1;
      var extIdx = 0;

      function tryExt() {
        if (extIdx >= PHOTO_EXTS.length) {
          extIdx = 0;
          i++;
          if (i > max) { resolve(loaded); return; }
          tryExt();
          return;
        }
        var img = new Image();
        img.onload = function () {
          loaded.push(img);
          extIdx = 0;
          i++;
          if (i > max) { resolve(loaded); return; }
          tryExt();
        };
        img.onerror = function () { extIdx++; tryExt(); };
        img.src = 'images/' + i + '.' + PHOTO_EXTS[extIdx];
      }
      tryExt();
    });
  }

  probePhotos(MAX_PHOTOS).then(function (photos) {
    if (finished) return;

    var tooFewPhotos = photos.length < MIN_PHOTOS_FOR_SHUFFLE;
    /* rapid image motion is a known motion/photosensitivity concern */
    var motionBlocked = scenes && scenes.reduceMotion;
    if (!tooFewPhotos && !motionBlocked && warpState && warpState.setPhotos) {
      warpState.setPhotos(photos);
    }
  });

  /* ------------------------------------------------------------ timeline
     speed ramps up then settles; the photo shards (once handed to warp
     via setPhotos above) ride the same state.speed, so they surge and
     settle with the streaks instead of running on their own clock. */
  var tl = gsap.timeline({ delay: 0.15, onComplete: finish });

  tl.to(warpState, {
    speed: 3.4,
    duration: 1.5,
    ease: 'power2.in',
    onStart: function () { warpState.loop.start(); }
  }, 0)
    .to(warpState, { speed: 0.45, duration: 1.4, ease: 'power2.out' }, 1.5)
    .to({}, { duration: INTRO_DURATION_S - 2.9 }, 2.9);
})(window, document);
