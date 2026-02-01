# MCP-style API Contract — Incident Portal

This document describes the **MCP-style interface** used by an AI agent (e.g. Elastic Agent Builder) to create and list incident tickets. The portal does **not** expose real HTTP endpoints; these operations are implemented via **Firebase Firestore** from the frontend. This contract defines the **tool semantics** so that an agent can be instructed to "create an incident" or "list incidents" and map that to the correct Firestore reads/writes.

**Conceptual flow:**
- Elastic Agent Builder analyzes logs (e.g. with ES|QL), determines that escalation is required, then invokes the **Create Incident** "tool."
- The tool is implemented as a Firestore write from the incident portal (or from an MCP server that writes to the same Firestore).
- Human operators use the portal to view and manage incidents.

---

## 1. Create Incident (MCP Tool)

**Logical operation:** `POST /incidents`

Creates a new incident document in the `incidents` Firestore collection.

### Request (conceptual)

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | string | e.g. `INC-CRIT-1001` |
| `severity` | enum | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `title` | string | Short title |
| `description` | string | Description of the incident |
| `affected_services` | string[] | List of affected service names |
| `compliance_risk` | enum | `NONE` \| `LOW` \| `MEDIUM` \| `HIGH` |
| `recommended_actions` | string[] | Actions the agent recommends |

### Request body example

```json
{
  "incident_id": "INC-CRIT-1001",
  "severity": "CRITICAL",
  "title": "Production payment failures",
  "description": "Cascading failures across payments and auth services",
  "affected_services": ["payments-api", "auth-service"],
  "compliance_risk": "HIGH",
  "recommended_actions": [
    "Isolate auth-service",
    "Suspend payments-api",
    "Notify compliance team"
  ]
}
```

### Behavior

- Writes an incident document to Firestore collection `incidents`.
- Sets `created_by` to the logged-in demo user (e.g. `"admin"`).
- Sets `status` to `OPEN`, `created_at` to server timestamp.
- Returns the created incident object (with `id` and `created_at`).

### Implementation note

In this demo, the **Create Incident** tool is implemented in the portal as `createIncident(payload, createdBy)` in `src/incidents.js`, which calls `addDoc(collection(db, 'incidents'), doc)`. An MCP server or Elastic Agent Builder integration would perform the same Firestore write (or call the same contract) to create incidents from agent actions.

---

## 2. List Incidents (MCP Tool)

**Logical operation:** `GET /incidents`

Reads incident documents from the `incidents` Firestore collection.

### Behavior

- Reads all documents from the `incidents` collection.
- Orders by `created_at` **descending** (newest first).
- Only meaningful when the client (portal or agent) is considered "logged in" / authorized; in the demo, the UI only lists when the user has passed demo login.

### Response (conceptual)

Array of incident objects, each containing:

- `id` (Firestore document ID)
- `incident_id`, `severity`, `title`, `description`, `affected_services`, `compliance_risk`, `recommended_actions`, `status`, `created_by`, `created_at`

### Implementation note

In this demo, **List Incidents** is implemented as `listIncidents()` in `src/incidents.js`, which runs `getDocs(query(collection(db, 'incidents'), orderBy('created_at', 'desc')))`. An MCP server could expose this as a "list_incidents" tool that returns the same structure. Optional filter by `status` (OPEN or CLOSED).

---

## 3. Close Incident (MCP Tool)

**Logical operation:** Close an incident by Firestore document id.

### Request (conceptual)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firestore document id of the incident (from list_incidents) |

### Behavior

- Updates the incident document: sets `status` to `CLOSED`, `closed_at` to server timestamp.
- Use the document `id` returned by **List Incidents** (not the human-readable `incident_id`).

### Implementation note

Implemented as `closeIncident(id)` in Firestore; MCP tools `close_incident` (Cloud Function and standalone server) call it.

---

## 4. Reopen Incident (MCP Tool)

**Logical operation:** Reopen a closed incident by Firestore document id.

### Request (conceptual)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firestore document id of the incident (from list_incidents) |

### Behavior

- Updates the incident document: sets `status` to `OPEN`, removes `closed_at`.
- Use the document `id` returned by **List Incidents**.

### Implementation note

Implemented as `reopenIncident(id)` in Firestore; MCP tools `reopen_incident` (Cloud Function and standalone server) call it.

---

## Summary

| Tool | Logical endpoint | Implementation |
|------|------------------|----------------|
| Create Incident | POST /incidents | Firestore `addDoc` to `incidents` |
| List Incidents | GET /incidents | Firestore `getDocs` + `orderBy('created_at', 'desc')`, optional status filter |
| Close Incident | PATCH /incidents/:id (close) | Firestore `updateDoc`: status CLOSED, closed_at |
| Reopen Incident | PATCH /incidents/:id (reopen) | Firestore `updateDoc`: status OPEN, clear closed_at |

These endpoints represent **MCP tools**: the AI agent (Elastic Agent Builder) would call them after analysis (e.g. ES|QL-driven escalation). **Firebase Firestore** is the persistence layer; no separate backend server is used in this demo.
