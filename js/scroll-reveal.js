/*
 * Reveals photo cards as they scroll into view.
 *
 * Progressive enhancement, deliberately:
 *   - .js-motion is only added if this script runs, so with JavaScript
 *     disabled every photo renders normally.
 *   - Cards already on screen at load are never hidden, so there is no
 *     flash of blank grid.
 *   - Bails out entirely if the visitor asked for reduced motion.
 *
 * Why there is a sweep as well as an observer:
 * the gallery grids are CSS multi-column (columns: 3 320px), and the
 * images are lazy-loaded. Every image that loads rebalances the columns
 * and moves cards vertically - after the IntersectionObserver has
 * already decided about them. An observer only fires when intersection
 * CHANGES, so a card relocated into view by a rebalance can be left
 * invisible. The sweep re-checks pending cards on scroll, resize and
 * image load, which is what actually guarantees the invariant:
 *
 *     no card that is on screen is ever left at opacity 0.
 */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;
  if (!("IntersectionObserver" in window)) return;

  const cards = document.querySelectorAll(".photo-card");
  if (!cards.length) return;

  document.documentElement.classList.add("js-motion");

  const SETTLE_MS = 700;   // slightly longer than the CSS transition
  const STAGGER_MS = 60;   // between cards revealed in the same batch
  const MAX_STAGGER = 4;   // cap, so a big batch never crawls

  const pending = new Set();

  function finish(card) {
    window.setTimeout(() => {
      card.classList.add("is-settled");
      card.style.transitionDelay = "";
    }, SETTLE_MS + MAX_STAGGER * STAGGER_MS);
  }

  function reveal(card, order) {
    if (!pending.has(card)) return;
    pending.delete(card);
    observer.unobserve(card);
    if (order > 0) {
      card.style.transitionDelay = Math.min(order, MAX_STAGGER) * STAGGER_MS + "ms";
    }
    card.classList.add("is-visible");
    finish(card);
  }

  function revealInstantly(card) {
    // Already scrolled past. Show it with no animation - the visitor is
    // not looking at it, and animating would be wasted work.
    if (!pending.has(card)) return;
    pending.delete(card);
    observer.unobserve(card);
    card.style.transitionDelay = "";
    card.classList.add("is-visible", "is-settled");
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let n = 0;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          reveal(entry.target, n);
          n += 1;
        } else if (entry.boundingClientRect.bottom < 0) {
          revealInstantly(entry.target);
        }
      }
    },
    // threshold 0 and a positive bottom margin: a card reveals just
    // before it enters. No negative margin, because that creates a band
    // where a card is on screen but below the trigger line.
    { rootMargin: "0px 0px 12% 0px", threshold: 0 }
  );

  let ticking = false;

  function sweep() {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    let n = 0;
    for (const card of Array.from(pending)) {
      const r = card.getBoundingClientRect();
      if (r.bottom < 0) {
        revealInstantly(card);
      } else if (r.top < vh) {
        reveal(card, n);
        n += 1;
      }
    }
    if (!pending.size) detach();
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sweep);
  }

  function detach() {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("load", schedule);
    document.removeEventListener("load", schedule, true);
  }

  const vh0 = window.innerHeight || document.documentElement.clientHeight;

  for (const card of cards) {
    // Anything already on screen stays visible. Only stage what is below
    // the fold, which the visitor cannot see being hidden.
    if (card.getBoundingClientRect().top < vh0) continue;
    card.classList.add("reveal");
    pending.add(card);
    observer.observe(card);
  }

  if (pending.size) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", schedule);
    // Each lazy image that loads rebalances the columns. Capture phase,
    // because load does not bubble.
    document.addEventListener("load", schedule, true);
  }

  // If the visitor turns reduced motion on mid-visit, stop hiding things.
  if (typeof reduced.addEventListener === "function") {
    reduced.addEventListener("change", () => {
      if (!reduced.matches) return;
      observer.disconnect();
      for (const card of Array.from(pending)) revealInstantly(card);
      detach();
    });
  }
})();
