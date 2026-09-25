---
project: nbody-sim
updated: "2026-09-03"
metrics:
  - label: Relative energy drift, Leapfrog, ~400 orbits
    value: "7.5e-6"
  - label: Relative energy drift, explicit Euler, same step
    value: "0.91"
  - label: Measured Earth orbital period, J2000 ephemerides
    value: "1.000021 yr"
  - label: Test suite
    value: "35 tests"
---

## Problem

Most weekend gravitational simulators reach for explicit Euler, because it is the obvious
method: advance the position with the velocity, advance the velocity with the acceleration.
The orbits then spiral outward. It is tempting to read that as a bug in the force
computation, but it is a structural property of the method. The question this
project set out to answer is which errors come from the physics and which come from the
choice of time integrator, and how to tell the difference without guessing.

## Approach

I treated the integrator as the object of study rather than an implementation detail. Four
schemes (explicit Euler, semi-implicit Euler, Leapfrog/Velocity-Verlet and RK4) sit behind
one interface and can be swapped by name, or with a keystroke while the simulation is
running. That turns an assertion into an experiment: the same orbit, the same step size,
only the integrator changing. Correctness is then not a matter of the picture looking
plausible, but of conserved quantities (energy, linear momentum, angular momentum, centre
of mass) behaving as the theory says they must.

## Architecture

State is stored as a structure of arrays (`pos[N,3]`, `vel[N,3]`, `mass[N]`) so every force
computation is a single vectorised NumPy broadcast rather than a Python loop, and the
gravitational acceleration is an O(N²) all-pairs evaluation with Plummer softening; units
are non-dimensionalised to AU, years and solar masses, which makes G exactly 4π² and removes
both the measurement uncertainty of G and the enormous SI magnitudes from the arithmetic;
the integrators receive nothing but a function `accel_fn(pos) -> acc` and therefore never
learn what the force law is, which is what lets them be swapped freely; the simulation
engine is fully decoupled from rendering, so the same core drives the headless validation
experiments and the interactive Pygame view, and initial conditions come from real NASA JPL
Horizons ephemerides through a loader that caches to `.npz` and falls back to approximate
values when there is no network.

## Measured results

The signature experiment runs the same eccentric Sun-Earth orbit for roughly 400 orbits at a
fixed step and changes only the integrator. Explicit Euler accumulates a relative energy
error of 0.91: monotonic and secular, with the orbit visibly spiralling out. Semi-implicit Euler
stays bounded at 2.5e-3 and Leapfrog at 7.5e-6: both oscillate around the true value instead
of drifting away from it. RK4 is the most accurate per step at 2.9e-7, but its error creeps
secularly rather than oscillating, so on long enough integrations it loses to the symplectic
schemes.

Against the real Solar System, built from J2000 ephemerides and run for 100 years, the
measured orbital periods land within 0.05% of the published values: Mercury 0.241 yr,
Venus 0.615 yr, Earth 1.000021 yr, Mars 1.88 yr. A finite-difference gradient check confirms
that the acceleration really is the negative gradient of the potential to better than 1e-7.
The suite is 35 tests, including conservation checks parameterised across all four
integrators and a hash-based golden test with a fixed seed.

## Engineering decisions

Making the integrator pluggable was the decision the whole project rests on: without it the
comparison could only be described, not run. Non-dimensionalising the units early removed a
class of magic constants that otherwise spreads through the code. Choosing conserved
quantities as the correctness criterion meant the tests could be objective: energy drift is
a number, "the orbit looks right" is not. Caching the Horizons ephemerides to disk and
providing an offline fallback keeps the second run fast and keeps the test suite independent
of the network.

## Limitations

The force computation is O(N²), which is fine for the Solar System and useless for a star
cluster; a Barnes-Hut tree would slot in by replacing `accel_fn` alone, but it is not
implemented. The dynamics are Newtonian, so Mercury's perihelion precession does not appear.
The visualisation is two-dimensional, although the state arrays are already shaped for three.
And the comparison between integrators is empirical: it demonstrates the difference
convincingly, but the shadow-Hamiltonian argument that explains *why* symplectic schemes
behave this way lives in the write-up, not in the code.

## Links

- Repository and full documentation on GitHub.
- Ephemerides from the NASA JPL Horizons system.
