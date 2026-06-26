// ============================================
// Scatter layer: 4 floating shapes — two near the top of the page (c1,
// c2), two near the bottom (c15, c16). Each renders ON TOP of page
// content (no positioned stacking context on <main>, so #scatterLayer's
// z-index wins) — shapes are meant to overlay text and feel like they're
// floating above the page, transparent at rest, filling solid with
// their own border color on hover.
//
// c1, c2, c15 use simple percentages of the full page width/height.
// c16 is handled separately below (placeC16) because a flat percentage
// put it on top of the LinkedIn/Résumé/Medium links at some viewport
// widths — it's now anchored to real measured positions (the nav's
// right edge and the contact section's content edge) so it can never
// land in either zone, at any viewport width.
//
// Desktop-only (matches the CSS, which hides #scatterLayer below
// 901px).
// ============================================
(function buildScatterShapes() {
  const layer = document.getElementById('scatterLayer');
  if (!layer) return;
  if (!window.matchMedia('(min-width: 901px)').matches) return;

  // Each entry: top/left as % of full document height/width, width/height
  // in px. color is one of scatter-shape--c1/c2/c15 (style.css) — each
  // shape keeps its own distinct hover color. c16 is built separately.
  const plan = [
    { topPct: 2.0,  leftPct: 80.9, width: 215, height: 215, color: 'scatter-shape--c1' },
    { topPct: 6.1,  leftPct: 24.8, width: 215, height: 229, color: 'scatter-shape--c2' },
    { topPct: 91.5, leftPct: 79.1, width: 215, height: 193, color: 'scatter-shape--c15' },
  ];

  let built = false;

  function place() {
    // Measure from <main>'s own bottom edge, NOT document.documentElement
    // .scrollHeight — the layer is itself a child of <body>, so reading
    // the document's total scroll height included the layer's OWN
    // previous height in the measurement. Each pass could then grow the
    // layer to match an already-inflated number, which grew the
    // document further, compounding into a large empty gap at the
    // bottom of the page. Anchoring to main's real, content-only height
    // breaks that feedback loop entirely.
    const main = document.querySelector('main');
    const docHeight = main
      ? Math.round(main.getBoundingClientRect().bottom + window.scrollY)
      : document.documentElement.scrollHeight;
    const docWidth = document.documentElement.clientWidth;

    if (!built) {
      const fragment = document.createDocumentFragment();
      plan.forEach((item) => {
        const shape = document.createElement('div');
        shape.className = `float-shape ${item.color}`;
        shape.style.width = `${item.width}px`;
        shape.style.height = `${item.height}px`;
        shape.style.top = `${Math.round(docHeight * item.topPct / 100)}px`;
        shape.style.left = `${Math.round(docWidth * item.leftPct / 100)}px`;
        fragment.appendChild(shape);
      });
      layer.appendChild(fragment);
      built = true;
    } else {
      // Re-measure on resize/font-load so percentages stay accurate if
      // the page's total height or width changes after first paint.
      Array.from(layer.children).forEach((shape, i) => {
        const item = plan[i];
        if (!item) return;
        shape.style.top = `${Math.round(docHeight * item.topPct / 100)}px`;
        shape.style.left = `${Math.round(docWidth * item.leftPct / 100)}px`;
      });
    }

    layer.style.height = `${docHeight}px`;
  }

  place();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(place).catch(() => {});
  }

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 901px)').matches) place();
  });
})();

