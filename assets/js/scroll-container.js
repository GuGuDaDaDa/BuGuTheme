/**
 * Shared accessors for the site's internal scrolling viewport.
 *
 * @module scroll-container
 */

/**
 * Return the element that owns page scrolling.
 * @returns {HTMLElement|null}
 */
export function getScrollContainer() {
  return document.getElementById('site-scrollport');
}

/**
 * Return the current vertical page offset.
 * @returns {number}
 */
export function getScrollTop() {
  const container = getScrollContainer();
  return container ? container.scrollTop : window.scrollY;
}

/**
 * Return the target that dispatches page scroll events.
 * @returns {HTMLElement|Window}
 */
export function getScrollEventTarget() {
  return getScrollContainer() || window;
}

/**
 * Set the vertical page offset.
 * @param {number} top - Vertical offset in pixels.
 * @param {ScrollBehavior} [behavior='auto'] - Scrolling animation mode.
 */
export function scrollToPosition(top, behavior = 'auto') {
  const container = getScrollContainer();
  if (container) {
    container.scrollTo({ top, left: 0, behavior });
    return;
  }
  window.scrollTo({ top, left: 0, behavior });
}
