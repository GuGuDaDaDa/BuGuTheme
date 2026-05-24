# BuGuTheme

A minimalist, content-focused Hugo theme with masonry layout, featured carousel, photo stack, client-side search, lightbox, and built-in Chinese/English i18n.

## Features

- **Masonry card grid** — responsive 2-column layout on desktop, single column on mobile
- **Featured carousel** — hero slider for featured posts with cover images, categories, subtitles
- **Article page** — clean typography with optional floating TOC sidebar, prev/next navigation, tags, Disqus comments
- **Photo stack** — interactive flipable photo gallery via `{{< photos >}}` shortcode
- **Client-side search** — Fuse.js fuzzy search with modal UI
- **Image lightbox** — click to enlarge images in article content
- **Dark mode** — system-aware theme toggle with persistent preference
- **i18n** — Chinese (zh-CN) and English (en) translations for all UI text
- **Custom scrollbar** — thin overlay-style scrollbar, no layout width
- **Progress bar** — subtle top-of-page loading indicator
- **Responsive** — adapts from 4K down to mobile (320px)
- **Google Analytics** — optional tracking code
- **Disqus** — optional comment integration

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
{{< photos "img1.jpg|Caption one,img2.jpg,img3.jpg|Caption three" >}}
```

Each entry is separated by comma. Optionally append `|Caption` to add a caption. Supports click, keyboard (arrow keys), and touch swipe to flip through photos.

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
| `disqusShortname` | string | — | Disqus shortname for comment integration |
| `googleAnalytics` | string | — | Google Analytics measurement ID |

---

## Browser Support

Chrome, Firefox, Safari, Edge (latest 2 versions). Requires Hugo >= 0.146.0.
