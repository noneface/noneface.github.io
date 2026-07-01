# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal blog (noneface.github.io) built with Jekyll, hosted on GitHub Pages. Content is in Chinese. The site uses a slide-out sidebar menu (jQuery mmenu), Bootstrap grid, and Disqus comments.

## Commands

```bash
# Install dependencies (Ruby + Bundler required)
bundle install

# Local dev server at http://localhost:4000
bundle exec jekyll serve

# Build to _site/ (GitHub Pages does this automatically on push)
bundle exec jekyll build
```

There are no tests, linters, or CI in this repo.

## Architecture

### Content routing by tag

The site has exactly **two content categories**, separated by the `tag` field in post frontmatter:

| Tag | Page | Nav label | Purpose |
|---|---|---|---|
| `codes` | `codes.html` | Codes | Technical articles, code-heavy posts |
| `notes` | `notes.html` | Notes | Personal reflections, essays |

The homepage (`index.html`) shows **all** posts paginated (13 per page, `jekyll-paginate`).

A newer convention using `tags:` (array, e.g. `tags: [AI, Agent, ...]`) exists on one recent post but is not yet wired into any page filter.

### Layout chain

- `_layouts/default.html` — root layout: `<head>`, sidebar nav (`#my-menu`), mmenu init, Google Fonts (Consolas), includes all CSS/JS
- `_layouts/post.html` — extends default, renders post title + date + content + Disqus thread
- `_layouts/about.html` — extends default, same structure as post but without date

Every page declares `layout: default` or `layout: post`/`layout: about` in its frontmatter. The `{{ content }}` placeholder in `default.html` receives the rendered inner layout/content.

### Post format

Posts live in `_posts/` with the standard Jekyll naming convention `YYYY-MM-DD-slug.md`. Required frontmatter:

```yaml
---
layout: post
title: "Post Title"
tag: codes   # or: notes
---
```

`_config.yml` sets `markdown: kramdown` and `highlighter: rouge` — fenced code blocks with language hints will syntax-highlight.

### Static assets

- `css/` — Bootstrap 3, jQuery mmenu (slide-out menu), Font Awesome 4, jQuery 1.11, pygments syntax highlighting CSS, and `style.css` (custom overrides)
- `images/` — all post images served directly (100+ files, no CDN or processing)
- `fonts/` — Font Awesome webfonts (.ttf, .woff, .woff2)

### Disqus comments

Embedded in `post.html` and `about.html` with the shortname `noneface.disqus.com`. The page URL/identifier config is left at defaults (commented out).

## Adding a new post

1. Create `_posts/YYYY-MM-DD-slug.md`
2. Set `tag: codes` for technical content or `tag: notes` for personal essays
3. Place images in `images/` and reference them as `/images/filename.png`
4. Push to `master` — GitHub Pages builds and deploys automatically
