const fs = require("fs");
const path = require("path");
const { default: Image, generateHTML } = require("@11ty/eleventy-img");

/* ---------------------------------------------------------------
   Where the site lives. Two states, one line:
     "/"                       → custom domain (jifferharriman.com)
     "/jifferharriman-site/"   → GitHub Pages before DNS is pointed
   Change this, run `npm run build`, push. Nothing else moves.
   --------------------------------------------------------------- */
const PATH_PREFIX = "/";

const IMG_SRC = "src/images/projects";
const IMG_OUT = "docs/img";
const IMG_URL = PATH_PREFIX.replace(/\/$/, "") + "/img/";

/* Resize + convert one file, return the markup. Runs at build time,
   caches in docs/img, so a 20MB camera JPEG becomes a handful of
   small webp/jpeg files you never think about again. */
async function renderImage(file, { widths, sizes, cls = "", alt = "" }) {
  const stats = await Image(file, {
    widths,
    formats: ["webp", "jpeg"],
    outputDir: IMG_OUT,
    urlPath: IMG_URL,
  });
  return generateHTML(stats, {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
    class: cls,
  });
}

function photosFor(slug) {
  const dir = path.join(IMG_SRC, slug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/static": "." });

  /* ---------- collections ---------- */

  /* Sort order, in priority:
       1. featured: true floats to the top
       2. newest year first
       3. order: <number> breaks ties within a year (higher = higher up)
       4. title A–Z, so the result is never arbitrary
     Only `year` is needed day to day. `featured` and `order` are optional. */
  const isFeatured = (p) => (p.data.featured ? 1 : 0);
  const orderOf = (p) => (typeof p.data.order === "number" ? p.data.order : 0);
  const yearOf = (p) => p.data.year || 0;

  eleventyConfig.addCollection("projects", (api) =>
    api.getFilteredByTag("projects").sort((a, b) => {
      if (isFeatured(a) !== isFeatured(b)) return isFeatured(b) - isFeatured(a);
      if (yearOf(a) !== yearOf(b)) return yearOf(b) - yearOf(a);
      if (orderOf(a) !== orderOf(b)) return orderOf(b) - orderOf(a);
      return (a.data.title || "").localeCompare(b.data.title || "");
    })
  );

  // Every "kind" in use, for building the filter row.
  eleventyConfig.addCollection("kinds", (api) => {
    const set = new Set();
    api.getFilteredByTag("projects").forEach((p) =>
      (p.data.kinds || []).forEach((k) => set.add(k))
    );
    return [...set].sort();
  });

  /* ---------- embeds ---------- */

  eleventyConfig.addShortcode("youtube", (id, title = "Video") =>
    `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${title}" allowfullscreen loading="lazy"></iframe></div>`
  );

  eleventyConfig.addShortcode("vimeo", (id, title = "Video") =>
    `<div class="embed"><iframe src="https://player.vimeo.com/video/${id}" title="${title}" allowfullscreen loading="lazy"></iframe></div>`
  );

  eleventyConfig.addShortcode("soundcloud", (url, title = "Audio") =>
    `<div class="embed embed--audio"><iframe src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23c87f45" title="${title}" loading="lazy"></iframe></div>`
  );

  // url is the normal open.spotify.com link — album, track, playlist, or artist.
// height: 152 for a compact track player, 352 (default) for album/playlist.
eleventyConfig.addShortcode("spotify", (url, height = 352) => {
  const embedUrl = url.split("?")[0].replace("open.spotify.com/", "open.spotify.com/embed/");
  return `<div class="embed embed--audio" style="height:${height}px"><iframe src="${embedUrl}" title="Spotify" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
});


  /* ---------- images ---------- */

  // Whole gallery for a project. Scans the folder — no filenames in front matter.
  eleventyConfig.addAsyncShortcode("gallery", async function (slug) {
    const files = photosFor(slug);
    if (!files.length) return "";
    const mod =
      files.length === 1 ? "gallery--1" : files.length <= 4 ? "gallery--few" : "gallery--many";
    const sizes =
      files.length === 1 ? "(max-width: 800px) 100vw, 900px" : "(max-width: 800px) 100vw, 450px";
    const imgs = await Promise.all(
      files.map((f) => renderImage(f, { widths: [400, 800, 1400], sizes }))
    );
    return `<div class="gallery ${mod}">${imgs.join("")}</div>`;
  });

  // Hero: first image in the folder, full width. Nothing if the folder is empty
  // — the page then opens on the title, which is fine.
  eleventyConfig.addAsyncShortcode("hero", async function (slug, alt = "") {
    const files = photosFor(slug);
    if (!files.length) return "";
    const html = await renderImage(files[0], {
      widths: [800, 1400, 2000],
      sizes: "(max-width: 800px) 100vw, 1000px",
      cls: "proj__hero",
      alt,
    });
    return `<div class="proj__heromedia">${html}</div>`;
  });

  // Card thumbnail: first image in the folder. Masonry means images keep their
  // real shape — but a very tall photo would swallow an entire column, so
  // anything taller than 3:4 is capped, and `focus` picks what survives.
  eleventyConfig.addAsyncShortcode("thumb", async function (slug, alt = "", focus = "") {
    const files = photosFor(slug);
    if (!files.length) return `<div class="card__thumb card__thumb--empty"></div>`;

    const stats = await Image(files[0], {
      widths: [400, 800],
      formats: ["webp", "jpeg"],
      outputDir: IMG_OUT,
      urlPath: IMG_URL,
    });

    const largest = stats.jpeg[stats.jpeg.length - 1];
    const tooTall = largest.height / largest.width > 4 / 3;

    let html = generateHTML(stats, {
      alt,
      sizes: "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 320px",
      loading: "lazy",
      decoding: "async",
      class: "card__thumb" + (tooTall ? " card__thumb--capped" : ""),
    });

    // object-position only does anything when the image is actually cropped.
    if (tooTall && focus) {
      html = html.replace("<img ", `<img style="object-position:${focus}" `);
    }
    return html;
  });

  /* ---------- filters ---------- */

  eleventyConfig.addFilter("kindList", (kinds) => (kinds || []).join(" "));

  // Picks what the homepage banner shows: an active onview project first,
  // otherwise whichever project is flagged default_banner (e.g. B.E.A.T.).
  eleventyConfig.addFilter("bannerProject", (projects) =>
    projects.find((p) => p.data.onview) || projects.find((p) => p.data.default_banner) || null
  );

  return {
    pathPrefix: PATH_PREFIX,
    dir: { input: "src", output: "docs", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
