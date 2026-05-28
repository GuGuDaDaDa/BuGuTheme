# BuGuTheme

A minimalist, content-focused Hugo theme with masonry layout, featured carousel, photo stack, client-side search, lightbox, and built-in Chinese/English i18n.

## Features

- **Masonry card grid** — responsive 2-column layout on desktop, single column on mobile
- **Featured carousel** — hero slider for featured posts with cover images, categories, subtitles
- **Article page** — clean typography with optional floating TOC sidebar, prev/next navigation, tags
- **Photo stack** — interactive flipable photo gallery via `{{< photos >}}` shortcode
- **AI Summary** — collapsible AI-generated summary block via `{{< ai-summary >}}`
- **AI Warning** — dismissible AI disclosure notice via `{{< ai-warning >}}`
- **References** — inline footnote references with desktop tooltip + mobile bottom panel, styled footnotes section via `{{< refers >}}` + `{{< refer >}}` + `{{< fnref >}}`
- **Client-side search** — Fuse.js fuzzy search with modal UI
- **Image lightbox** — click to enlarge images in article content
- **Dark mode** — system-aware theme toggle with persistent preference
- **i18n** — Chinese (zh-CN) and English (en) translations for all UI text
- **Custom scrollbar** — thin overlay-style scrollbar, no layout width
- **Progress bar** — subtle top-of-page loading indicator
- **Responsive** — adapts from 4K down to mobile (320px)
- **Google Analytics** — optional tracking code

---

## Quick Start

### 1. Create a new Hugo site

```bash
hugo new site my-blog
cd my-blog
```

### 2. Install the theme

**Option A — Git submodule (recommended)**

```bash
git init
git submodule add https://github.com/GuGuDaDaDa/BuGuTheme.git themes/bu-gu-theme
```

**Option B — Copy directly**

Copy the entire theme folder into `themes/bu-gu-theme/`.

### 3. Configure your site

Replace `hugo.toml` in your project root with:

```toml
baseURL = 'https://yoursite.com/'
defaultContentLanguage = 'zh-cn'
theme = 'bu-gu-theme'

[markup]
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 3

[params]
  author = '布谷'

# ── Language: Chinese (default) ──
[languages.'zh-cn']
  locale = 'zh-CN'
  title = '你的博客名'
  hasCJKLanguage = true
  weight = 10

  [[languages.'zh-cn'.menus.main]]
    identifier = 'home'
    name = '首页'
    pageRef = '/'
    weight = 10

  [[languages.'zh-cn'.menus.main]]
    identifier = 'categories'
    name = '分类'
    pageRef = '/categories'
    weight = 20

  [[languages.'zh-cn'.menus.main]]
    identifier = 'tags'
    name = '标签'
    pageRef = '/tags'
    weight = 30

  [[languages.'zh-cn'.menus.main]]
    identifier = 'about'
    name = '关于'
    pageRef = '/about'
    weight = 40

  [[languages.'zh-cn'.menus.main]]
    identifier = 'friends'
    name = '友链'
    pageRef = '/friends'
    weight = 50

  [languages.'zh-cn'.params]
    footerText = '你的博客名 · 一句话描述'
    copyright = '你的博客名'       # © 年份 + 此处文字；留空则用 title
    themeName = 'BuGuTheme'        # footer 主题名；留空显示 "mytheme"
    themeURL  = 'https://github.com/GuGuDaDaDa/BuGuTheme'  # 主题链接；留空则不生成链接
    icp = ''
    [languages.'zh-cn'.params.social]
      github = 'https://github.com/yourname'
      twitter = ''
      email = ''

# ── Language: English ──
[languages.en]
  locale = 'en'
  title = 'Your Blog'
  weight = 20

  [[languages.en.menus.main]]
    identifier = 'home'
    name = 'Home'
    pageRef = '/'
    weight = 10

  [[languages.en.menus.main]]
    identifier = 'categories'
    name = 'Categories'
    pageRef = '/categories'
    weight = 20

  [[languages.en.menus.main]]
    identifier = 'tags'
    name = 'Tags'
    pageRef = '/tags'
    weight = 30

  [[languages.en.menus.main]]
    identifier = 'about'
    name = 'About'
    pageRef = '/about'
    weight = 40

  [[languages.en.menus.main]]
    identifier = 'friends'
    name = 'Friends'
    pageRef = '/friends'
    weight = 50

  [languages.en.params]
    footerText = 'Your Blog · A catchy tagline'
    copyright = 'Your Blog'
    themeName = 'BuGuTheme'
    themeURL  = 'https://github.com/GuGuDaDaDa/BuGuTheme'
    icp = ''
    [languages.en.params.social]
      github = 'https://github.com/yourname'
      twitter = ''
      email = ''
```

