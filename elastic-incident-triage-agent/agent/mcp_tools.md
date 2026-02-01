# MCP Tools – AY Elastic Incident Triage Agent

This document describes the Model Context Protocol (MCP) tools used by
AY Elastic Incident Triage Agent.

MCP acts as the authoritative control plane for all incident state.
The agent never relies on UI ordering or implicit assumptions when managing incidents.

---

## Design Principles

- MCP is the single source of truth for incident state
- All create, close, and reopen actions must go through MCP
- Incident state changes are auditable and deterministic
- Sensitive actions require explicit human authorization (CONFIRM gate)

---

## Available MCP Tools

### list_incidents

Lists incident records from the incident store.

Used to:
- Retrieve existing incidents
- Determine the latest incident using created_at
- Check incident status (OPEN / CLOSED)
- Prevent duplicate incidents

Parameters:
- status (optional): OPEN or CLOSED

Behavior:
- Returns incidents ordered by creation time (newest first)
- The agent MUST still compute the latest incident using created_at
- UI or response order must not be assumed as authoritative

---

### create_incident

Creates a new incident record.

Used only when:
- Severity is HIGH or CRITICAL
- Telemetry freshness is FRESH
- No matching incident already exists

Parameters:
- incident_id (string, required)
- severity (LOW | MEDIUM | HIGH | CRITICAL)
- title (string)
- description (optional)
- affected_services (optional)
- compliance_risk (NONE | LOW | MEDIUM | HIGH)
- recommended_actions (optional)

Behavior:
- Creates a new incident with status OPEN
- Sets created_at timestamp
- Returns the created incident record

---

### close_incident

Closes an existing incident.

This is a privileged operation.

Parameters:
- id (string, required)

Behavior:
- Sets incident status to CLOSED
- Sets closed_at timestamp
- Preserves original created_at
- Records closure in audit trail

Safety Rules:
- Must not be executed while ERROR logs persist
- If evidence is insufficient, user must type CONFIRM
- Agent must disclose when closure is user-authorized

---

### reopen_incident

Reopens a previously closed incident.

This is a privileged operation.

Parameters:
- id (string, required)

Behavior:
- Sets incident status to OPEN
- Clears closed_at timestamp
- Preserves original created_at
- Appends reopen event to audit trail

Safety Rules:
- Used only when new telemetry exists or user authorizes
- If no supporting telemetry exists, user must type CONFIRM

---

## Human Authorization (CONFIRM Gate)

For sensitive actions where evidence is incomplete, the agent pauses and
requires the user to type the exact keyword:

CONFIRM

Rules:
- The keyword must match exactly
- Natural language confirmation is not sufficient
- Actions taken after confirmation must be labeled as user-authorized

---

## Audit and Compliance Notes

- All MCP actions are deterministic and traceable
- Incident state transitions are explicit and reversible
- Human overrides are clearly distinguished from automated decisions
- Designed for regulated environments such as banking and fintech

---

## Summary

MCP enables AY Elastic Incident Triage Agent to safely move beyond analysis
and perform real operational actions while preserving human authority,
auditability, and compliance.
