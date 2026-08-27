# jifferharriman.com

Eleventy static site. Output goes to `docs/`, which is what GitHub Pages serves.

## Setup (once)

```bash
npm install
```

## Daily use

```bash
npm start     # dev server at localhost:8080, live reload on save
npm run build # writes docs/
```

Leave `npm start` running while you work. Save a file, the browser refreshes.

## Adding a project

1. Create `src/work/my-project.md`
2. Drop photos in `src/images/projects/my-project/` — **filenames don't matter**,
   the folder is scanned and sorted alphabetically
3. That's it. `npm start` picks it up live.

URL becomes `/work/my-project/`, from the filename. It appears on the homepage
grid automatically, sorted by year.

### Front matter

```yaml
---
title: Project Title
year: 2024
tagline: One line that earns the click.
kinds: [installation, public, commission]
role: What you did
credits: Collaborator names
venues:
  - Where it was shown, date
links:
  - label: Coverage
    url: https://…
media: { type: youtube, id: VIDEO_ID }
booking: true
---

Body copy in markdown. **Bold**, *italic*, [links](https://…), all fine.
Blank line between paragraphs.
```

Everything below the `---` is the body. Everything except `title` is optional.

- **`kinds`** — the filter tags. (Called `kinds`, not `tags`, because Eleventy
  reserves `tags` for its own collections.)
- **`booking: true`** — adds the booking inquiry form to that project's page.
- **`media`** — a video at the top. Omit for none.

### Tag vocabulary

Keep it short and stable or filtering gets noisy:

`installation` · `instrument` · `public` · `commission` · `independent` ·
`collaboration` · `research` · `teaching` · `toolkit` · `music` · `performance`

The homepage filter row builds itself from whatever is in use.

## Embeds

Anywhere in a page or project body:

```
{% youtube "VIDEO_ID" %}
{% vimeo "VIDEO_ID" %}
{% soundcloud "https://soundcloud.com/…" %}
{% bandcamp "ALBUM_ID" %}
```

## Images

Handled at build time by `@11ty/eleventy-img`. Drop in full-size camera files —
each becomes WebP + JPEG at 400/800/1400px with a correct `srcset`, so phones
download small files and desktops large ones. Results cache in `docs/img/`.

Never hand-resize anything. Gallery layout picks itself from photo count
(1 / 2–4 / 5+).

## Pages

`src/index.njk`, `about.njk`, `studio.njk`, `music.njk`, `lab.njk`, `cv.njk` —
one-offs, edit directly. Nav lives once in `src/_data/site.json`; the markup is
`src/_includes/partials/nav.njk`.

## Forms

Set `formspreeId` in `src/_data/site.json` to your Formspree endpoint ID.
One endpoint serves every form — each posts a hidden `source` field
(`contact:general`, `booking:galagas-ghost`) so you can tell them apart.

Free tier is 50 submissions/month across all forms combined.

## Where the site lives (pathPrefix)

`eleventy.config.js` has one line near the top:

```js
const PATH_PREFIX = "/jifferharriman-site/";
```

- `"/jifferharriman-site/"` — GitHub Pages at `username.github.io/jifferharriman-site/`
- `"/"` — a custom domain at `jifferharriman.com`

Change it, `npm run build`, push. Every internal link, stylesheet, script, and
image follows. `npm start` handles the prefix on its own, so local preview works
either way without touching it.

Must match the repo name exactly, slashes included, or nothing loads.

## Deploying to GitHub Pages

Push, then **Settings → Pages → Deploy from a branch → `main` → `/docs`**.

`docs/` is committed on purpose — GitHub Pages serves files, it doesn't run
Eleventy. Run `npm run build` before pushing. (A GitHub Action can do this on
push later if the manual step gets old.)

`node_modules/` is gitignored. `.nojekyll` ships from `src/static/`.

### Custom domain

Set `PATH_PREFIX` to `"/"` first, rebuild, push. Then Settings → Pages →
Custom domain → `jifferharriman.com`, and at your registrar:
four A records on `@` to 185.199.108.153, .109.153, .110.153, .111.153, plus a
CNAME on `www` to `<username>.github.io`. Tick Enforce HTTPS once the check
goes green.

## Design notes

Copper (motor coils, solenoid windings) against signal-teal (MIDI, digital
control) on shop-floor ink — the acoustic/digital split the work is about.
Bricolage Grotesque for display, Public Sans for body, JetBrains Mono for
labels.

The hero is a playable 16-step sequencer — click steps to build a pattern,
pentatonic tone per step via WebAudio. Audio stays silent until a click;
transport starts paused under `prefers-reduced-motion`. Tempo and default
pattern are at the top of `src/js/seq.js`.

Filtering is progressive: cards render in the HTML at build time, and JS only
shows and hides them. Works without JavaScript, and search engines see the
content.