> **Single-language use:** If you only need Chinese, remove the `[languages.en]` section. If only English, change `defaultContentLanguage` to `en` and remove the `[languages.'zh-cn']` section.

### 4. Create content

#### Blog posts

Create posts under `content/posts/`:

```bash
hugo new content posts/my-first-post.md
```

```yaml
+++
title = 'My First Post'
date = 2026-01-15T09:00:00+08:00
description = 'A brief description for the card'
subtitle = 'Optional subtitle shown in the carousel'
featured = true          # show in carousel
categories = ['tech']
tags = ['hugo', 'blog']
cover = 'cover.jpg'      # image in the same directory, or external URL
toc = true               # show table of contents sidebar
draft = false
+++

Your content here...
```

Place the cover image (`cover.jpg`) in the same directory as your post's `index.md` (page bundle).

#### About page

Create `content/about/index.md`:

```yaml
+++
title = 'About'
layout = 'about'
description = 'A short tagline under your name'
+++

Write your bio here in Markdown.

Optionally set `github`, `twitter`, `email` in frontmatter to show social links:
+++
title = 'About'
layout = 'about'
github = 'https://github.com/yourname'
email = 'hello@example.com'
+++
```

Place your avatar as `avatar.jpg` or `avatar.png` in `content/about/`.

#### Friends (blogroll) page

Create `content/friends/_index.md`:

```yaml
+++
title = 'Friends'
layout = 'friends'
+++
```

Then create `data/friends.yaml` (or `friends.json` / `friends.toml`) in your project root:

```yaml
# data/friends.yaml
- name: "Friend's Blog"
  url: "https://example.com"
  avatar: "https://example.com/avatar.jpg"
- name: "Another Blog"
  url: "https://example.org"
  avatar: "https://example.org/avatar.jpg"
```

Each entry requires:
- `name` — displayed name
- `url` — link target
- `avatar` — image URL (Gravatar, static image, or external)

### 5. Run

```bash
hugo server -D
```

Visit `http://localhost:1313/`.

---

## Shortcodes

### Photos — interactive photo stack

```
{{< photos >}}
{{< photo src="img1.jpg" caption="Caption one" >}}
{{< photo src="img2.jpg" >}}
{{< photo src="img3.jpg" caption="Caption three" >}}
{{< /photos >}}
```

Each `{{< photo >}}` is one image. `caption` is optional. Supports click, keyboard (arrow keys), and touch swipe to flip through photos.

| Parameter | Type | Description |
|-----------|------|-------------|
| `src` | string | Image filename (page resource) or external URL |
| `caption` | string | Optional caption shown below the image |

---

### AI Summary — collapsible summary block

Renders a collapsible panel labeled "AI 摘要". Click the toggle button to expand or collapse. State resets on page reload (no localStorage).

```
{{< ai-summary >}}
本文探讨了……（支持 Markdown）
{{< /ai-summary >}}
```

---

### AI Warning — dismissible disclosure notice

Renders a dismissible notice bar with a left accent line and a close button. Closing hides it for the current page session only (no localStorage).

```
{{< ai-warning title="透明声明" >}}
本文部分内容在 AI 辅助下完成，所有文字均经过作者逐段审校与修改。
{{< /ai-warning >}}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Bold prefix before the notice text; omit to show plain text only |

---

### References — inline footnotes with tooltip + panel

The reference system has three parts: **inline markers** in body text, a **desktop tooltip** on hover, a **mobile bottom panel** on tap, and the **footnotes section** at the end. Each footnote entry supports full Markdown syntax.

#### Inline reference markers

Place `{{< fnref N >}}` in body text where you want a clickable superscript reference:

```
CSS 布局的演进经历了多个阶段{{< fnref 1 >}}。
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `0` (positional) | number | Footnote number, must match a `num` in `{{< refer >}}` |

