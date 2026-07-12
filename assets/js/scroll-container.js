/**
 * Shared accessors for the document scrolling viewport.
 *
 * @module scroll-container
 */

/**
 * Return the element that owns page scrolling.
 * @returns {Element|null}
 */
export function getScrollContainer() {
  return document.scrollingElement;
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
 * @returns {Window}
 */
export function getScrollEventTarget() {
  return window;
}

/**
 * Set the vertical page offset.
 * @param {number} top - Vertical offset in pixels.
 * @param {ScrollBehavior} [behavior='auto'] - Scrolling animation mode.
 */
export function scrollToPosition(top, behavior = 'auto') {
  window.scrollTo({ top, left: 0, behavior });
}
