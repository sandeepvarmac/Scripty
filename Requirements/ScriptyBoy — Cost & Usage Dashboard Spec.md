# ScriptyBoy — Cost & Usage Dashboard Spec

## 1) Purpose & Outcomes

Give founders/ops a **single source of truth** for:

* **Model spend** (per model family, org, user, feature),
* **Unit economics** (cost per analysis, cost per Buddy chat, gross margin by tier),
* **Value delivered** (accepted rewrites, continuity fixes, pitch exports),
* **Compliance** (privacy flags, retention), and
* **Alerts/budgets** (soft/hard caps, anomaly detection).

**Success criteria**

* P0: Daily accuracy ±2% vs provider invoices; near‑real‑time (≤2 min lag) ops view.
* P1: Margin ≥ 80% on Phase‑1 workloads; predictable spend caps for Buddy.
* P2: Self‑service exports (CSV/Parquet) + BI connectivity.

---

## 2) Personas & Primary Views

* **Founder/Exec** → *Exec Overview*: MRR/ARR, active users, analyses run, Buddy chat turns, COGS, gross margin %, runway projection.
* **Ops/Support** → *Ops Console*: per‑user/project costs, quotas, recent failures, refunds/credits, SLA breaches.
* **Finance** → *Revenue & Cohorts*: MRR buckets, net revenue retention, refund rate, cohort LTV/CAC, cash vs GAAP.
* **Product** → *Feature Value*: rewrite accept rate, cost‑pressure reduction, continuity fixes, pitch exports; free→paid conversion drivers.
* **Engineering** → *Model Telemetry*: token mix, cache hit‑rate, router decisions, latency SLOs, error types.

---

## 3) Information Architecture (In‑App v. BI)

