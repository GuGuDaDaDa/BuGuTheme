/**
 * Footnotes — tooltip (desktop), bottom panel (mobile), scroll-to with highlight.
 * Reads footnote data from DOM .fn-item elements rather than duplicating in JS.
 */

/**
 * Extract footnote content and source from a DOM fn-item element.
 * Clones the node and removes num/source/backref to get inline content.
 * @param {Element} item
 * @returns {{ content: string, source: string } | null}
 */
function extractFnData(item) {
  const clone = item.cloneNode(true);
  clone.querySelector('.fn-item-num')?.remove();
  clone.querySelector('.fn-item-source')?.remove();
  clone.querySelector('.fn-backref')?.remove();
  const content = clone.innerHTML.trim();
  if (!content) return null;
  const sourceEl = item.querySelector('.fn-item-source');
  const source = sourceEl ? sourceEl.textContent.replace(/^[—\-\s]+/, '') : '';
  return { content, source };
}

/**
 * Escape HTML entities in a string.
 * @param {string} s
 * @returns {string}
 */
function escHtml(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s));
  return d.innerHTML;
}

/* ---------- Shared state (closed over by helpers) ---------- */

/** @type {HTMLElement|null} */
let tooltip = null;
/** @type {HTMLElement|null} */
let tooltipNum = null;
/** @type {HTMLElement|null} */
let tooltipContent = null;
/** @type {HTMLElement|null} */
let tooltipSource = null;
/** @type {HTMLElement|null} */
let tooltipGoto = null;
/** @type {HTMLElement|null} */
let tooltipArrow = null;
/** @type {HTMLElement|null} */
let panelOverlay = null;
/** @type {HTMLElement|null} */
let panel = null;
/** @type {HTMLElement|null} */
let panelBody = null;
/** @type {HTMLElement|null} */
let panelClose = null;
/** @type {HTMLElement|null} */
let currentActiveRef = null;
/** @type {number|null} */
let hideTimer = null;
/** @type {boolean} */
let eventsBound = false;

/**
 * Position the tooltip relative to a ref element.
 * @param {HTMLElement} refEl
 */
function positionTooltip(refEl) {
  if (!refEl || !tooltip) return;
  const refRect = refEl.getBoundingClientRect();
  const ttRect = tooltip.getBoundingClientRect();
  const tw = ttRect.width || 320;
  const th = ttRect.height || 80;
  const arrowH = 10;
  const margin = 12;

  let left = refRect.left + refRect.width / 2 - tw / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));

  let top = refRect.top - th - arrowH - 6;
  let arrowTop = th;
  if (top < margin + 8) {
    top = refRect.bottom + arrowH + 6;
    arrowTop = -arrowH;
  }

  let arrowLeft = refRect.left + refRect.width / 2 - left;
  arrowLeft = Math.max(12, Math.min(arrowLeft, tw - 12));

  tooltip.style.left = Math.round(left) + 'px';
  tooltip.style.top = Math.round(top) + 'px';
  tooltipArrow.style.left = Math.round(arrowLeft) + 'px';
  tooltipArrow.style.top = Math.round(arrowTop) + 'px';
}

/**
 * Show the tooltip for a given footnote number.
 * @param {HTMLElement} refEl
 * @param {number} fnNum
 */
function showTooltip(refEl, fnNum) {
  if (!tooltip) return;
  const fnItem = document.getElementById('fn-' + fnNum);
  const data = fnItem ? extractFnData(fnItem) : null;
  if (!data) return;

  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

  tooltipNum.textContent = '[' + fnNum + ']';
  tooltipContent.innerHTML = data.content;
  tooltipSource.textContent = data.source || '';
  tooltipGoto.setAttribute('data-goto-fn', String(fnNum));
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => positionTooltip(refEl));

  if (refEl) refEl.classList.add('active');
  if (currentActiveRef && currentActiveRef !== refEl) {
    currentActiveRef.classList.remove('active');
  }
  currentActiveRef = refEl;
}

function dismissTooltip() {
  if (!tooltip) return;
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
  if (currentActiveRef) {
    currentActiveRef.classList.remove('active');
    currentActiveRef = null;
  }
}

function hideTooltip() {
  if (!tooltip) return;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(dismissTooltip, 100);
}

function cancelHide() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
}

/**
 * Show the mobile bottom panel for a footnote number.
 * @param {number} fnNum
 */
function showPanel(fnNum) {
  if (!panelBody || !panelOverlay || !panel) return;
  const fnItem = document.getElementById('fn-' + fnNum);
  const data = fnItem ? extractFnData(fnItem) : null;
  if (!data) return;

  panelBody.innerHTML =
    '<div class="fn-panel-item-num">引用 [' + fnNum + ']</div>' +
    '<div class="fn-panel-item-content">' + data.content + '</div>' +
    (data.source ? '<div class="fn-panel-item-source">' + escHtml(data.source) + '</div>' : '') +
    '<a class="fn-panel-goto" data-goto-fn="' + fnNum + '" role="button">↓ 跳到文末</a>';

  panelOverlay.classList.add('visible');
  panelOverlay.setAttribute('aria-hidden', 'false');
  panel.classList.add('visible');
  panel.setAttribute('aria-hidden', 'false');
}

