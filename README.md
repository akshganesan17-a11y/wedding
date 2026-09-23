# The wedding of Akash & Iswaryalakshmi

A scroll-driven invitation built on a from-scratch rebuild of the experience at
`orbyt.theater/kr.php`: the same pinned scroll acts and UI, working on a phone browser
as well as on desktop.

The intro is a quick warp jump through space instead of a loading bar: light streaks fly
past while the couple's own photos ride the same outward path — small and dim as they
leave the centre, growing and brightening as they approach, fading out again before they'd
clip the frame edge — before everything fades into the invitation - *The wedding of /
Akash & / Iswaryalakshmi*
- over the starfield, with no nav chrome (no logo top-left, no language or menu buttons
top-right). The ambient theme track starts playing automatically underneath it. The
whole site is short by design and ends right after the couple's own content -
invitation, then a farewell line: "With all our love, Akash & Iswaryalakshmi" - nothing
more.

A surreal thread runs through the whole thing: marigold petals drift upward through the
cosmos everywhere you go — the intro, the invitation, the farewell — and partway through
their climb each one dissolves into a small burst of starlight. Tradition becoming myth,
literally: the wedding's own marigolds and the site's cosmic language fused into one
motif instead of sitting side by side.

Traditional South Indian Hindu wedding motifs run through every section, researched
rather than guessed at (mandala/kolam symbolism, marigold and mango-leaf thoranam
garlands as the standard florals — see Sources below): an ornamental bow (ceremonial
rather than devotional) opens the invitation, a kolam-style ring (the geometric
threshold pattern drawn at South Indian doorways) turns slowly behind the couple's
names - and only there, fading out with the names as you scroll past so it never bleeds
into later sections. All original SVG line art in the same gold-and-warm palette as the
petals, not any copied template.

## Run it

Any static server works — the page is plain HTML/CSS/JS:

```bash
cd /Users/akash/Documents/newSample
python3 -m http.server 8777
# then open http://localhost:8777
```

Query string: `?sound=off` starts with the theme track muted (default is on, no toggle
shown on screen).

A small "Scroll" hint with a bouncing chevron appears bottom-center once the intro
clears, and disappears for good on the visitor's first scroll/tap/keypress — the site
has no nav chrome otherwise, so this is the only signal a first-time visitor gets that
there's more below the fold.

## What is where

| File | What it holds |
| --- | --- |
| `index.html` | All markup: intro, the invitation, the farewell page |
| `css/base.css` | Reset, design tokens, type scale, cursor trail, buttons |
| `css/main.css` | Section styles and every procedural scene (spheres, film disc) |
| `js/canvas-scenes.js` | Canvas work: starfield, warp jump, marigold petals, farewell haze, cursor trail |
| `js/intro.js` | Loads `images/1.jpg`, `2.jpg`, ... and hands them to the warp jump, times the reveal, unlocks the page |
| `js/sound.js` | Autoplays the looping theme track (`music/theme.mp3`), retried on the visitor's first tap/click/key if the browser blocked it |
| `js/ui.js` | Cursor (shooting-star trail), ambient canvas wiring, the "Scroll" hint |
| `js/scroll.js` | Lenis + GSAP ScrollTrigger choreography for the pinned invitation act and the scroll reveal after it |

### The intro's photos

`intro.js` scans `images/1.jpg` through `images/20.jpg` (trying `.png` too for each
number) and hands whatever it finds to the warp jump's photo-shard layer — the streaks'
own outward flight path, reused for snapshots instead of light. A gap in the numbering
(a photo renamed or removed) is skipped rather than treated as "the set ends here," so
the whole set doesn't silently disappear behind one missing file. **With fewer than 2
photos found, the shard layer is skipped and only the streaks play** — same if
`prefers-reduced-motion` is set, since rapid image motion is a motion-sensitivity
concern. Either way the intro degrades gracefully rather than breaking.

It's plain 2D canvas (`ctx.drawImage`, see `warp()` in `js/canvas-scenes.js`) — no
WebGL, so there's no GPU texture upload to ever stall on and nothing that can fail to
initialize on a phone. Each shard is dimmed and slightly desaturated (`ctx.filter`) so
raw phone photos don't read too bright/contrasty against the dark tunnel, and fades in
as it leaves the centre and out again before it would clip the frame edge, rather than
popping in or cutting off abruptly.