// ============================================
// c16 (crimson): placed in the nav's own empty gutter column, next to
// the #contact section, instead of at a flat page-width percentage —
// that's what was letting it drift onto the LinkedIn/Résumé/Medium
// links at some viewport widths. Anchored to REAL measured positions
// (the nav's rendered right edge, the contact section's rendered left
// content edge, and the contact section's rendered bottom edge) so the
// safe zone is always correct however the layout reflows. Width/height
// shrink to fit the gutter if it's ever narrower than the shape's usual
// size, rather than spilling past either edge. Vertically, the shape's
// own bottom edge is pinned just above #contact's bottom edge, so it
// sits at the lower edge of the page regardless of the shape's height
// relative to the section's padding.
// ============================================
(function placeC16() {
  const baseWidth = 291;
  const baseHeight = 244;

  let shape = null;

  function place() {
    const isDesktop = window.matchMedia('(min-width: 901px)').matches;
    if (!isDesktop) {
      if (shape) shape.style.display = 'none';
      return;
    }

    const nav = document.querySelector('.sectionnav');
    const contact = document.getElementById('contact');
    const layer = document.getElementById('scatterLayer');
    if (!nav || !contact || !layer) return;

    const navRect = nav.getBoundingClientRect();
    const contactRect = contact.getBoundingClientRect();

    // Safe horizontal band: from a bit right of the nav's own (possibly
    // hover-scaled) text, to a bit left of where the contact section's
    // real content begins. Both edges are measured live, never assumed.
    const margin = 20;
    const bandLeft = navRect.right + margin;
    const bandRight = contactRect.left - margin;
    const bandWidth = Math.max(bandRight - bandLeft, 0);

    // Shrink to fit if the gutter is narrower than the shape's usual
    // size, rather than overflowing either edge — proportional scaling
    // keeps it from ever looking squashed in one dimension only.
    const scale = bandWidth > 0 ? Math.min(1, bandWidth / baseWidth) : 0;
    const width = Math.max(Math.round(baseWidth * scale), 40);
    const height = Math.max(Math.round(baseHeight * scale), 34);

    // Vertical anchor: bottom edge of the shape lines up with the
    // bottom edge of #contact (a few px of breathing room above it),
    // so it visually sits at the lower edge of the page regardless of
    // how tall the shape is relative to the section's own padding.
    if (bandWidth < 40) {
      if (shape) shape.style.display = 'none';
      return;
    }

    const bottomMargin = 12;
    const left = Math.round(bandLeft + (bandWidth - width) / 2);
    const top = Math.round(window.scrollY + contactRect.bottom - bottomMargin - height);

    if (!shape) {
      shape = document.createElement('div');
      shape.className = 'float-shape scatter-shape--c16';
      layer.appendChild(shape);
    }
    shape.style.display = '';
    shape.style.width = `${width}px`;
    shape.style.height = `${height}px`;
    shape.style.left = `${left}px`;
    shape.style.top = `${top}px`;
  }

  place();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(place).catch(() => {});
  }

  window.addEventListener('resize', place);
})();

// ============================================
// Floating shapes: ambient motion for all 16 shapes in the scatter layer.
// Two layers of movement, applied to different elements so they don't
// fight over the same `transform` property:
//   1. Idle bob — a slow CSS keyframe animation on each shape's INNER
//      wrapper, running constantly regardless of scroll. This is what
//      makes them feel alive even when the page is sitting still.
//   2. Scroll parallax — JS sets a translateY on the OUTER .float-shape
//      itself, based on scroll position, at a per-shape speed. Scroll
//      velocity also temporarily scales up the bob's amplitude slightly,
//      so the drift visibly quickens while scrolling without becoming
//      large or distracting.
//
// Respects prefers-reduced-motion by skipping all JS-driven transforms;
// the idle bob keyframes are already disabled globally for that case via
// the site's existing reduced-motion CSS block.
// ============================================
(function floatShapes() {
  const allShapes = Array.from(document.querySelectorAll('.float-shape'));
  if (!allShapes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Wrap each shape's content in an inner element so the idle CSS bob
  // animation and the JS scroll transform never overwrite each other —
  // each owns its own element's `transform` property.
  allShapes.forEach((shape) => {
    const inner = document.createElement('div');
    inner.className = 'float-shape__bob';
    while (shape.firstChild) inner.appendChild(shape.firstChild);
    shape.appendChild(inner);
  });

  if (reduceMotion) return;

  // Each shape gets its own scroll-parallax speed/direction so they don't
  // all move in lockstep — small values, this stays ambient, not showy.
  const speeds = [0.07, -0.1, 0.05, -0.06, 0.09, -0.04, 0.08, -0.05, 0.06, -0.07, 0.04, -0.09];

  let lastScrollY = window.scrollY;
  let ticking = false;
  let settleTimer = null;

  function setBoost(value) {
    document.documentElement.style.setProperty('--float-boost', value.toFixed(2));
  }

  function update() {
    const now = window.scrollY;
    // Velocity nudges the bob's amplitude up a bit while actively
    // scrolling; a short debounced timer eases it back to 1 once
    // scrolling stops, since no further scroll events would otherwise
    // ever bring the boost back down on its own.
    const velocity = Math.min(Math.abs(now - lastScrollY), 40);
    lastScrollY = now;
    setBoost(1 + (velocity / 40) * 0.6);

    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => setBoost(1), 250);

    allShapes.forEach((shape, i) => {
      const rect = shape.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return; // off-screen guard
      const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
      const speed = speeds[i % speeds.length];
      shape.style.transform = `translateY(${(mid * speed).toFixed(1)}px)`;
    });

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();


// ============================================
// Wrap headline line text in inner spans (for mask-reveal effect)
// Must run before the audience switcher, which depends on these spans.
// ============================================
document.querySelectorAll('[data-reveal-lines] .line').forEach((line) => {
  const text = line.textContent;
  line.textContent = '';
  const inner = document.createElement('span');
  inner.textContent = text;
  line.appendChild(inner);
});

// ============================================
// Audience switcher: clicking a label swaps the headline copy
// ============================================
const bios = {
  anyone: ["Hi, I'm Alex —", "a product manager", "who finds the story", "hiding in the data."],
  hiring: ["I'm an early-career", "data PM who ships,", "measures, and tells you", "honestly what worked."],
  engineers: ["I write the SQL", "before I write the spec —", "so the ask already", "matches the schema."],
  analysts: ["I used to be you —", "now I fight for the", "metric definition", "before the roadmap."],
  founders: ["I find the one number", "that's actually lying", "to the team, and", "go fix it first."],
};

const audienceButtons = document.querySelectorAll('.audience');
const headline = document.getElementById('heroHeadline');

audienceButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.bio;
    if (!bios[key] || btn.getAttribute('aria-pressed') === 'true') return;

    audienceButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');

    headline.classList.add('is-swapping');
    setTimeout(() => {
      const lines = headline.querySelectorAll('.line');
      bios[key].forEach((text, i) => {
        if (lines[i]) {
          const inner = lines[i].querySelector('span') || lines[i];
          inner.textContent = text;
        }
      });
      headline.classList.remove('is-swapping');
    }, 220);
  });
});


