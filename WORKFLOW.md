# Adding projects — working notes

Keep this in the repo root. It's the thing to check when you come back to the
site after three months away.

---

## The loop

```bash
npm start          # dev server at localhost:8080, rebuilds on save
```

Leave it running. Save a file, the browser refreshes.

```bash
npm run build      # writes docs/ — do this before pushing
```

---

## Adding a project

1. **Copy an existing file.** `src/work/galagas-ghost.md` → rename it. YAML is
   fussy about indentation; starting from a working file avoids most of it.

2. **The filename is the URL.** `sound-garden.md` → `/work/sound-garden/`.
   Lowercase, hyphens, no spaces.

3. **Make the photo folder** at `src/images/projects/sound-garden/` — the
   folder name must match the `.md` filename *exactly* or no images appear.

4. **Drop in full-size photos.** No resizing, no exporting for web.
   `eleventy-img` generates WebP + JPEG at 400/800/1400px at build time.
   Filenames only matter for sort order: `01.jpg` sorts first, so it becomes
   both the page hero and the homepage card thumbnail.

5. **If new photos don't show up**, stop `npm start` (Ctrl+C) and restart it.
   The gallery scans the folder at build time, so a brand-new folder sometimes
   isn't noticed by the watcher. Editing the `.md` always triggers a rebuild.

---

## Front matter: what's ours, what's Eleventy's

Everything between the two `---` lines at the top of a `.md` file.

**Eleventy reserves these.** They have built-in meaning:

| Field | What it does |
|---|---|
| `layout` | Which template wraps the page |
| `permalink` | Overrides the output URL |
| `tags` | Puts the page in a collection |
| `date` | Eleventy's own date handling |
| `pagination` | Generates multiple pages from data |
| `eleventyExcludeFromCollections` | Hides a page from collections |

`layout`, `tags`, and `permalink` are already set for every project by
`src/work/work.json` — a directory data file that applies to every `.md` in
that folder. That's why individual project files don't repeat them.

**Everything else is invented for this site.** These aren't Eleventy features;
they're just YAML that `project.njk` happens to read:

| Field | Type | Does what |
|---|---|---|
| `title` | text | Page heading, card title, `<title>` tag |
| `year` | number | Sort order and the meta line |
| `tagline` | text | One line under the title, and on the card |
| `kinds` | list | Filter buttons on the homepage |
| `role` | text | "Role" section |
| `credits` | text | "With" section |
| `venues` | list | "Shown" section |
| `links` | list of `label`/`url` | "More" section |
| `media` | object | Video at the top of the page |
| `featured` | true/false | Floats the project to the top of the grid |
| `order` | number | Tie-breaker within a year |
| `booking` | true/false | Adds the inquiry form to that page |

Only `title` is truly required. Add a field nothing reads and nothing happens —
templates have to ask for it.

**Why `kinds` and not `tags`:** `tags` is reserved, and `work.json` already
uses it to put every project into the `projects` collection. A second `tags`
would collide.

---

## Sort order

The homepage grid sorts by, in order:

1. `featured: true` — floats to the top
2. `year`, newest first
3. `order`, higher first — breaks ties *within* a year
4. Title A–Z — so the result is never arbitrary

Day to day you only set `year`. Reach for the others when you need them:

```yaml
featured: true     # pin to the top of the grid
order: 10          # within its year, beats anything with a lower order
```

Two projects from the same year with no `order` fall back to alphabetical —
predictable, but probably not what you want, so set `order` when it matters.

`featured` currently only affects position. If you want featured projects to
*look* different — larger card, a marker — that's a separate change.

---

## Media

A video at the top of the page:

```yaml
media: { type: youtube, id: dQw4w9WgXcQ }
media: { type: vimeo, id: 123456789 }
media: { type: soundcloud, url: "https://soundcloud.com/…" }
```

Omit it and the first photo becomes the hero instead.

For a second video partway down, put a shortcode in the body:

```
{% youtube "VIDEO_ID" %}
{% vimeo "1084432956" %}
```

---

## Page order on a project

1. Video, or first photo if there's no video
2. Title, year · kinds, tagline
3. Body copy
4. Gallery — all photos, including the one used as hero
5. Role / With / Shown / More — only if at least one exists
6. Newer / Older links

---

## Kind vocabulary

Keep it short or the filter row gets noisy. Current set:

`installation` · `instrument` · `public` · `commission` · `independent` ·
`collaboration` · `research` · `teaching` · `toolkit` · `music` · `performance`

The filter row builds itself from whatever's actually in use, so adding a new
kind to one project adds a button. Removing the last use removes the button.

---

## When something breaks

**Project doesn't appear** — YAML error in the front matter. The terminal names
the line. Usual suspects: a colon inside an unquoted value, or a tab character
instead of spaces.

**Photos don't appear** — folder name doesn't match the `.md` filename, or the
watcher missed the new folder. Restart `npm start`.

**Fonts look wrong** — the Google Fonts `<link>` in
`src/_includes/layouts/base.njk` and the `--f-display` token in
`src/css/site.css` have to name the same family.

**Everything unstyled after deploying** — `PATH_PREFIX` in `eleventy.config.js`
doesn't match reality. `/jifferharriman-site/` for GitHub Pages under the repo
name, `/` for a custom domain.

---

## Before pushing

```bash
npm run build
```

`docs/` is committed on purpose — GitHub Pages serves files, it doesn't run
Eleventy. Skip the build and the live site silently stays on the old version.

*(A GitHub Action can do this automatically on push, so you can't forget and
`docs/` stays out of git entirely. Worth setting up before the repo fills with
generated images.)*
