/** Small, dependency-free ambient renderer. Never animates hidden or reduced-motion pages. */
const host = document.querySelector<HTMLElement>(
  "[data-interactive-background]",
);
const canvas = host?.querySelector("canvas");
const toggle = document.querySelector<HTMLButtonElement>(
  "[data-motion-toggle]",
);
const context = canvas?.getContext("2d");

if (host && canvas && toggle && context) {
  const ctx = context;
  const surface = canvas;
  const button = toggle;
  const label = button.querySelector<HTMLElement>("[data-motion-label]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, active: false };
  let width = 1;
  let height = 1;
  let frame = 0;
  let previousTime = 0;
  let phase = 0;
  let paused = false;
  const pauseStorageKey = "portfolio-motion-paused";
  try {
    paused = window.localStorage.getItem(pauseStorageKey) === "true";
  } catch {
    /* Storage may be unavailable in private contexts. */
  }
  // Deterministic seeds prevent visual changes between resize events.
  const seeds = Array.from({ length: 50 }, (_, index) => ({
    x: ((index * 73 + 19) % 101) / 101,
    y: ((index * 47 + 31) % 103) / 103,
    phase: index * 2.399963,
    radius: index % 9 === 0 ? 1.7 : 0.8 + (index % 3) * 0.18,
  }));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const seed of seeds) {
      let x = seed.x * width + Math.sin(phase * 0.17 + seed.phase) * 12;
      let y = seed.y * height + Math.cos(phase * 0.13 + seed.phase) * 10;
      let proximity = 0;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        proximity = Math.max(0, 1 - distance / 180);
        x += (pointer.x - x) * proximity * 0.11;
        y += (pointer.y - y) * proximity * 0.11;
      }
      ctx.beginPath();
      ctx.arc(x, y, seed.radius + proximity * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(133,207,239,${0.17 + proximity * 0.39})`;
      ctx.fill();
    }
  }

  function animate(time: number) {
    phase += previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    draw();
    frame = window.requestAnimationFrame(animate);
  }

  function syncMotion() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    const stopped = paused || reducedMotion.matches;
    document.documentElement.dataset.motion = stopped ? "paused" : "running";
    button.setAttribute("aria-pressed", String(stopped));
    button.disabled = reducedMotion.matches;
    button.title = reducedMotion.matches
      ? "Motion disabled by your device accessibility preference"
      : "";
    if (label)
      label.textContent = reducedMotion.matches
        ? "Reduced motion"
        : paused
          ? "Resume motion"
          : "Pause motion";
    draw();
    if (!stopped && !document.hidden)
      frame = window.requestAnimationFrame(animate);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * dpr);
    surface.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  const controller = new AbortController();
  const options = { signal: controller.signal };
  window.addEventListener("resize", resize, options);
  window.addEventListener(
    "pointermove",
    (event) => {
      if (paused || reducedMotion.matches || event.pointerType === "touch")
        return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { ...options, passive: true },
  );
  document.addEventListener(
    "pointerleave",
    () => {
      pointer.active = false;
    },
    options,
  );
  document.addEventListener("visibilitychange", syncMotion, options);
  reducedMotion.addEventListener("change", syncMotion, options);
  button.addEventListener(
    "click",
    () => {
      paused = !paused;
      try {
        window.localStorage.setItem(pauseStorageKey, String(paused));
      } catch {
        /* The current page still respects the preference. */
      }
      syncMotion();
    },
    options,
  );
  window.addEventListener(
    "pagehide",
    (event) => {
      window.cancelAnimationFrame(frame);
      if (!event.persisted) controller.abort();
    },
    options,
  );
  window.addEventListener("pageshow", syncMotion, options);
  button.hidden = false;
  resize();
  syncMotion();
}