// ============================================
// Mobile nav toggle -> reuses dotnav as a dropdown list
// Note: intentionally NOT named navToggle/dotnav (matching their element
// ids) — Safari throws a hard SyntaxError on top-level const/let that
// collides with an element id, which aborts this entire script in Safari.
const navToggleBtn = document.getElementById('navToggle');
const dotnavEl = document.getElementById('dotnav');

if (navToggleBtn) {
  navToggleBtn.addEventListener('click', () => {
    const isOpen = dotnavEl.classList.toggle('dotnav--open');
    navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Close mobile nav after a link is tapped
document.querySelectorAll('.sectionnav a').forEach((link) => {
  link.addEventListener('click', () => {
    dotnavEl.classList.remove('dotnav--open');
    if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// Scroll-spy: highlight active link + reveal sections
// ============================================
const sections = document.querySelectorAll('main .section[id]');
const navLinks = document.querySelectorAll('.sectionnav a');

// Track each section's current intersection ratio; whichever is highest wins
// "active" on the nav. This is more robust than checking a single boundingClientRect
// condition, which can land in a gap where no section satisfies it.
const visibleRatios = new Map();

function updateActiveLink() {
  let bestId = null;
  let bestRatio = 0;
  visibleRatios.forEach((ratio, id) => {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = id;
    }
  });
  if (bestId === null) return;
  navLinks.forEach((l) => l.classList.remove('active'));
  const link = document.querySelector(`.sectionnav a[href="#${bestId}"]`);
  if (link) link.classList.add('active');
}

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute('id');
      visibleRatios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
    });
    updateActiveLink();
  },
  { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
);

sections.forEach((section) => spyObserver.observe(section));

// Opacity reveal (.is-visible, see the "SCROLL REVEAL" CSS rule) is
// driven by a SEPARATE, broader query than the nav-tracking one above.
// `sections` above is deliberately scoped to [id] only, so a section
// without an id (e.g. .approach-mobile-fallback, which intentionally
// has no id so it's never double-counted by the nav highlighter) won't
// match it — but that also meant it was never observed for the reveal
// either, so it sat at opacity: 0 forever, looking like a permanent
// blank gap on mobile even though its layout/content were entirely
// correct. This query covers every real .section regardless of id, so
// the reveal applies uniformly while the nav-tracking stays unaffected.
const revealSections = document.querySelectorAll('main .section');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  },
  { threshold: 0.1 }
);
revealSections.forEach((section) => revealObserver.observe(section));

// ============================================
// Stagger-group reveal: children cascade in as the group enters view
// ============================================
const staggerGroups = document.querySelectorAll('.stagger-group');

staggerGroups.forEach((group) => {
  const children = Array.from(group.children);
  children.forEach((child, i) => {
    child.style.transitionDelay = `${i * 90}ms`;
  });
});

const staggerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // Toggle both ways so the reveal animation re-triggers every time the
      // section re-enters view, not just on first load.
      entry.target.classList.toggle('stagger-group--visible', entry.isIntersecting);
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
);

