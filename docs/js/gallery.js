/* Tag filtering. Cards are rendered at build time by Eleventy, so this only
   shows and hides what's already in the HTML — no fetch, no client rendering. */

(function () {
  const bar = document.querySelector('[data-filters]');
  const grid = document.querySelector('[data-grid]');
  if (!bar || !grid) return;

  const empty = document.querySelector('[data-empty]');
  const cards = [...grid.querySelectorAll('.card')];

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;

    const kind = btn.dataset.kind;
    [...bar.querySelectorAll('.filter')].forEach(b =>
      b.setAttribute('aria-pressed', b === btn));

    let shown = 0;
    cards.forEach(card => {
      const match = !kind || card.dataset.kinds.split(' ').includes(kind);
      card.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  });
})();
