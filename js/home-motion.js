/*
 * Home page motion.
 *
 *   Featured Collections - every tile drifts at its own rate, so the
 *     uneven layout keeps shifting instead of settling into a grid.
 *   Upcoming Adventures - the section pins and the deck of prints deals
 *     forward, one card at a time, driven by scroll position.
 *
 * Featured Photos needs no JavaScript: the ribbon is a CSS animation.
 *
 * Progressive enhancement: .js-motion is only added if this runs, and
 * nothing here is required to read the page. With JavaScript off, or
 * with reduced motion requested, every section still renders complete.
 */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;

  const drifters = Array.from(document.querySelectorAll("[data-speed]"));
  const scroller = document.querySelector(".deck-scroll");
  const cards = Array.from(document.querySelectorAll(".deck-card"));
  const metas = Array.from(document.querySelectorAll(".deck-meta"));
  const dots = Array.from(document.querySelectorAll(".deck-dot"));

  if (!drifters.length && !cards.length) return;
  document.documentElement.classList.add("js-motion");

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  let ticking = false;

  function frame() {
    ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    for (const el of drifters) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > vh + 400) continue;   // skip what is far away
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const s = parseFloat(el.dataset.speed) || 0;
      el.style.transform = "translate3d(0," + ((p - 0.5) * 2 * s).toFixed(1) + "px,0)";
    }

    if (!scroller || !cards.length) return;

    const r = scroller.getBoundingClientRect();
    const span = r.height - vh;
    const p = clamp(-r.top / (span || 1), 0, 1);

    // Fractional, so the deck rolls continuously rather than snapping.
    const front = p * (cards.length - 1);

    cards.forEach((card, i) => {
      const d = i - front;                 // > 0 waiting behind, < 0 already dealt
      let x, y, rot, sc, op;
      if (d >= 0) {
        const k = Math.min(d, 3);
        x = k * 30; y = k * -24; rot = 3.5 + k * 3.5;
        sc = 1 - k * 0.05; op = d > 2.6 ? 0 : 1;
      } else {
        const k = Math.min(-d, 1.7);
        x = -k * 150; y = k * 58; rot = 3.5 - k * 15;
        sc = 1 - k * 0.07;
        // Hold full opacity until the card is well clear, or the front
        // print looks see-through the moment it starts to leave.
        op = clamp(1 - (k - 0.45) * 1.9, 0, 1);
      }
      card.style.transform =
        "translate3d(calc(-50% + " + x.toFixed(1) + "px), calc(-50% + " + y.toFixed(1) + "px), 0) " +
        "rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      card.style.opacity = op.toFixed(3);
      card.style.zIndex = String(300 - Math.round(Math.abs(d) * 10));
    });

    const cur = Math.round(front);
    metas.forEach((m, i) => m.classList.toggle("is-on", i === cur));
    dots.forEach((m, i) => m.classList.toggle("is-on", i === cur));
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("load", schedule);
  document.addEventListener("load", schedule, true);   // lazy images shift the layout
  schedule();
})();
