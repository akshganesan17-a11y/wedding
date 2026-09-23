/* ==========================================================================
   ORBYT sample — ambient music
   A real looping track that starts on page load. Browsers only guarantee
   autoplay when the element is muted, so it starts muted (play() succeeds
   immediately, no gesture required) and unmutes with a volume fade-in on
   the visitor's first pointer/key/touch — so the track is already running
   by the time it becomes audible, not just starting then.
   Pauses whenever the tab isn't visible (switched away, minimized, backgrounded
   on mobile) and resumes right where it left off when the visitor comes back.
   Query string ?sound=off skips it entirely.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var soundOn = params.get('sound') !== 'off';

  var audio = (function () {
    var el = new Audio('music/theme.mp3');
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    /* muted autoplay is always allowed, even with no prior user gesture —
       audible autoplay is not. Starting muted lets .play() actually
       succeed immediately on load (the track really is running from the
       first frame), then the first tap/click/key unmutes it and fades
       the volume in, rather than only starting playback at that point. */
    el.muted = true;
    var target = 0.55;
    var pausedForHide = false;

    function ramp(to, time) {
      gsap.to(el, { volume: to, duration: time || 1.2, ease: 'none', overwrite: true });
    }

    function play() {
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
    }

    return {
      el: el,
      start: function () { play(); },
      nudge: function () {
        el.muted = false;
        if (el.paused && !pausedForHide) play();
        ramp(target, 1.6);
      },
      pauseForHide: function () {
        if (el.paused) return;
        pausedForHide = true;
        gsap.killTweensOf(el);
        el.volume = 0;
        el.pause();
      },
      resumeFromHide: function () {
        if (!pausedForHide) return;
        pausedForHide = false;
        play();
        ramp(target, .8);
      }
    };
  })();

  if (soundOn) {
    audio.start();
    /* every event type that grants "user activation" per the HTML spec —
       whichever fires first unlocks playback. Scrolling (wheel/touchmove)
       does not qualify, so a visitor who only scrolls stays muted until
       their first tap, click, or keypress. */
    ['pointerdown', 'mousedown', 'click', 'keydown', 'touchstart'].forEach(function (evt) {
      window.addEventListener(evt, function once() {
        audio.nudge();
        window.removeEventListener(evt, once);
      }, { passive: true });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) audio.pauseForHide();
      else audio.resumeFromHide();
    });
  }

  window.ORBYT_AUDIO = audio;
})(window, document);
