/**
 * BuGuBlog — Thin progress bar for page loads and AJAX requests.
 *
 * @module progress
 */

/** @type {HTMLDivElement|null} */
let bar = null;
/** @type {number|null} */
let timer = null;
let width = 0;
let running = false;

/**
 * Create and insert the progress bar element.
 */
function ensureBar() {
  if (bar) return;
  bar = document.createElement('div');
  bar.className = 'progress-bar';
  document.body.prepend(bar);
}

/**
 * Start the progress bar trickle animation.
 * Call before a navigation or AJAX request.
 */
export function start() {
  ensureBar();
  width = 0;
  running = true;
  bar.style.width = '0';
  bar.classList.remove('done');
  bar.classList.add('running');

  function tick() {
    if (!running) return;
    if (width < 85) {
      const remaining = 85 - width;
      width += remaining * 0.08 + 0.5;
      bar.style.width = width + '%';
      timer = setTimeout(tick, 180);
    }
  }
  tick();
}

/**
 * Complete the progress bar (snap to 100% then fade out).
 */
export function done() {
  running = false;
  if (timer) { clearTimeout(timer); timer = null; }
  if (!bar) return;
  bar.classList.remove('running');
  bar.classList.add('done');
  // Reset after fade-out
  setTimeout(() => {
    if (bar) {
      bar.style.width = '0';
      bar.classList.remove('done');
    }
  }, 400);
}
