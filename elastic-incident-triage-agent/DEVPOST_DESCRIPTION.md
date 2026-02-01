# AY Elastic Incident Triage Agent

AY Elastic Incident Triage Agent is a production-grade AI operations and compliance
triage agent built using Elasticsearch Agent Builder and MCP.

The agent analyzes real production telemetry, classifies incident severity and
compliance risk, and safely manages the full incident lifecycle with explicit
human-in-the-loop authorization for sensitive actions.

---

## Inspiration

Modern production environments generate massive volumes of logs across many
services, making incident triage slow, manual, and inconsistent. Operations and
compliance teams need faster, safer ways to understand impact and decide on
escalation without introducing automation risk.

---

## What it does

The agent retrieves ERROR and WARN logs from Elasticsearch, aggregates them by
incident ID, assesses telemetry freshness, and determines severity, root cause,
and compliance risk based strictly on evidence. It integrates with MCP to create,
close, and reopen incidents while preventing duplicates.

Sensitive actions require explicit user confirmation via a CONFIRM gate.

---

## How we built it

We built the agent using Elastic Agent Builder with ES|QL-powered tools and MCP as
the authoritative control plane for incident state. The system enforces a
deterministic workflow to ensure auditability and explainability.

---

## Accomplishments

- Fully tool-driven agent grounded in Elasticsearch data
- MCP-controlled incident lifecycle management
- Human-in-the-loop safety for regulated environments

---

## What we learned

Tool-based reasoning enables safer, more trustworthy AI agents compared to
prompt-only approaches, especially for production operations.

---

## What's next

Future work includes integrating with enterprise ticketing systems,
adding anomaly detection, and exploring multi-agent verification workflows.
