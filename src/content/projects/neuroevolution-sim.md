---
project: neuroevolution-sim
updated: "2026-09-25"
metrics:
  - label: Default population and species count in SimConfig
    value: "100 creatures, 4 species"
  - label: Default vision inputs per creature
    value: "8 rays + 7 scalars"
  - label: Default generation length
    value: "500 simulation steps"
---

## Problem

Evolutionary behavior is hard to understand from a final score alone. This project makes
the movement, sensing and selection of autonomous creatures visible as generations run.

## Approach

Each creature's neural-network weights form its genome. Sensor inputs feed a two-layer
MLP that chooses speed and turning. Fitness drives tournament selection; elitism, uniform
crossover and Gaussian mutation create the next population. The browser draws the world
and tracks average and maximum fitness across generations.

## Architecture

The simulation stores creature state and neural-network weights in NumPy arrays, evaluating
the population's forward passes with batched `einsum` operations; a `World` handles
movement, food, species behavior and generation changes; a background `SimRunner` controls
stepping and queues frames; FastAPI exposes controls and a WebSocket stream; the JavaScript
frontend renders the world on Canvas and plots generation statistics.

## Measured results

The checked-in configuration defaults to 100 creatures across 4 species, with 8 vision
rays plus 7 scalar inputs per creature. A generation lasts 500 simulation steps by
default. These are verified configuration values, not a measured throughput or evidence
that fitness improves. The README lists performance targets but provides no reproducible
benchmark output or learning curve to support a numerical outcome claim.

## Engineering decisions

Batching neural-network evaluation across creatures removes one Python forward-pass call
per creature. Keeping the runner behind API controls allows a visitor to pause and adjust
the simulation while the browser receives frames. The genetic operators act on flattened
weight vectors, then restore their original tensor shapes.

## Limitations

The repository does not publish a measured speed or a controlled experiment showing
learning across runs. Outcomes depend on configuration and randomness. The visualization
requires a running Python server; there is no hosted browser demo linked here.

## Links

- [Source code and setup instructions](https://github.com/EduardoTBuss/neuroevolution-sim).
