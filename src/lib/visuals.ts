/** Concept illustration used for each project card. Presentation only. */
export type VisualKind =
  | "orderforge"
  | "physics"
  | "nbody"
  | "quantum"
  | "qfie"
  | "poker"
  | "neuroevolution"
  | "raytracer"
  | "generic";

const visualBySlug: Record<string, VisualKind> = {
  "order-forge": "orderforge",
  "q-fie": "qfie",
  "poker-decision-analytics": "poker",
  "neuroevolution-sim": "neuroevolution",
  "ray-tracer": "raytracer",
  physics2d: "physics",
  "nbody-sim": "nbody",
  "quantum-algorithms-qiskit": "quantum",
};

export const visualFor = (slug: string): VisualKind => visualBySlug[slug] ?? "generic";
