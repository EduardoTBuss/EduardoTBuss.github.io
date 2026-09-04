---
project: physics2d
updated: "2026-09-03"
metrics:
  - label: Five-box stack, horizontal drift over 7 s
    value: "3.1e-4"
  - label: Resting box penetration, against a slop of 0.005
    value: "0.0026"
  - label: End-to-end speedup after profiling the solver
    value: "3.0-3.9x"
  - label: Test suite
    value: "64 tests"
---

## Problem

I wanted to know how something like Box2D actually works instead of importing it. The
specific question that turned out to matter was narrower than "how do I simulate physics":
it was why a stack of boxes refuses to stand still. A naive contact solver produces a pile
that trembles forever, slowly slides apart, or sinks through the floor, and none of those
failures tell you which part of the pipeline is wrong.

## Approach

Build the whole pipeline from scratch, with the physics core forbidden from importing any
graphics library, so that every claim can be tested headlessly and deterministically. Each
stage is validated against an oracle that does not come from the simulation itself:
closed-form 1D collisions, hand-computed separating axes, conservation of momentum, and the
analytic normal force on an inclined plane. On top of the engine sits an interactive
Physics 1 lab that draws the free-body diagram of the selected body while the simulation
runs, which is both a showcase and a continuous sanity check on the contact forces.

## Architecture

The world advances on a fixed timestep with an accumulator, and the renderer interpolates
between the previous and current state by the leftover fraction, so the physics never sees a
variable step and the simulation stays deterministic and reproducible; bodies integrate
semi-implicitly, velocity before position, because explicit Euler injects energy and
diverges; collision detection runs in three stages, a quadtree broadphase that is a drop-in,
bit-identical replacement for the brute-force reference, a separating-axis narrowphase for
circle/circle, circle/polygon and polygon/polygon, and a manifold generator that clips the
incident face against the reference face by Sutherland-Hodgman to produce one or two contact
points; those contacts feed a sequential-impulse solver that iterates ten times with
accumulated and clamped impulses, Coulomb friction inside the cone, and warm starting from
the previous step, followed by a positional correction with a small slop so that resting
contacts neither jitter nor sink.

## Measured results

The signature test is a stack of five boxes: after settling it drifts 3.1e-4 horizontally
over seven seconds, with maximum linear velocity 1.1e-4 and maximum angular velocity 3.2e-5.
A single resting box penetrates the ground by 0.0026, inside the 0.005 slop, with residual
velocity on the order of 1e-18. A bouncing ball with restitution below one produces strictly
decreasing peak heights (3.05, 1.95, 1.33, and so on) whose energy ratio matches the square
of the restitution. Elastic collisions conserve momentum and kinetic energy exactly, and the
unequal-mass case matches the closed-form 1D solution with zero error. The suite is 64 tests,
including a hash-based golden regression over a 600-step scene and a determinism test
confirming that the same scene run twice is bit-identical.

Profiling a 500-body pile found the real cost where I did not expect it. The velocity solver
was 67% of the runtime, and almost none of it was arithmetic: it was allocation and dispatch
of two-element NumPy arrays, one per contact per iteration per step. Since sequential impulse
is Gauss-Seidel and cannot be batched without changing the physics, the fix was the opposite
of the usual advice, rewriting the hot loop in plain Python floats. Same mathematics,
bit-identical golden output, 3.0 to 3.9 times faster end to end. The quadtree was only 12%
and was never the bottleneck.

## Engineering decisions

Keeping the core headless is what made every result above testable; a physics engine that can
only be observed through a window cannot be regression-tested. Fixing the timestep bought
determinism, which in turn made a hash-based golden test possible. Building the brute-force
broadphase first and requiring the quadtree to be bit-identical to it turned an optimisation
into a verifiable refactor. Stack stability came from three details of the solver rather than
from more physics: iterating, accumulating and clamping the impulse between iterations, and
warm starting. And measuring before optimising is the reason the speedup landed in the solver
instead of in the spatial structure I would have guessed.

## Limitations

Only convex polygons and circles are supported; concave shapes have to be decomposed by hand.
Tunnelling is mitigated with substeps rather than continuous collision detection, so a small
body at very high speed can still pass through a thin wall. There are no joints yet, the
mouse spring being the only constraint implemented, and no sleeping, so an idle scene keeps
paying full solver cost. The engine is written in Python, which puts it orders of magnitude
below a production C++ engine in throughput; the goal was understanding, not competing with
Box2D.

## Links

- Repository, test suite and benchmark harness on GitHub.
- The sequential-impulse formulation follows Erin Catto's GDC material, reimplemented from
  scratch rather than ported.