staggerGroups.forEach((group) => staggerObserver.observe(group));

// ============================================
// Count-up stats in hero
// ============================================
const counters = document.querySelectorAll('.count');

function animateCount(el) {
  const target = parseFloat(el.dataset.target);
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.round(target * eased);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => countObserver.observe(counter));

// Respect reduced motion: skip count-up animation, show final values immediately
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  counters.forEach((el) => {
    el.textContent = el.dataset.target;
  });
  countObserver.disconnect();
}

// ============================================
// WORK: horizontal scroll-snap, desktop only.
//
// #work is a tall outer section; .work-pin sticks at the same height the
// hero content sits at (read live from the hero, so it can never drift out
// of sync with that CSS value) for exactly as long as it takes to scroll
// through the reserved extra height. During that stretch, ordinary page
// scroll — from anywhere on the page, mouse wheel or trackpad — is read
// and mapped straight onto the card track's position. There is no wheel
// interception and no separate "must be hovering the cards" requirement:
// it's the same scroll the whole page already uses, just translated into
// horizontal motion while .work-pin happens to be pinned in place.
// Below 901px none of this applies — no extra height, no sticky position,
// plain stacked cards exactly as the section looked originally.
// ============================================
(function setupWorkHscroll() {
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const root = document.documentElement;
  const section = document.getElementById('work');
  const pin = document.getElementById('workPin');
  const track = document.getElementById('workTrack');
  const hero = document.querySelector('.hero');
  if (!section || !pin || !track || !hero) return;

  const cardCount = track.children.length;
  let dockY = 178;          // fixed dock offset, in px from the viewport top
  let slideSpan = 1850;     // px of scroll spent actually sliding between cards
  let trailingPad = 400;    // EDIT ME: extra px of scroll AFTER the last card
                             // settles, before the pin releases — this is the
                             // "buffer at the end" knob. Raise it if the last
                             // card still feels like it arrives and immediately
                             // gets yanked away; lower it if there's now a dead
                             // patch of scrolling where nothing seems to happen.
  let scrollSpan = 0;       // slideSpan + trailingPad — total reserved height

  function measure() {
    if (!desktopQuery.matches) return;
    root.style.setProperty('--dock-y', `${dockY}px`);
    scrollSpan = slideSpan + trailingPad;
    root.style.setProperty('--work-scroll-span', `${scrollSpan}px`);
  }

  // Ease the approach into each card, so it decelerates to a real stop
  // rather than arriving at a constant rate and getting cut off.
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Ease EACH card-to-card transition independently, rather than easing the
  // whole 0..1 journey as one curve. A single curve over the whole range
  // only decelerates at the very first and very last card — every card in
  // between sits at the curve's steepest, fastest point and just blows
  // through without ever settling, which is what made the last card feel
  // rushed (it was decelerating from full speed with no distance budgeted
  // for that, because the curve "spent" its slow part on the very ends only).
  // Easing per-segment means every single card gets its own slow-in,
  // slow-out arrival, no matter where it sits in the sequence.
  function applyOffset(offsetFraction) {
    const totalSteps = cardCount - 1; // number of card-to-card transitions
    const scaled = offsetFraction * totalSteps;
    const segment = Math.min(Math.floor(scaled), totalSteps - 1);
    const localT = totalSteps === 0 ? 0 : Math.max(0, Math.min(1, scaled - segment));
    const easedLocal = easeInOutCubic(localT);
    const steps = (offsetFraction >= 1) ? totalSteps : segment + easedLocal;
    track.style.transform = `translateX(-${steps * (100 / cardCount)}%)`;
  }

  function onScroll() {
    if (!desktopQuery.matches) {
      track.style.transform = '';
      return;
    }
    const rect = section.getBoundingClientRect();
    // Only `slideSpan` (not the full scrollSpan) actually moves the track —
    // the remaining `trailingPad` is scroll distance where progress is
    // already 1 and the pin is still held, giving the settled last card a
    // moment to breathe before normal page scroll resumes.
    const progress = slideSpan > 0 ? Math.max(0, Math.min(1, -rect.top / slideSpan)) : 0;
    applyOffset(progress);
  }

  function onResize() {
    measure();
    onScroll();
  }

  measure();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  desktopQuery.addEventListener('change', onResize);
})();

