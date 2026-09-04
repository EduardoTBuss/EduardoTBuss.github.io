---
project: inventory-management-api
updated: "2026-09-03"
metrics:
  - label: Stock invariant audited across every product on each seed run
    value: "quantity == SUM(ledger deltas)"
  - label: Concurrency control on the write path
    value: "SELECT ... FOR UPDATE per product row"
  - label: REST routes behind JWT authentication
    value: "29"
---

## Problem

Almost every inventory tutorial keeps a single mutable column on the product row and does
`quantity += n` on each operation. It is simple, and it fails in three ways at once: history
is lost, so nothing can be audited; a mistake is unrecoverable, because there is no record of
what the value used to be; and under concurrent writes it corrupts silently, since two
simultaneous movements read the same starting quantity and one of the updates disappears.
The interesting problem in an inventory system is not the CRUD, it is making the stock number
trustworthy.

## Approach

Stop storing the quantity as a fact and start deriving it. Every change in stock is an
append-only movement row carrying its direction, amount, reason and author, and the product's
quantity is the sum of those movements. The cached total still exists so that reads stay
cheap, but it is only ever written inside the same transaction that inserts the corresponding
movement, and the seed script audits the invariant across all products and fails loudly if
any cached value has diverged from its ledger.

## Architecture

A FastAPI application exposes a JWT-authenticated REST API over SQLAlchemy 2.0 models, with
bcrypt password hashing and a basic in-memory rate limiter on the login route; tenancy is
enforced at the query layer, every row carrying the identifier of the system it belongs to
so one tenant can never read another's data, and three roles separate the super-admin who
manages tenants from the admin who manages one and the operator who only registers
movements; the write path for a movement opens a transaction, takes a pessimistic row lock on
the product with `SELECT ... FOR UPDATE`, validates the operation against the locked
quantity, then inserts the movement and updates the cached total together so that both commit
or neither does; the frontend is plain HTML with Tailwind and Alpine from a CDN, served as
static files by the same FastAPI process, so the whole system runs with one command and no
build step.

## Measured results

The invariant `quantity == SUM(deltas)` is checked over every product on each seed run and
the script exits non-zero if any product diverges, which makes the guarantee executable
rather than documented. The pessimistic lock closes the lost-update window on the movement
path: two concurrent movements against the same product serialise instead of both reading the
same starting value. The API surface is 29 routes, all authenticated except login, and the
running system was verified end to end: server boots, seed login returns a JWT, an
authenticated product listing returns data, and the frontend is served from the same process.

## Engineering decisions

Deriving the quantity from a ledger instead of mutating a counter is the decision the project
exists to demonstrate; it buys a complete audit trail and a state that can always be
reconstructed. Keeping a materialised cache of the sum is the deliberate compromise: without
it, every read would aggregate the whole movement history. Choosing a pessimistic lock over
optimistic concurrency was a fit to the workload, since inventory movements are short,
frequent and conflict-prone, and a retry loop would be more machinery for no benefit here.
Serving the frontend from the API process removes a build step and a deployment target from a
project whose point is the backend.

## Limitations

This is event-sourcing-lite, not event sourcing: there is no event store and no replay
engine, and the canonical state still lives in ordinary relational tables. Development runs
on SQLite, where `SELECT ... FOR UPDATE` does not have the same semantics as it does in
PostgreSQL, so the locking guarantee is only fully real once the connection URL points at
Postgres. The login rate limiter keeps its state in memory, which means it resets on restart
and does not work across multiple processes. And the concurrency claim rests on the design
and on manual verification; there is no automated stress test firing simultaneous movements
at the same product.

## Links

- Repository, API documentation and demo credentials on GitHub.
