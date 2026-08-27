/* Hero sequencer — click steps to build a pattern.
   Step count follows the window width, snapped to musical loop lengths so a
   pattern never lands on something like 23 steps. Audio waits for a gesture. */

(function () {
  const el = document.querySelector('[data-seq]');
  if (!el) return;

  const MIN_STEPS = 8;
  const MAX_STEPS = 32;
  const SNAP = 4;                      // step counts land on multiples of 4
  const CELL_TARGET = 42;              // px per step, including gap
  const TEMPO_MS = 260;

  // Pentatonic. Rises for 16 steps, then mirrors back down, so a full 32-step
  // loop is an arc rather than a climb that falls off a cliff at the wrap.
  // The pivot is fixed at 16, not at the midpoint of the current step count —
  // that way a given step sounds the same whatever the window is doing.
  const ROOT = 130.81;                 // C3
  const DEGREES = [0, 2, 4, 7, 9];
  const PEAK = 16;

  const degreeAt = (i) => (i < PEAK ? i : 2 * PEAK - 1 - i);   // 0..15 then 15..0
  const freqFor = (i) => {
    const d = degreeAt(i);
    return ROOT * Math.pow(2, (DEGREES[d % 5] + 12 * Math.floor(d / 5)) / 12);
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One master pattern; a narrower window just shows fewer of it, so resizing
  // back and forth doesn't wipe what you clicked.
  const pattern = new Array(MAX_STEPS).fill(false);
  [0, 3, 5, 6, 10, 11, 14].forEach((i) => (pattern[i] = true));

  let cells = [];
  let steps = 0;
  let head = 0;
  let timer = null;
  let audio = null;
  let sound = false;

  function wantedSteps() {
    const w = el.clientWidth || window.innerWidth;
    const raw = Math.floor(w / CELL_TARGET);
    const snapped = Math.floor(raw / SNAP) * SNAP;
    return Math.max(MIN_STEPS, Math.min(MAX_STEPS, snapped));
  }

  function build(n) {
    steps = n;
    head = 0;
    el.innerHTML = '';
    cells = [];
    el.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.className = 'seq__cell' + (pattern[i] ? ' seq__cell--on' : '');
      b.type = 'button';
      b.setAttribute('role', 'switch');
      b.setAttribute('aria-checked', pattern[i]);
      b.setAttribute('aria-label', `Step ${i + 1}`);
      b.addEventListener('click', () => {
        pattern[i] = !pattern[i];
        b.setAttribute('aria-checked', pattern[i]);
        b.classList.toggle('seq__cell--on', pattern[i]);
        enableSound();
        if (pattern[i]) play(freqFor(i));
      });
      el.append(b);
      cells.push(b);
    }
  }

  // --- transport ---
  const bar = document.querySelector('[data-seq-controls]');
  const muteBtn = bar && bar.querySelector('[data-seq-mute]');

  /* Under prefers-reduced-motion the transport doesn't autostart, so without a
     control there'd be no way to run it at all. Add one — but only there, so
     everyone else keeps the uncluttered version. */
  let playBtn = null;
  if (reduced && bar) {
    playBtn = document.createElement('button');
    playBtn.className = 'seq__btn';
    playBtn.type = 'button';
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.textContent = 'Play';
    playBtn.addEventListener('click', () => (timer ? stop() : start()));
    bar.prepend(playBtn);
  }

  function syncPlayBtn() {
    if (!playBtn) return;
    playBtn.textContent = timer ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', timer ? 'true' : 'false');
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      sound ? (sound = false) : enableSound();
      muteBtn.setAttribute('aria-pressed', sound);
      muteBtn.textContent = sound ? 'Sound on' : 'Sound off';
    });
  }

  function start() {
    if (timer) return;
    timer = setInterval(tick, TEMPO_MS);
    syncPlayBtn();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    cells.forEach((c) => c.classList.remove('seq__cell--head'));
    syncPlayBtn();
  }

  function tick() {
    if (!cells.length) return;
    cells[head] && cells[head].classList.remove('seq__cell--head');
    head = (head + 1) % steps;
    const cell = cells[head];
    if (!cell) return;
    cell.classList.add('seq__cell--head');
    if (pattern[head]) {
      cell.classList.add('seq__cell--hit');
      setTimeout(() => cell.classList.remove('seq__cell--hit'), 120);
      play(freqFor(head));
    }
  }

  // --- audio ---
  function enableSound() {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio = new Ctx();
    }
    if (audio.state === 'suspended') audio.resume();
    sound = true;
    if (muteBtn) { muteBtn.setAttribute('aria-pressed', 'true'); muteBtn.textContent = 'Sound on'; }
  }

  function play(freq) {
    if (!sound || !audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // --- resize: rebuild only when the step count actually changes ---
  let pending;
  function refit() {
    const n = wantedSteps();
    if (n !== steps) build(n);
  }
  window.addEventListener('resize', () => {
    clearTimeout(pending);
    pending = setTimeout(refit, 150);
  });

  // No pause button now, so stop when the tab isn't visible rather than
  // leaving a timer and audio running in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduced) start();   // reduced-motion: only the button starts it
  });

  build(wantedSteps());
  if (!reduced) start();
})();
