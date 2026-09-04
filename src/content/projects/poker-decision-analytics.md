---
project: poker-decision-analytics
updated: "2026-09-03"
metrics:
  - label: Hands parsed, across 92 sessions
    value: "60,000+"
  - label: Tail risk, mean of the 5% worst outcomes
    value: "-14.24 BB"
  - label: Win/loss asymmetry, average win over average loss
    value: "1.82x"
  - label: Total result of the dataset
    value: "-2,413 BB"
---

## Problem

Judging a decision by its outcome is the most common mistake in any domain with uncertainty:
a good decision can lose and a bad one can win, and with enough noise the two are
indistinguishable in a single sample. What is needed is a dataset where the decision, the
context it was made in and the measurable result are all recorded, so that decision quality
can be separated from luck. Poker hand histories are one of the few public datasets with all
three.

## Approach

Treat the hand history as structured data rather than as a game. Every hand gives an action,
a position, a betting round and a numerical outcome in big blinds, which is enough to
estimate expected value conditioned on context, to measure dispersion rather than just the
mean, and to locate where losses concentrate. The framework is deliberately about decisions
under uncertainty, with poker supplying the data; the same shape of question applies wherever
outcomes are noisy and context matters.

## Architecture

The pipeline has three stages that are kept strictly separate: a parser that reads the plain
text `.phh` files of the public Pluribus dataset and normalises them into two flat tables,
one row per hand and one row per player-hand; a storage step that writes both as CSV and
Parquet and commits the parsed result to the repository, so a fresh clone runs immediately
without downloading ten thousand raw files; and an analysis layer built on pandas that
computes expected value, variance, drawdown and tail risk, sliced by position and by street,
emitting five figures. Splitting parsing from analysis is what makes the expensive step run
once and the cheap step run as often as a question needs re-asking.

## Measured results

The corpus is over 60,000 hands across 92 sessions. The aggregate result is -2,413 big
blinds, which is expected and is discussed below rather than hidden. The risk profile is more
informative than the mean: the average of the 5 percent worst outcomes is -14.24 big blinds,
and the ratio of the average win to the average loss is 1.82, meaning the winning hands are
substantially larger than the losing ones even though the total is negative. That asymmetry
is the interesting finding, because it is the signature of a strategy that loses small and
often while winning large and rarely, and it is invisible to anyone who only looks at the
total.

## Engineering decisions

Separating parsing from analysis and committing the parsed tables was the decision that made
the project usable by anyone else: the ten thousand raw files are reproducible from a public
source but nobody wants to download them to read a chart. Choosing Parquet alongside CSV
keeps the tables both machine-efficient and human-inspectable. Reporting tail risk and
dispersion rather than only the mean is the analytical decision that the whole project rests
on, since a mean alone cannot distinguish a steady strategy from a volatile one with the same
average.

## Limitations

The dataset comes from the training of an AI agent in an exploratory phase, not from expert
play, so the negative aggregate result is an expected property of the data and not a finding
about poker. This is not a strategy tool and gives no advice about how to play. The analysis
is observational and correlational: it can show that outcomes differ by position, not that
position caused the difference, since the decisions were not randomised. Expected value is
estimated from realised outcomes, which conflates decision quality with variance at any
sample size, and the fixed six-player Pluribus setup means none of the numbers generalise to
other formats.

## Links

- Repository with the parser, the analysis pipeline and the generated figures on GitHub.
- Source data: the public phh-dataset of Pluribus hand histories.
