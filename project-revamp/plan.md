# Tally — revamp plan

> **Outbound Without The Spreadsheet**
>
> Renamed from AJ-Outbound. Part of a portfolio-wide revamp; the
> cross-project source of truth lives in `sprout/portfolio-ws/revamp/`.

## Assigned design template

UNASSIGNED — see templates.md

The template is a *reference*, not a dependency — match its typography, colour
and layout signature; do not import Wix markup.

## Analysis and feature plan

## 8. `AJ-Outbound` — outbound outreach CLI

**Now.** Small and sharp: `index.js` orchestrating four API adapters
(`lookalikes.js` Apollo, `prospeo.js` + `prospeoEnrich.js` for decision-makers and
email resolution, `brevo.js` for sending) plus `utils/logger.js`. 24 KB of JS, no
framework, four documented run modes including a `--safety` Y/N checkpoint.
Recent (2026-06-07) and working. What it lacks is everything that makes a tool
which **sends real email to real people** safe to run twice: no persistence, no
tests, no suppression list, no idempotency — a crash in stage 3 loses the run.
**Cheapest complete revamp on the list.**

| # | Feature | Effort |
|---|---|---|
| 1 | **Durable run state.** `better-sqlite3` with `runs`/`companies`/`prospects`/`emails`/`events`; each stage writes idempotently keyed on `(run_id, entity)` so `--resume <run-id>` picks up exactly where a crash left off and re-running a finished stage is a no-op. | **M** |
| 2 | **Suppression + compliance.** Global do-not-contact list checked before every send, per-domain cooldown (never two people at one company within N days), unsubscribe token in every message, and a Brevo webhook consumer auto-suppressing on bounce / complaint / unsubscribe. This is what separates outreach tooling from spam tooling. | **M** |
| 3 | **Quota governance.** Per-API token buckets sized to the Apollo/Prospeo plan limits, bounded concurrency, jittered exponential backoff on 429/5xx, and a circuit breaker that halts the run rather than burning credits against a degraded upstream. | **S** |
| 4 | **True dry-run.** `--render` writes the exact final MIME for every planned send to `out/<run-id>/` plus an HTML review index, with zero network calls. Strictly better than the current `--demo`, which still sends. | **S** |
| 5 | **Offline test suite.** `nock` fixtures recorded from all three upstreams; a full-pipeline snapshot test running in CI with no API keys and no network. | **M** |
| 6 | **Reporting.** JSONL structured audit log plus an `outbound report <run-id>` subcommand pulling Brevo events into a per-campaign funnel: resolved → sent → delivered → opened → replied. | **M** |
| 7 | **Templating with a lint step.** Per-persona templates with declared variables, optional LLM personalisation behind a deterministic seed and a hash-keyed cache, and a validator that **fails the run** on any unfilled `{{variable}}` or missing unsubscribe token. | **M** |
| 8 | Remove the client domain and personal gmail from README and code (see X2). | **S** |

**Highest credibility-per-hour: features 1 + 2.** Resumability and a suppression
list are exactly what an interviewer probes on hearing "I built a cold email
tool," and they are roughly two days on a codebase this small.

**Tier 2** — but if Tier 1 slips, do this one anyway.

---
