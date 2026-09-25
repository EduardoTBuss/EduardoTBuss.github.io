---
project: order-forge
updated: "2026-09-25"
metrics:
  - label: Benchmark runs across formats and strategies
    value: "12"
  - label: Customer formats with correct line count from the external LLM
    value: "4 / 4"
  - label: Correct catalog codes on the German sample with deterministic parsing
    value: "7 / 7"
  - label: Mean extraction time for the external LLM in the recorded run
    value: "8.5 s / PDF"
---

## Problem

A workshop challenge modeled an aluminium manufacturer receiving purchase orders as PDFs
from customers with different formats. The legacy ERP accepts EDIFACT messages and rejects
an order when an internal product code is wrong. Extracting text from a PDF is therefore
only the first step: every line needs to resolve to a valid catalog entry before export.

## Approach

Order Forge offers three extraction paths: a deterministic parser, a local Ollama model and
an external API model. A separate reconciliation stage maps the extracted specifications to
catalog codes. The operator can inspect the original order, correct uncertain lines and
confirm them; EDIFACT generation remains locked until every code passes validation.

## Architecture

The project extends a workshop starter with a FastAPI order-intake module and a Next.js
reconciliation screen, running alongside Postgres, Mongo and blob storage in Docker Compose;
the module separates ingest, extraction, catalog reconciliation, confidence signals and
EDIFACT generation, while the UI presents the source PDF and resolved lines for human review.

## Measured results

The repository records 12 runs: three extraction strategies across four customer formats,
compared with reference EDIFACT files. The external LLM recovered the expected line count
in all four formats, averaging 8.5 seconds per PDF, but the catalog resolver still mapped
some lines to incorrect valid codes. The deterministic parser got all 7 catalog lines right
on the German sample and produced a 55-segment `ORDERS:D:96A` message; it did not handle
the other layouts reliably. The repository reports 82 passing backend tests. These are
challenge and test results, not production customer metrics.

## Engineering decisions

The LLM can extract order information, but it cannot invent the ERP's internal codes:
resolution comes from product specifications and the catalog. The benchmark showed why
this boundary matters: reading lines worked better than resolving them. Confidence flags
are based on specific mismatches and ambiguities rather than an uncalibrated model
probability. The export gate checks every code after the operator's corrections. Written
architecture decisions, benchmarks and audit records document the multi-agent workflow.

## Limitations

This is a solution to a workshop scenario built on its starter scaffold. The customer
formats, catalog and reference orders are challenge fixtures. The documented checks establish
behavior on those cases; they do not establish production accuracy, a live ERP integration or
performance on unseen customer documents.

## Links

- [Source and project overview](https://github.com/EduardoTBuss/order-forge).
- [Benchmark and reference comparisons](https://github.com/EduardoTBuss/order-forge/tree/main/docs/benchmark).
- [Requirements audit](https://github.com/EduardoTBuss/order-forge/blob/main/docs/requirements-audit.md).
- [Agent workflow and handoffs](https://github.com/EduardoTBuss/order-forge/blob/main/docs/how-it-was-built.md).
