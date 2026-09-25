---
project: ray-tracer
updated: "2026-09-25"
metrics:
  - label: Checked-in final PNG dimensions
    value: "400 x 225 pixels"
  - label: Samples requested by final_scene.py
    value: "100 per pixel"
  - label: Maximum scattering depth in final_scene.py
    value: "50 bounces"
---

## Problem

An image with reflections, glass and soft focus is easy to obtain with a rendering
library, but that obscures the geometry and probability behind each pixel. This project
implements those mechanisms directly to make them inspectable.

## Approach

The renderer traces rays through a seeded scene of spheres. Materials scatter each hit
diffusely, reflect it as metal or refract it as glass. Random subpixel samples smooth the
image, and a thin-lens camera adds depth of field.

## Architecture

The plain Python implementation separates vectors, rays, camera, sphere intersections,
material scattering and rendering; the final-scene script builds deterministic sphere
geometry and calls a Numba renderer with the same public render signature; that optimized
path flattens the supported sphere and material data into NumPy arrays and compiles an
iterative bounce loop before writing PPM and PNG output.

## Measured results

The repository contains `output/final_scene.png`, whose PNG header reports 400 x 225
pixels. The final-scene script requests 100 samples per pixel and a maximum depth of 50
scattering bounces. Those are output dimensions and configured quality settings, not a
reproduced runtime benchmark or an independently measured speedup.

## Engineering decisions

The object interfaces make the mathematical operations readable in the reference renderer.
The Numba path trades generality for speed by flattening scene data and compiling a loop
that handles the three implemented material types. Seeding scene construction keeps object
placement stable between renders.

## Limitations

The optimized renderer supports spheres with Lambertian, metal or dielectric materials;
it is not a general scene engine. Rendering remains stochastic, and the checked-in image
alone does not establish runtime or visual convergence. The README follows *Ray Tracing
in One Weekend*, so this is an implementation exercise rather than a novel algorithm.

## Links

- [Source code, tests and final render](https://github.com/EduardoTBuss/ray-tracer).