function hidePanel() {
  if (!panelOverlay || !panel) return;
  panelOverlay.classList.remove('visible');
  panelOverlay.setAttribute('aria-hidden', 'true');
  panel.classList.remove('visible');
  panel.setAttribute('aria-hidden', 'true');
  if (currentActiveRef) {
    currentActiveRef.classList.remove('active');
    currentActiveRef = null;
  }
}

/**
 * Scroll to a footnote item and highlight it.
 * @param {number} fnNum
 */
function scrollToFootnote(fnNum) {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  dismissTooltip();
  hidePanel();
  const el = document.getElementById('fn-' + fnNum);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('highlight-flash');
    void el.offsetWidth;
    el.classList.add('highlight-flash');
  }
}

/**
 * Scroll to an inline ref and highlight it.
 * @param {number} fnNum
 */
function scrollToRef(fnNum) {
  const el = document.getElementById('fnref-' + fnNum);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('highlight-flash');
    void el.offsetWidth;
    el.classList.add('highlight-flash');
  }
}

/**
 * Bind one-time document-level events (scroll dismiss, Escape, resize).
 * Called once from main.js on initial load.
 */
export function setupFootnoteEvents() {
  if (eventsBound) return;
  eventsBound = true;

  tooltip = document.getElementById('fn-tooltip');
  tooltipNum = document.getElementById('fn-tooltip-num');
  tooltipContent = document.getElementById('fn-tooltip-content');
  tooltipSource = document.getElementById('fn-tooltip-source');
  tooltipGoto = document.getElementById('fn-tooltip-goto');
  tooltipArrow = document.getElementById('fn-tooltip-arrow');
  panelOverlay = document.getElementById('fn-panel-overlay');
  panel = document.getElementById('fn-panel');
  panelBody = document.getElementById('fn-panel-body');
  panelClose = document.getElementById('fn-panel-close');

  /* Tooltip self-hover */
  if (tooltip) {
    tooltip.addEventListener('mouseenter', cancelHide);
    tooltip.addEventListener('mouseleave', hideTooltip);
  }

  /* Tooltip "goto" link */
  if (tooltipGoto) {
    tooltipGoto.addEventListener('click', e => {
      e.preventDefault();
      const n = parseInt(tooltipGoto.getAttribute('data-goto-fn'), 10);
      if (n) scrollToFootnote(n);
    });
  }

  /* Panel close */
  if (panelClose) panelClose.addEventListener('click', hidePanel);
  if (panelOverlay) panelOverlay.addEventListener('click', hidePanel);

  /* Panel "goto" delegation */
  if (panelBody) {
    panelBody.addEventListener('click', e => {
      const btn = e.target.closest('.fn-panel-goto');
      if (btn) {
        e.preventDefault();
        const n = parseInt(btn.getAttribute('data-goto-fn'), 10);
        if (n) scrollToFootnote(n);
      }
    });
  }

  /* Scroll dismiss */
  window.addEventListener('scroll', () => {
    if (tooltip && tooltip.classList.contains('visible')) { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } dismissTooltip(); }
  }, { passive: true });

  /* Escape key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } dismissTooltip(); hidePanel(); }
  });

  /* Reposition on resize */
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (tooltip && tooltip.classList.contains('visible') && currentActiveRef) {
        positionTooltip(currentActiveRef);
      }
    }, 120);
  });
}

/**
 * Bind footnote inline refs and backref links for the current page content.
 * Call after each PJAX content swap.
 */
export function bindFootnoteRefs() {
  document.querySelectorAll('.fn-ref').forEach(ref => {
    const fnNum = parseInt(ref.getAttribute('data-fn'), 10);
    if (!fnNum) return;

    ref.addEventListener('mouseenter', () => {
      cancelHide();
      showTooltip(ref, fnNum);
    });
    ref.addEventListener('mouseleave', () => hideTooltip());
    ref.addEventListener('focus', () => {
      cancelHide();
      showTooltip(ref, fnNum);
    });
    ref.addEventListener('blur', () => hideTooltip());

    ref.addEventListener('click', e => {
      e.preventDefault();
      scrollToFootnote(fnNum);
    });
  });

  document.querySelectorAll('.fn-backref').forEach(br => {
    br.addEventListener('click', e => {
      e.preventDefault();
      const n = parseInt(br.getAttribute('data-backref'), 10);
      if (n) scrollToRef(n);
    });
  });
}

/**
 * Full footnotes init (backwards-compatible, calls both setup + bind).
 */
export function initFootnotes() {
  setupFootnoteEvents();
  bindFootnoteRefs();
}