// ============================================
// APPROACH — two vertical card tracks, pinned via scroll, driven
// SEQUENTIALLY across one shared progress value (see the CSS comment
// above .approach-pin-section for the full mechanism description).
//
// progress 0   -> 0.5: right track slides from card 2 to card 3.
//                       Left track sits still on card 1 the entire time.
// progress 0.5 -> 1:   left track slides from card 1 to card 4.
//                       Right track sits still on card 3 the entire time.
//
// Each half gets its own eased 0->1 transition (easeInOutCubic), same
// easing function Work uses, so each slide decelerates into its
// landing card rather than arriving at a constant rate and stopping
// abruptly. This is genuinely scroll-POSITION-driven, not event/time
// based: onScroll always recomputes both tracks' transforms directly
// from how far the section has scrolled past its own top, so stopping
// mid-scroll freezes everything exactly where it is, and scrolling
// back up reverses every step cleanly with no special-case code needed
// for the "reverse" direction — it falls out of the math for free.
// ============================================
(function setupApproachPin() {
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  const root = document.documentElement;
  const section = document.getElementById('approach');
  const pin = document.getElementById('approachPin');
  const laneLeft = document.getElementById('approachLaneLeft');
  const trackLeft = document.getElementById('approachTrackLeft');
  const trackRight = document.getElementById('approachTrackRight');
  if (!section || !pin || !laneLeft || !trackLeft || !trackRight) return;

  let slideSpan = 2800;   // px of scroll spent on the two slides combined
  let trailingPad = 400;  // px of scroll AFTER both slides finish, before
                           // the pin releases — same "buffer at the end"
                           // idea as Work's trailingPad.
  let scrollSpan = 0;

  function measure() {
    if (!desktopQuery.matches) return;
    scrollSpan = slideSpan + trailingPad;
    root.style.setProperty('--approach-scroll-span', `${scrollSpan}px`);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function onScroll() {
    if (!desktopQuery.matches) {
      trackLeft.style.transform = '';
      trackRight.style.transform = '';
      return;
    }
    const rect = section.getBoundingClientRect();
    const progress = slideSpan > 0 ? Math.max(0, Math.min(1, -rect.top / slideSpan)) : 0;

    // First half (0 -> 0.5): right track slides through its full
    // journey — empty slot -> card 2 -> card 3, i.e. 2 card-heights of
    // travel out of 3 total slots. The track's own height is 300% of
    // the lane (3 slots), so moving 2 card-heights is -2/3 of the
    // TRACK's own height, i.e. -66.667%, not -200% — percentages in
    // translateY are relative to the element's own box, not to a
    // single child's height, so this has to be derived from the actual
    // slot count rather than assumed. Left track holds at card 1
    // (untouched) for this entire first half.
    const rightLocal = Math.max(0, Math.min(1, progress / 0.5));
    const rightEased = easeInOutCubic(rightLocal);
    const rightSlots = 3; // empty, card 2, card 3
    const rightStepsToMove = 2; // empty -> card 3 is 2 steps
    trackRight.style.transform = `translateY(-${rightEased * rightStepsToMove * (100 / rightSlots)}%)`;

    // Second half (0.5 -> 1): left track slides through its full
    // journey — card 1 -> card 4, i.e. 1 card-height of travel out of
    // 2 total slots. Track height is 200% of the lane (2 slots), so
    // moving 1 card-height is -1/2 of the track's own height (-50%),
    // not -100% — same reasoning as the right track above. Right track
    // holds at card 3 (already settled from the first half) for this
    // entire second half.
    const leftLocal = Math.max(0, Math.min(1, (progress - 0.5) / 0.5));
    const leftEased = easeInOutCubic(leftLocal);
    const leftSlots = 2; // card 1, card 4
    const leftStepsToMove = 1; // card 1 -> card 4 is 1 step
    trackLeft.style.transform = `translateY(-${leftEased * leftStepsToMove * (100 / leftSlots)}%)`;
  }

  function onResize() {
    measure();
    onScroll();
  }

  measure();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  desktopQuery.addEventListener('change', onResize);
})();
