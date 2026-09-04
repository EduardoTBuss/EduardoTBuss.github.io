---
project: quantum-algorithms-qiskit
updated: "2026-09-03"
metrics:
  - label: Oracle queries to recover an n-bit secret, Bernstein-Vazirani
    value: "1, against n classically"
  - label: Evaluations to decide constant or balanced, Deutsch-Jozsa
    value: "1, against up to 2^(n-1)+1"
  - label: Algorithms shipped with derivation, circuit and executed counts in one file
    value: "3"
---

## Problem

Quantum algorithms are usually met twice and never joined up: once as algebra on a
blackboard, once as a code snippet that prints a dictionary of counts. Neither form lets you
check that the speedup being claimed is the speedup being demonstrated. I wanted a place
where the derivation, the circuit and the measured outcome sit next to each other, so the
claim can be verified rather than accepted.

## Approach

One notebook per algorithm, each carrying the mathematics, the circuit drawn inline, and the
result of actually executing it on a simulator. The three algorithms are chosen to isolate
different mechanisms: Bernstein-Vazirani for phase kickback, Deutsch-Jozsa for interference
between branches of a superposition, and the Mach-Zehnder interferometer for the continuous
phase relationship underneath both. Standalone scripts remain in the repository so each
algorithm can also be run without opening a notebook.

## Architecture

Each algorithm is a self-contained module that builds its circuit from primitives rather than
calling a library routine: the Bernstein-Vazirani oracle is constructed explicitly as a
unitary encoding the secret string, the Deutsch-Jozsa oracles are written out for all four
one-bit function types, two constant and two balanced, and the Mach-Zehnder setup is
expressed as Hadamard, phase shift, Hadamard so that the beam splitters are visibly the same
operation as the superposition gates; execution goes through the Qiskit simulator and the
notebook then compares the measured distribution against the analytic prediction, which is
what turns each file into an experiment rather than a demonstration.

## Measured results

Bernstein-Vazirani recovers a hidden four-bit string in a single oracle query, with every
shot landing on the correct outcome, where a classical algorithm needs one query per bit.
Deutsch-Jozsa decides constant versus balanced in one evaluation for all four test
functions, deterministically, against a classical worst case of 2^(n-1)+1 evaluations. The
Mach-Zehnder simulation reproduces the full interference fringe: the measured probability of
the zero outcome traces cos squared of half the phase difference across the sweep, matching
the analytic curve.

## Engineering decisions

Writing the oracles by hand instead of calling a built-in gate is what makes phase kickback
visible; a library oracle would hide exactly the mechanism the notebooks exist to show.
Keeping both notebook and script forms means the repository serves reading and running
equally well. Sweeping the Mach-Zehnder phase and plotting against theory, rather than
sampling a single phase, converts a plausible single number into a curve that either matches
or does not.

## Limitations

Everything runs on a simulator: there is no noise model and no transpilation to a real
device's coupling map, so nothing here says anything about how these circuits behave on
hardware. The algorithms are the textbook cases, chosen for clarity rather than practical
value, and Bernstein-Vazirani in particular solves a problem nobody has. The oracles are
constructed with knowledge of the answer, which is standard for these demonstrations but
worth stating plainly.

## Links

- Repository with the three notebooks and the runnable scripts on GitHub.
- Two of these algorithms back conference papers, linked from the page header.