Photos should be pre-resized before landing in `images/` — anything in that folder ships
as-is, full resolution included:

```bash
sips -Z 1800 -s format jpeg -s formatOptions 80 IMG_1234.jpg --out images/5.jpg
```

## The scroll score

1. **Invitation** - pinned 1500% (700% on mobile). The names fade as the circle
   swallows the screen with a welcoming line running through it, then two
   word-sphere clusters carry the Reception and Muhurtham details before
   the white act resolves: the couple's photo in a circular frame with a
   "Get Directions" link out to the venue on Google Maps.
2. **Farewell** — not pinned, just a scrub reveal over a soft drifting violet glow: the
   couple's own portraits (`assets/groom-portrait.png`, `assets/bride-portrait.png` —
   transparent cutouts, no background box) slide in from either side and meet at the
   top, oval comic-style speech bubbles pop in above each one in Tamil ("இனிமேல் நாங்க
   ரெண்டு பேரும்… ❤️" / "ஒரே டீம்! 🥰"), then "With all our love, Akash & Iswaryalakshmi"
   fades in beneath them. No wordmark, no contact button, no nav, no closing page after
   it — the page simply
   ends here.

## Notes

- Everything is self-contained apart from three CDN dependencies (GSAP + ScrollTrigger,
  Lenis, and the Jost/Pretendard webfonts) — no WebGL, no three.js.
- Every visual is generated rather than sourced: CSS gradient compositions, inline SVG
  and canvas — no stock photography or video (except the couple's own photos in
  `assets/couple.jpg` and `images/`).
- The cursor is a shooting-star trail (canvas, `mix-blend-mode: difference` so it stays
  visible on both dark and light backgrounds), not a plain dot.
- Mobile specifics: `svh` units so the pinned act does not jump when the URL bar moves,
  hover affordances behind `@media (hover: hover)`, safe-area insets on the fixed chrome,
  16px form fields so iOS does not zoom, `overscroll-behavior: none` so pull-to-refresh
  does not fight the smooth scroll, and 44px tap targets.
- `prefers-reduced-motion` stops the ambient canvas loops and skips the intro's photo
  shards (the warp still plays).
- The petals (`scenes.petals`) are additive-blended, warm-toned particles with no fixed
  shape library — each is drawn as a bezier petal, drifts with a sine-wave sway, and at
  a randomized height dissolves into 5-10 spark particles that scatter and fade, then
  the petal respawns from the bottom. Density is tuned per section (`count` option) so
  it stays a background texture in the main invitation and reads more prominently in
  the emptier intro and farewell.
- There is no skip button and no on-screen sound toggle: the intro sequence is kept
  short (~4s) and always plays out (a hidden safety timeout guarantees it can't get
  stuck).
- The theme track calls `.play()` immediately on load (muted only via `?sound=off`),
  and again on the visitor's first pointer/click/key press if that first attempt was
  blocked. This is a hard browser limit, not a bug: Chrome (and others) refuse audible
  autoplay until a *qualifying* user gesture — a click, tap, or keypress. **Scrolling
  does not count**, even though it's the most natural first action on this site, so a
  visitor who only scrolls (common on a trackpad/mouse, without ever clicking) will
  stay muted until they click or tap something, e.g. the "Get Directions" link. There
  is no code-level fix for this without reintroducing a visible control to click.
- The theme track pauses whenever the tab isn't visible (switched away, minimized,
  backgrounded on mobile) and resumes right where it left off when the visitor comes
  back, via the Page Visibility API (`visibilitychange`) in `js/sound.js`.
- The colour arcs behind the white act (`.film__ring`, up to 19 elements) keep spinning
  on an infinite GSAP tween once triggered — it's only paused going back up past the
  start of that act, so scrolling on past it forward used to leave the rings spinning
  in the background for the rest of the visit. `onLeave` on that ScrollTrigger now
  pauses it the same way `onLeaveBack` already did.
- After the pinned philosophy act releases, the section scrolls away normally for one
  more viewport height, still showing the white film act frozen at its last frame —
  against the black farewell section right below that read as a hard, jarring cut
  rather than a fade. A separate scrub tween now fades `#philosophy` itself to opacity
  0 across exactly that hand-off distance (`start: 'bottom bottom'`, `end: 'bottom
  top'`), revealing the page's own black backdrop instead.
