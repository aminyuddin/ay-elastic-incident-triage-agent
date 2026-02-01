# AY Elastic Incident Triage Agent

A **multi-step AI agent** built with **Elastic Agent Builder** and **Elasticsearch** that automates production incident triage: it retrieves ERROR/WARN logs via ES|QL, groups them by incident ID, classifies severity and compliance risk, and creates or updates incident tickets through **MCP** (Model Context Protocol) so operators see them in a shared portal.

**For judges:** This folder contains everything needed to run and evaluate the agent: instructions, ES|QL tool definitions, demo flow, copy-paste prompts, and log-generation data. The agent uses **real Elasticsearch data** and **real MCP tools** (create/list/close/reopen incidents) backed by the same Firestore database as the [Incident Portal](../README.md) in this repo.

---

## What this demonstrates

| Aspect | What to look for |
|--------|------------------|
| **Tool-driven reasoning** | Agent uses ES|QL to fetch logs and MCP to manage incidents; decisions are grounded in retrieved data. |
| **Deterministic, auditable output** | Severity, compliance risk, and recommended actions are evidence-based and explainable. |
| **Human-in-the-loop** | Close/reopen require explicit user confirmation (CONFIRM) when evidence is insufficient. |
| **End-to-end integration** | Logs → analysis → incident creation/closure visible in the [portal](../README.md#quick-start) and MCP. |

---

## Quick links (for judges)

| Resource | Link | Purpose |
|----------|------|--------|
| **Demo flow** | [demo/DEMO_FLOW.md](demo/DEMO_FLOW.md) | Step-by-step: reset data → generate logs → ingest → verify → run agent → see CRITICAL classification. |
| **Demo prompts** | [demo/DEMO_PROMPT.md](demo/DEMO_PROMPT.md) | Exact text to paste in the agent chat (primary demo, ticket status, close/reopen with CONFIRM). |
| **Output style** | [demo/DEMO_FLOW_DESCRIPTION.md](demo/DEMO_FLOW_DESCRIPTION.md) | How the demo is presented (inspiration, 1990's VCR style, labels). |
| **Agent instructions** | [agent/agent_instructions.md](agent/agent_instructions.md) | Full system prompt for the agent (workflow, MCP usage, CONFIRM gate, severity/compliance rules). |
| **MCP tools** | [agent/mcp_tools.md](agent/mcp_tools.md) | Description of list_incidents, create_incident, close_incident, reopen_incident. |
| **ES|QL tools** | [agent/retrieve_recent_incident_logs.md](agent/retrieve_recent_incident_logs.md), [agent/summarize_incidents_by_id.md](agent/summarize_incidents_by_id.md) | Log retrieval and aggregation by incident.id. |
| **Generate logs** | [data/generate_latest_logs_multi_incident.py](data/generate_latest_logs_multi_incident.py) | Python script to create multi-incident NDJSON for Elasticsearch. |
| **Scripts** | [scripts/delete_data.sh](scripts/delete_data.sh), [scripts/ingest_logs.sh](scripts/ingest_logs.sh), [scripts/verify_count.sh](scripts/verify_count.sh) | Reset index, bulk ingest, verify document count. |
| **Devpost text** | [DEVPOST_DESCRIPTION.md](DEVPOST_DESCRIPTION.md) | Submission description (Inspiration, What it does, How we built it, etc.). |
| **Project setup** | [../README.md](../README.md) | Portal + MCP deployment; [../ELASTIC-AGENT-BUILDER.md](../ELASTIC-AGENT-BUILDER.md) for Kibana connector. |

---

## Key features

- **Multi-step agent** — Uses Elastic Agent Builder with ES|QL tools (log retrieval, aggregation by `incident.id`) and MCP tools (create, list, close, reopen incidents).
- **Evidence-based classification** — Severity (LOW → CRITICAL) and compliance risk derived from log volume, services, and event categories.
- **MCP-controlled lifecycle** — Incidents are created/closed/reopened via MCP; the [Incident Portal](../README.md) in this repo reads the same Firestore collection.
- **Human-in-the-loop** — Sensitive actions (close/reopen) require the user to type **CONFIRM** when evidence is incomplete.
- **Explainable output** — Structured fields (telemetry_freshness, severity, compliance_risk, evidence_summary, recommended_actions) for audit and compliance.

---

## Demo walkthrough

1. **Setup** — Deploy or run the [portal and MCP server](../README.md#option-a--deploy-portal--mcp-together-cloud-function) from the repo root. Configure the [Kibana MCP connector](../ELASTIC-AGENT-BUILDER.md) and add the four MCP tools to your agent.
2. **Data** — Generate demo logs with [data/generate_latest_logs_multi_incident.py](data/generate_latest_logs_multi_incident.py), then ingest using [demo/DEMO_FLOW.md](demo/DEMO_FLOW.md) (Step 3) or [scripts/ingest_logs.sh](scripts/ingest_logs.sh).
3. **Run** — Follow [demo/DEMO_FLOW.md](demo/DEMO_FLOW.md) and paste prompts from [demo/DEMO_PROMPT.md](demo/DEMO_PROMPT.md) into the agent chat.
4. **Observe** — Expect CRITICAL classification for INC-CRIT-1001, evidence summary, and incident creation in the portal.

Detailed steps and curl examples: [demo/DEMO_FLOW.md](demo/DEMO_FLOW.md). Ready-to-paste prompts: [demo/DEMO_PROMPT.md](demo/DEMO_PROMPT.md).

---

## Repository structure

| Path | Description |
|------|-------------|
| [agent/](agent/) | [agent_instructions.md](agent/agent_instructions.md) (system prompt), [mcp_tools.md](agent/mcp_tools.md), ES|QL definitions: [retrieve_recent_incident_logs](agent/retrieve_recent_incident_logs.md), [summarize_incidents_by_id](agent/summarize_incidents_by_id.md). |
| [data/](data/) | [generate_latest_logs_multi_incident.py](data/generate_latest_logs_multi_incident.py) — outputs `logs-production-app-multi-incident.ndjson`. |
| [demo/](demo/) | [DEMO_FLOW.md](demo/DEMO_FLOW.md), [DEMO_PROMPT.md](demo/DEMO_PROMPT.md), [DEMO_FLOW_DESCRIPTION.md](demo/DEMO_FLOW_DESCRIPTION.md). |
| [scripts/](scripts/) | [delete_data.sh](scripts/delete_data.sh), [ingest_logs.sh](scripts/ingest_logs.sh), [verify_count.sh](scripts/verify_count.sh). |
| [DEVPOST_DESCRIPTION.md](DEVPOST_DESCRIPTION.md) | Submission narrative. |
| [shortcut.example.sh](shortcut.example.sh) | Example curl commands (Elasticsearch + MCP, placeholders). |

---

## License

MIT — see [../LICENSE](../LICENSE).
