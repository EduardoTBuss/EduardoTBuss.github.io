/**
 * Slow precession for Bloch spheres marked [data-bloch]. Follows the global
 * motion state owned by interactive-background.ts (html[data-motion]), stops
 * when the sphere is off screen or the tab is hidden, and never runs under
 * prefers-reduced-motion. Without JS the build-time pose stays in place.
 */
import { BLOCH, curvePaths, latitude, project, stateOnSphere } from "../lib/bloch";

const PRECESSION = 0.42; // rad/s around z
const NUTATION = 0.16; // rad amplitude of the polar angle

for (const svg of document.querySelectorAll<SVGSVGElement>("svg[data-bloch]")) {
  const vector = svg.querySelector<SVGLineElement>("[data-bloch-vector]");
  const tip = svg.querySelector<SVGCircleElement>("[data-bloch-tip]");
  const halo = svg.querySelector<SVGCircleElement>("[data-bloch-halo]");
  const label = svg.querySelector<SVGTextElement>("[data-bloch-label]");
  const drop = svg.querySelector<SVGPathElement>("[data-bloch-drop]");
  const trailFront = svg.querySelector<SVGPathElement>("[data-bloch-trail-front]");
  const trailBack = svg.querySelector<SVGPathElement>("[data-bloch-trail-back]");
  if (!vector || !tip || !halo || !label || !drop || !trailFront || !trailBack) continue;

  const baseTheta = Number(svg.dataset.theta) || 0.9;
  const basePhi = Number(svg.dataset.phi) || 0.66;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let visible = true;

  const render = () => {
    const theta = baseTheta + NUTATION * Math.sin(elapsed * 0.31);
    const phi = basePhi + PRECESSION * elapsed;
    const p = stateOnSphere(theta, phi);
    const foot = project(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), 0);
    const x = p.x.toFixed(1);
    const y = p.y.toFixed(1);
    vector.setAttribute("x2", x);
    vector.setAttribute("y2", y);
    for (const dot of [tip, halo]) {
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
    }
    // States behind the sphere read as farther away.
    const depthFade = String(0.55 + 0.45 * Math.max(0, Math.min(1, (p.depth + 0.6) / 1.2)));
    tip.style.opacity = depthFade;
    halo.style.opacity = depthFade;
    label.setAttribute("x", (p.x + 16).toFixed(1));
    label.setAttribute("y", (p.y - 12).toFixed(1));
    drop.setAttribute("d", `M${BLOCH.center} ${BLOCH.center}L${foot.x.toFixed(1)} ${foot.y.toFixed(1)}L${x} ${y}`);
    const trail = curvePaths(latitude(theta), 64);
    trailFront.setAttribute("d", trail.front);
    trailBack.setAttribute("d", trail.back);
  };

  const tick = (time: number) => {
    elapsed += previous ? Math.min((time - previous) / 1000, 0.05) : 0;
    previous = time;
    render();
    frame = window.requestAnimationFrame(tick);
  };

  const sync = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    const running =
      document.documentElement.dataset.motion !== "paused" &&
      !reducedMotion.matches &&
      !document.hidden &&
      visible;
    if (running) frame = window.requestAnimationFrame(tick);
  };

  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  }).observe(svg);
  reducedMotion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
}
