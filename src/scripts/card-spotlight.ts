/** Delegated card lighting: one queued paint per pointer movement, no animation loop. */
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let pendingFrame = 0;
let activeCard: HTMLElement | null = null;
let pointerX = 0;
let pointerY = 0;
const motionStopped = () =>
  motionPreference.matches ||
  document.hidden ||
  document.documentElement.dataset.motion === "paused";

document.addEventListener(
  "pointermove",
  (event) => {
    if (motionStopped() || event.pointerType === "touch") return;
    activeCard =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(".tech-card")
        : null;
    if (!activeCard) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pendingFrame) return;
    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      if (!activeCard || !activeCard.isConnected || motionStopped()) return;
      const bounds = activeCard.getBoundingClientRect();
      activeCard.style.setProperty("--spot-x", `${pointerX - bounds.left}px`);
      activeCard.style.setProperty("--spot-y", `${pointerY - bounds.top}px`);
    });
  },
  { passive: true },
);

window.addEventListener("pagehide", () => {
  window.cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  activeCard = null;
});