* **In‑app (operational)**: low‑latency aggregates in **Postgres** (or DynamoDB) for the last 90 days.
* **Analytics (deep)**: append‑only events in **S3** (Parquet) → **Glue Catalog** → **Athena**/**QuickSight** (or ClickHouse/Metabase).
* **Streaming**: API/worker emits **NDJSON** to Kinesis Firehose → S3 (hourly partition). Fallback: direct S3 writes.

---

## 4) Event Taxonomy (what we log)

Every request carries a `correlation_id` to tie steps together. Fields marked *PII‑sensitive* are hashed or redacted.

### 4.1 Core Entities

* **org**(org\_id, plan, seats, sso\_enabled, created\_at)
* **user**(user\_id, org\_id, email\_hash\*, role, created\_at)
* **project**(project\_id, org\_id, title, privacy\_opt\_out\_training\:boolean, retention\_days\:int)
* **script\_version**(script\_id, project\_id, format, pages\:int, tokens\:int, created\_at)

### 4.2 Events (append‑only)

* `analysis.requested` (upload → parse → queue)
* `analysis.completed` (duration\_ms, success, reasons\[])
* `model.invocation` (provider, model, input\_tokens, cached\_input\_tokens, output\_tokens, **price\_micro** per million, **cost\_cents**, latency\_ms, error\_code, router\_decision, cache\_hit\:boolean)
* `rewrite.accepted` (note\_id, scene\_id, char\_ids\[], severity, pages\_changed)
* `continuity.issue_detected` / `continuity.fixed`
* `heatmap.score` (scene\_id, score\_0\_100, drivers\[])
* `buddy.chat_turn` (model, tokens\_in/out, feature\_tags\[])
* `billing.charge` (stripe\_invoice\_id, amount\_cents, tax\_cents, plan, period)
* `quota.decremented` (feature, units, before, after, overage\_applied\:boolean)
* `privacy.action` (retention\_set|purge\_executed|do\_not\_train\_opt\_out)
* `alert.fired` (rule\_id, severity, acknowledged\_by)

All events include: `ts`, `org_id`, `user_id`, `project_id`, `correlation_id`, `ip_hash*`, `ua`.

---

## 5) Cost Computation Rules

**Per invocation cost (cents)** =

```
( input_tokens/1e6  * price_in_micro  +
  cached_input_tokens/1e6 * price_in_cached_micro +
  output_tokens/1e6 * price_out_micro ) / 10_000
+ provider_surcharge_cents (if any)
```

* Maintain a **price book** table keyed by `{provider, model, date_range}` to allow rate changes over time.
* Router logs include `escalation_reason` so we can attribute cost deltas to quality vs failure.
* Attribute costs to **feature** via `feature_tags`: `analysis.summary`, `analysis.diagnostics`, `rewrite.cards`, `buddy.dialogue_alt`, etc.

**Derived KPIs**

* Cost per analysis (by length bucket), cost per Buddy turn, **CAC proxy** (ad spend + time vs conversion), **GM%** per tier.
* Cache hit‑rate = cached\_input\_tokens / (input\_tokens + cached\_input\_tokens).
* Cost per accepted rewrite = sum(cost of notes that produced accepted diffs) / count(accepted).
* Value index per project = weighted(accepted\_rewrites, continuity\_fixed, heatmap\_delta, pitch\_exports).

---

## 6) Data Model (Storage Schemas)

### 6.1 Postgres (operational aggregates)

* `agg_daily_org_cost(org_id, date, analysis_cost_cents, buddy_cost_cents, other_cogs_cents, revenue_cents, margin_pct)`
* `agg_daily_feature_cost(org_id, date, feature, invocations, tokens_in, tokens_out, cost_cents)`
* `agg_user_monthly(user_id, month, analyses, chat_turns, cost_cents, revenue_cents)`
* `quotas(org_id, plan, period_start, period_end, analyses_limit, chat_turns_limit, used_analyses, used_chat_turns)`
* `alerts(rule_id, org_id, status, fired_at, acknowledged_by)`

### 6.2 S3/Parquet (raw events)

Partitioned by `dt=YYYY-MM-DD/provider=model` to keep Athena scans cheap.

### 6.3 Price Book

`price_book(provider, model, start_date, end_date, price_in_micro, price_out_micro, price_cached_micro, notes)`

---

## 7) Dashboards (Layout & Widgets)

### 7.1 Exec Overview (default)

* **Top row KPIs:** MRR, Active Orgs/Users, Analyses Run, Buddy Turns, COGS, Gross Margin, Burn Multiple.
* **Charts:**

  * Revenue vs COGS (stacked area)
  * Cost by Model (bar, model family)
  * Unit Economics by Plan (scatter: ARPU vs Cost/User)
  * Value Index Trend (line)
* **Tables:** Top 20 Orgs by spend/margin; Anomalies flagged.

### 7.2 Model Spend & Telemetry

* Token breakdown (input/cached/output), cache hit‑rate heatmap by feature.
* Router decisions funnel (mini‑Sankey: mini→sonnet/gpt5 escalations).
* Latency SLO chart (P50/P95), error codes table.

### 7.3 Product Value

* Rewrite acceptance rate (overall & by severity), continuity fixes over time, production heatmap delta distribution.
* "Cost per accepted rewrite" trend.

### 7.4 Revenue & Cohorts

* New MRR, Expansion/Contraction, Churn; NRR; Cohort retention (month 1–6); ARPU/ARPA.

### 7.5 Ops Console

* Search org/user → timeline of costs, usage, quotas, alerts; one‑click credit/refund; export CSV.

---

## 8) Alerts & Budgets

* **Budget thresholds (per org & globally):** warn at 70%, alert at 90%, hard cap at 100% with graceful degradation (fallback to summaries/Haiku/mini, queue Buddy turns).
* **Anomaly rules:**

  * Cost spike > 2× 7‑day rolling average.
  * Cache hit‑rate drop > 20% day‑over‑day.
  * Error rate > 3% for any model 15‑min window.
  * Unit cost per analysis > plan‑target by 30%.
* **Delivery:** email + Slack/Webhook; in‑app banners; auto‑open Ops Console filter.

---

## 9) Privacy & Compliance

* Redact PII at event edge; hash emails/IPs.
* Respect **do‑not‑train** flag in all logs (no content bodies stored in telemetry; only token counts, IDs, spans, hashes).
* Retention policies (raw events 2 years; operational aggregates 13 months in Postgres; user‑visible usage indefinitely unless purged).

---

## 10) Implementation Plan (Sprints)

### Sprint A — Instrumentation & Price Book

* Middleware emits `model.invocation` with tokens & prices; correlation IDs; initial price book; unit tests.
* **Acceptance:** Costs within ±2% for synthetic test runs; events visible in S3 & Postgres aggregates.

### Sprint B — Aggregators & Ops Console (MVP)

* Nightly batch + 5‑min micro‑batch jobs to build `agg_daily_*`; barebones Ops Console page.
* **Acceptance:** Exec Overview shows real data; per‑org drilldown live.

### Sprint C — Alerts & Budgets

* Threshold engine + rules; in‑app banners; webhook integration.
* **Acceptance:** Simulated spikes trigger alerts; hard cap enforces fallbacks.

### Sprint D — Product Value & Cohorts

* Track rewrite accepts, continuity fixes, pitch exports; cohort tables & charts.
* **Acceptance:** Value metrics populate; upsell components can query per user/org.

### Sprint E — BI & Exports

* Athena/QuickSight (or Metabase) wired to S3; CSV export endpoints.
* **Acceptance:** Finance can self‑serve monthly close data; query templates saved.

---

## 11) API Contracts (selected)

* `POST /telemetry/model` → body: {correlation\_id, provider, model, input\_tokens, cached\_input\_tokens, output\_tokens, latency\_ms, feature\_tags\[], price\_version}
* `GET /dashboard/org/:id/summary?from&to`
* `POST /alerts/rules` → budget/threshold definitions
* `POST /quotas/apply` → decrements + overage flag

---

## 12) Sample SQL (Athena) Snippets

**Cost by model family (last 30 days)**

```sql
SELECT date(ts) d, model_family, sum(cost_cents)/100 AS cost_usd
FROM events
WHERE event_name='model.invocation' AND ts >= date_add('day', -30, current_date)
GROUP BY 1,2
ORDER BY 1;
```

**Unit cost per analysis length bucket**

```sql
WITH inv AS (
  SELECT correlation_id, sum(cost_cents) AS c
  FROM events
  WHERE event_name='model.invocation'
  GROUP BY 1
)
SELECT a.analysis_id, s.pages,
       CASE WHEN s.pages<=25 THEN 'short'
            WHEN s.pages<=70 THEN 'tv'
            WHEN s.pages<=130 THEN 'feature'
            ELSE 'long' END AS bucket,
       inv.c/100 AS cost_usd
FROM analyses a
JOIN script_versions s USING (script_id)
JOIN inv ON inv.correlation_id=a.correlation_id;
```

---

## 13) UI Specs (In‑App Dashboard)

* **Tech:** Next.js + Tailwind + shadcn/ui + Recharts.
* **Patterns:** KPI cards, stacked areas, bar charts, line charts; skeleton loaders; CSV export on tables.
* **Perf:** Queries capped to 90 days by default; lazy‑load older ranges.
* **Access Control:** Admin only; Finance role can see revenue; Support sees costs sans revenue.

---

## 14) Risks & Mitigations

* **Provider price changes** → price book with effective dates + backfill scripts.
* **Token mis‑reporting** → double‑entry: provider response + our estimate; alert on >10% delta.
* **PII leakage** → schema lints ban raw content in telemetry; redact at edge.
* **Athena cost creep** → strict partitioning + views; auto‑expire Glue partitions.

---

## 15) Definition of Done

* Exec, Ops, and Telemetry tabs live; budgets enforce; Finance exports monthly close file.
* Documented runbooks for spikes, invoice reconciliation, and backfills.
