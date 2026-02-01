# Configure Elastic Agent Builder for the Incident Portal

This guide explains how to connect **Elastic Agent Builder** to the incident portal so the agent can **create**, **list**, **close**, and **reopen** incidents (the MCP tools in [mcp-api.md](./mcp-api.md)).

## Architecture

```
Elastic Agent Builder (Kibana)
   │  ES|QL tools → analyze logs, decide escalation
   │  MCP tools   → create_incident, list_incidents, close_incident, reopen_incident (call remote MCP server)
   ▼
Incident MCP Server (your server)
   │  Implements mcp-api.md contract
   │  Writes/reads Firebase Firestore (same DB as the portal)
   ▼
Firestore `incidents` collection  ←  Incident Portal (Vite UI) reads/writes same data
```

**Important:** Agent Builder talks to an **MCP server** that exposes `create_incident`, `list_incidents`, `close_incident`, and `reopen_incident`. This repo includes that server in **[mcp-server/](./mcp-server/)** (and a Cloud Function in **functions/**). It uses the same Firestore project as the Vite portal (Firebase Admin SDK). Run it, then point the Kibana MCP connector at its URL (e.g. `http://localhost:3000/mcp` or your deployed/ngrok URL).

Below are the **Kibana / Agent Builder** steps once the MCP server is running.

---

## Step 1: Create an MCP connector in Kibana

1. In **Kibana**, go to **Stack Management** → **Connectors**.
2. Click **Create connector**.
3. Choose the **MCP** connector type.
4. Configure:
   - **Name:** e.g. `Incident Portal MCP`
   - **Server URL:** `http://localhost:3000/mcp` (local) or `https://your-host/mcp` (deployed/ngrok).  
     Run the MCP server from the repo: `cd mcp-server && npm install && npm start` (see [mcp-server/README.md](./mcp-server/README.md)).
5. **Additional settings → HTTP headers (required for auth):**  
   The MCP endpoint is protected by header auth. Add one of these headers (use **Secret** type so the value is stored securely):
   - **Header name:** `Authorization` · **Value:** `Bearer <your-MCP_AUTH_SECRET>`
   - Or **Header name:** `X-API-Key` · **Value:** `<your-MCP_AUTH_SECRET>`
   The same secret must be set as `MCP_AUTH_SECRET` on the MCP server (or in Firebase environment for the Cloud Function).
6. Click **Save**.
7. Use **Test** to verify Kibana can reach the MCP server and list tools.

**Reference:** [MCP connector and action (Kibana)](https://www.elastic.co/docs/reference/kibana/connectors-kibana/mcp-action-type)

---

## Step 2: Add MCP tools in Agent Builder

1. Go to **Agent Builder** → **Tools** (or your AI/Explore area where Tools live).
2. Either **add a single tool** or **bulk import**:
   - **Single:** Click **New tool** → choose **MCP** → select your **MCP Server** (connector) and the **Tool** (e.g. `create_incident`, `list_incidents`, `close_incident`, `reopen_incident`).
   - **Bulk:** Open **Manage MCP** → **Bulk import MCP tools** → select your **MCP Server** and the **Tools to import** (`create_incident`, `list_incidents`, `close_incident`, `reopen_incident`), optionally set a **Namespace** (e.g. `incidents`) → **Import tools**.
3. Confirm the new tools appear (e.g. `create_incident`, `list_incidents`, `close_incident`, `reopen_incident` or namespaced).

**Reference:** [Model Context Protocol (MCP) tools (Elastic)](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/mcp-tools)

---

## Step 3: Add tools to your agent

1. Open your **Agent** in Agent Builder (the one that will analyze logs and create incidents).
2. In the agent configuration, **add tools**:
   - **ES|QL tools** (or index search): for log analysis and deciding when to escalate.
   - **MCP tools**: add `create_incident`, `list_incidents`, `close_incident`, `reopen_incident` as needed.
3. In the agent’s **instructions / system prompt**, describe when to escalate, for example:
   - “When ES|QL or log analysis indicates a critical failure or escalation_required, use the create_incident tool with severity, title, description, affected_services, compliance_risk, and recommended_actions.”
4. Save the agent.

---

## Step 4: Flow in practice

1. User (or automation) asks the agent to analyze logs or a specific service.
2. The agent uses **ES|QL tools** (or search) to query Elasticsearch and determine if an incident should be opened.
3. When escalation is required, the agent calls the **create_incident** MCP tool with the payload (see [mcp-api.md](./mcp-api.md)).
4. The MCP server writes the incident to Firestore (`incidents` collection).
5. Operators open the **Incident Portal** (this Vite app), log in with admin/admin, and see the new incident in the list.

---

## Summary checklist

| Step | Where | What |
|------|--------|------|
| 1 | Kibana → Stack Management → Connectors | Create MCP connector; **Server URL** = your Incident MCP server URL. |
| 2 | Agent Builder → Tools | Add MCP tools from that connector: `create_incident`, `list_incidents`, `close_incident`, `reopen_incident`. |
| 3 | Agent Builder → Your agent | Add ES|QL (or search) + MCP tools; add instructions to call create_incident when escalation is needed. |
| 4 | — | Run your Incident MCP server so it writes/reads the **same** Firestore project the portal uses. |

---

## If you don’t have an MCP server yet

The contract the server must implement is in [mcp-api.md](./mcp-api.md). The server should:

- Expose tools: **create_incident**, **list_incidents**, **close_incident**, **reopen_incident** (contract in [mcp-api.md](./mcp-api.md)).
- Use the **same Firebase project** as the portal (same `projectId` and Firestore). Use **Firebase Admin SDK** on the server (service account), and the **Firebase Web SDK** in the portal (client config in `.env`).

You can implement the server in Node.js with `@modelcontextprotocol/sdk`, register the tools, and expose it over **Streamable HTTP** or **SSE** so Kibana’s MCP connector can use the **Server URL** to connect.
