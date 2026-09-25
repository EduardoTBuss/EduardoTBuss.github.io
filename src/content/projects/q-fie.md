---
project: q-fie
updated: "2026-09-25"
metrics:
  - label: Illustrative model in the application
    value: "7 symptoms x 5 urgency categories"
  - label: Backend tests passing in the current checkout
    value: "72"
  - label: Analytic threshold in the example model
    value: "0.75"
---

## Problem

The research question is how two fuzzy implication rules change the output of a
compositional inference pipeline. A formula alone hides the intermediate relation matrix
and the point at which a classification changes.

## Approach

Q-FIE's Q-CRISP application lets a visitor adjust seven illustrative symptom values,
compare Reichenbach and quantum Lukasiewicz implication, and inspect the resulting matrix
and five urgency degrees. It places the immediate closed-form calculation beside an
on-demand Qiskit Aer simulation of the corresponding circuits.

## Architecture

The Python core holds the constants, closed-form implication and aggregation functions,
circuit builders and simulator validation; FastAPI exposes the analytic calculation and
asynchronous circuit jobs; a React frontend displays sliders, a relation heatmap, urgency
bars and the comparison; SQLite stores demonstration patient records and their computed
classification snapshots, while the detail view recomputes the full pipeline from the
stored inputs.

## Measured results

The configured model has 7 symptom values and 5 categories, producing a 7 x 5 relation
matrix. In the README's worked third example, the Reichenbach urgency degree for the
"Very Urgent" category is 0.7807, while the quantum Lukasiewicz value is 0.7498; they
fall on opposite sides of the illustrative 0.75 threshold. The current checkout passes
72 backend tests, including formula, parity, API and patient-record tests
(`python -m pytest -q backend/app/tests`).

## Engineering decisions

The analytic path keeps UI feedback immediate, while the circuit path runs as a separate
job because simulation is more expensive. Putting the equations in one backend core gives
the API and saved-record workflow the same calculation. Exposing both implication rules
and intermediate values makes the classification change inspectable.

## Limitations

This is an academic, illustrative demo, not a clinical decision tool. Qiskit Aer runs the
circuits on a classical computer; there is no quantum hardware result or clinical
validation. The README's "42 tests" statement predates the current 72-test suite.

## Links

- [Source code and documentation](https://github.com/EduardoTBuss/Q-FIE).