#### Footnotes section

Use `{{< refers >}}` as the container and one paired `{{< refer >}}` per entry. Each `refer` body supports **full Markdown** (bold, italic, links, inline code, etc.).

```
{{< refers title="参考文献与注释" >}}

{{< refer num="1" source="w3.org/TR/css-layout-evolution" >}}
W3C CSS Working Group. **CSS Layout Module Level 3**. W3C Working Draft, 2024.
{{< /refer >}}

{{< refer num="2" source="O'Reilly Media, ISBN 978-1449393199" >}}
Meyer, Eric A. **CSS: The Definitive Guide**, 4th Edition. 第9章.
{{< /refer >}}

{{< /refers >}}
```

`{{< refers >}}` parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `参考文献与注释` | Section heading |

`{{< refer >}}` parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `num` | string | — | Reference number (required; matches `{{< fnref N >}}`) |
| `source` | string | — | Source attribution, shown inline after content in muted style |
| `noref` | bool | `false` | Set to `true` for extra references without a body superscript (omit the backref link) |
| inner content | markdown | — | The reference text; supports full Markdown rendering |

Extra references without a body superscript — set `noref="true"` to omit the backref link:

```
{{< refer num="3" noref="true" source="..." >}}...{{< /refer >}}
```

**Backward-compatible usage** (`desc` + `url` style, no Markdown inner content):

```
{{< refers >}}
{{< refer num="1" desc="文章标题" url="https://example.com" >}}
{{< refer num="2" desc="纯文本条目" >}}
{{< /refers >}}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `desc` | string | — | Plain-text description |
| `url` | string | — | Link URL; omit to render as plain text |

---

## Frontmatter Reference

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `date` | datetime | Publication date |
| `lastmod` | datetime | Last modified date |
| `description` | string | Short description (card excerpt + carousel subtitle fallback) |
| `subtitle` | string | Carousel subtitle (shown between title and meta) |
| `featured` | bool | Show in the homepage carousel |
| `categories` | array | Category names |
| `tags` | array | Tag names |
| `cover` | string | Cover image filename (page resource) or external URL |
| `toc` | bool | Show table of contents sidebar on this article |
| `draft` | bool | Draft mode (not published) |
| `layout` | string | Page layout: `"about"` or `"friends"` |

---

## Directory Structure (user project)

```
my-blog/
├── hugo.toml               # site configuration
├── content/
│   ├── posts/
│   │   ├── hello-world/
│   │   │   ├── index.md    # post content
│   │   │   └── cover.jpg   # cover image
│   │   └── another-post.md # flat file without cover
│   ├── about/
│   │   ├── index.md        # about page
│   │   └── avatar.jpg      # your avatar
│   └── friends/
│       └── _index.md       # friends page
├── data/
│   └── friends.yaml        # friends list (.yaml / .json / .toml)
├── assets/                 # optional: override theme assets
├── static/                 # static files (images, etc.)
└── themes/
    └── bu-gu-theme/        # the theme
```

---

## Site Params Reference

All params live under `[languages.<lang>.params]` in `hugo.toml`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `footerText` | string | — | Slogan shown in the footer center, e.g. `博客名 · 一句话描述` |
| `copyright` | string | site `title` | Name shown after © in the footer meta row |
| `themeName` | string | `"mytheme"` | Theme name shown in the footer "Theme" link |
| `themeURL` | string | — | URL for the theme name link; omit to render plain text |
| `icp` | string | — | ICP license number (shown below footer slogan, China only) |
| `social.github` | string | — | Full GitHub profile URL |
| `social.twitter` | string | — | Full Twitter/X profile URL |
| `social.email` | string | — | Email address (generates `mailto:` link) |
| `googleAnalytics` | string | — | Google Analytics measurement ID |

---

## Browser Support

Chrome, Firefox, Safari, Edge (latest 2 versions). Requires Hugo >= 0.146.0.
