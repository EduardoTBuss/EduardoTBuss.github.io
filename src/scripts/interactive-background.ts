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
  // Deterministic seeds: the paused frame is stable and positions derive from
  // time alone, so nothing accumulates between frames or resize events.
  const seeds = Array.from({ length: 90 }, (_, index) => {
    const heading = -1.15 + ((index * 37) % 29) / 29; // mostly up and to the right
    const speed = 5 + ((index * 53) % 17);
    return {
      x: ((index * 73 + 19) % 101) / 101,
      y: ((index * 47 + 31) % 103) / 103,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      phase: index * 2.399963,
      radius: index % 11 === 0 ? 2.2 : 0.8 + (index % 4) * 0.3,
      tone: index % 7 === 0 ? "195,201,255" : "133,207,239",
      alpha: 0.22 + (index % 5) * 0.07,
    };
  });
  const wrap = (value: number, size: number) =>
    ((((value + 20) % (size + 40)) + size + 40) % (size + 40)) - 20;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Fewer particles on small screens keep density and cost constant.
    const count = Math.min(seeds.length, Math.round((width * height) / 15000) + 24);
    for (let i = 0; i < count; i += 1) {
      const seed = seeds[i];
      let x = wrap(seed.x * width + seed.vx * phase + Math.sin(phase * 0.4 + seed.phase) * 6, width);
      let y = wrap(seed.y * height + seed.vy * phase, height);
      let proximity = 0;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        proximity = Math.max(0, 1 - distance / 200);
        x -= (pointer.x - x) * proximity * 0.18;
        y -= (pointer.y - y) * proximity * 0.18;
      }
      const alpha = Math.min(0.9, seed.alpha + proximity * 0.4);
      if (seed.radius > 2) {
        ctx.beginPath();
        ctx.arc(x, y, seed.radius * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${seed.tone},${alpha * 0.12})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, seed.radius + proximity * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${seed.tone},${alpha})`;
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
