/**
 * Giscus comment loader with PJAX-aware reinitialisation.
 *
 * @module giscus
 */

const GISCUS_CLIENT = 'https://giscus.app/client.js';

let themeObserverStarted = false;

/**
 * Initialise the Giscus widget for the current article page.
 * Re-inserting the script is required after PJAX replaces <main>.
 *
 * @returns {void}
 */
export function initGiscus() {
  const container = document.querySelector('[data-giscus]');
  if (!container) return;

  container.innerHTML = '';
  appendGiscusScript(container);
  startThemeObserver();
}

/**
 * Append a fresh Giscus client script with attributes copied from the container.
 *
 * @param {Element} container - Element containing Hugo-rendered Giscus data attributes.
 * @returns {void}
 */
function appendGiscusScript(container) {
  const script = document.createElement('script');
  script.src = GISCUS_CLIENT;
  script.async = true;
  script.crossOrigin = 'anonymous';

  const attributes = {
    repo: 'data-repo',
    repoId: 'data-repo-id',
    category: 'data-category',
    categoryId: 'data-category-id',
    mapping: 'data-mapping',
    strict: 'data-strict',
    reactionsEnabled: 'data-reactions-enabled',
    emitMetadata: 'data-emit-metadata',
    inputPosition: 'data-input-position',
    theme: 'data-theme',
    lang: 'data-lang',
    loading: 'data-loading',
  };

  Object.entries(attributes).forEach(([source, target]) => {
    const value = container.getAttribute(`data-${toKebabCase(source)}`);
    if (value) {
      script.setAttribute(target, value);
    }
  });

  script.setAttribute('data-theme', resolveGiscusTheme(container));
  container.appendChild(script);
}

/**
 * Resolve the configured Giscus theme against the site's active light/dark theme.
 *
 * @param {Element} container - Element containing theme configuration.
 * @returns {string} Theme name accepted by Giscus.
 */
function resolveGiscusTheme(container) {
  const theme = container.getAttribute('data-theme') || 'preferred_color_scheme';
  if (theme !== 'auto') return theme;

  const siteTheme = document.documentElement.getAttribute('data-theme');
  if (siteTheme === 'dark') {
    return container.getAttribute('data-dark-theme') || 'dark';
  }

  return container.getAttribute('data-light-theme') || 'light';
}

/**
 * Keep the embedded Giscus iframe in sync when the site theme changes.
 *
 * @returns {void}
 */
function startThemeObserver() {
  if (themeObserverStarted) return;
  themeObserverStarted = true;

  const observer = new MutationObserver(() => {
    const container = document.querySelector('[data-giscus]');
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!container || !iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage({
      giscus: {
        setConfig: {
          theme: resolveGiscusTheme(container),
        },
      },
    }, 'https://giscus.app');
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

/**
 * Convert a camelCase key to kebab-case for dataset attribute lookup.
 *
 * @param {string} value - CamelCase value.
 * @returns {string} Kebab-case value.
 */
function toKebabCase(value) {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}
