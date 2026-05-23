# mytheme - Hugo Theme

A Hugo theme project built with Tailwind CSS v4.

## Tech Stack

- **Hugo** (>= 0.146.0) — static site generator, Go template syntax in layouts
- **Tailwind CSS v4** (`@tailwindcss/cli`) — utility-first CSS, configured via `@import "tailwindcss"` and `@source` directives in `assets/css/main.css`

## Project Structure

```
assets/
  css/
    main.css          — Tailwind entry point (@tailwind base/components/utilities + @source)
    components/       — Per-component CSS (header.css, footer.css)
  js/
    main.js           — Site JavaScript entry point
layouts/
  baseof.html         — Base document shell
  home.html           — Home page template
  page.html           — Single page template
  section.html        — Section listing template
  taxonomy.html       — Taxonomy listing template
  term.html           — Taxonomy term template
  _partials/          — Reusable partials (head, header, footer, menu, terms)
content/              — Placeholder content for theme development
i18n/                 — Internationalization files
```

## Code Conventions

### JavaScript (assets/js/)

Use JSDoc annotations for all functions and modules:

```js
/**
 * Brief description of what the function does.
 * @param {string} selector - CSS selector to query.
 * @returns {HTMLElement|null} The matched element, or null if not found.
 */
function queryElement(selector) {
  return document.querySelector(selector);
}
```

### CSS (assets/css/)

- Tailwind utilities go in HTML templates via `class` attributes
- Custom CSS lives in `assets/css/components/`, one file per logical component
- Use Tailwind's `@apply` sparingly; prefer utility classes in templates

### Hugo Templates (layouts/)

- Use Go template syntax, Hugo's built-in functions and partials
- HTML comments for section markers (`<!-- header -->`), avoid leaking comments into production output
