/**
 * Orthographic projection for the decorative Bloch sphere.
 * Shared by the build-time SVG (BlochSphere.astro) and the motion controller
 * (src/scripts/bloch-sphere.ts) so the static and animated states agree.
 */
export const BLOCH = {
  size: 400,
  center: 200,
  radius: 138,
  azimuth: (-32 * Math.PI) / 180,
  elevation: (19 * Math.PI) / 180,
} as const;

export interface ProjectedPoint {
  x: number;
  y: number;
  /** Positive values face the viewer. */
  depth: number;
}

/** Projects a point on (or inside) the unit sphere to SVG coordinates. */
export function project(x: number, y: number, z: number): ProjectedPoint {
  const { azimuth, elevation, center, radius } = BLOCH;
  const x1 = x * Math.cos(azimuth) - y * Math.sin(azimuth);
  const y1 = x * Math.sin(azimuth) + y * Math.cos(azimuth);
  const up = z * Math.cos(elevation) + y1 * Math.sin(elevation);
  return {
    x: center + radius * x1,
    y: center - radius * up,
    depth: -y1 * Math.cos(elevation) + z * Math.sin(elevation),
  };
}

/** Bloch state (polar angle theta from |0>, azimuth phi) on the unit sphere. */
export const stateOnSphere = (theta: number, phi: number) =>
  project(
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta),
  );

const fmt = (value: number) => value.toFixed(1);

/**
 * Samples a closed curve and splits it into front-facing and back-facing
 * SVG path data, so hidden halves can be drawn dashed and dimmed.
 */
export function curvePaths(
  point: (t: number) => [number, number, number],
  samples = 96,
): { front: string; back: string } {
  const runs = { front: [] as string[], back: [] as string[] };
  let current: "front" | "back" | null = null;
  let segment = "";
  for (let i = 0; i <= samples; i += 1) {
    const p = project(...point((i / samples) * Math.PI * 2));
    const side = p.depth >= 0 ? "front" : "back";
    if (side !== current) {
      if (current && segment) runs[current].push(segment);
      segment = `M${fmt(p.x)} ${fmt(p.y)}`;
      current = side;
    } else {
      segment += `L${fmt(p.x)} ${fmt(p.y)}`;
    }
  }
  if (current && segment) runs[current].push(segment);
  return { front: runs.front.join(""), back: runs.back.join("") };
}

/** Latitude circle at polar angle theta. */
export const latitude = (theta: number) => (t: number): [number, number, number] => [
  Math.sin(theta) * Math.cos(t),
  Math.sin(theta) * Math.sin(t),
  Math.cos(theta),
];

/** Great circle through both poles at azimuth phi. */
export const meridian = (phi: number) => (t: number): [number, number, number] => [
  Math.sin(t) * Math.cos(phi),
  Math.sin(t) * Math.sin(phi),
  Math.cos(t),
];
