# Incident Portal — Elastic Agent Builder Hackathon

> **Incident portal + MCP server for Elastic Agent Builder. AY Elastic Incident Triage Agent: ES|QL log analysis, create/list/close/reopen tickets. Vite, Firebase, Firestore.**

A lightweight **incident management portal** demo for the **Elasticsearch Agent Builder Hackathon**. An AI agent (e.g. Elastic Agent Builder with ES|QL) can **create, list, close, and reopen** incident tickets via an **MCP-style integration**; operators use a simple web UI to view and manage them.

**Stack:** Vite (frontend), Firebase Hosting, Firestore, demo login (`admin`/`admin`). MCP server runs as a **Cloud Function** (same URL as the portal) or a **standalone Node server**.

**Elastic agent:** The **[elastic-incident-triage-agent/](./elastic-incident-triage-agent/)** folder contains the **AY Elastic Incident Triage Agent** package — agent instructions, ES|QL tool definitions, demo flow, demo prompts, log-generation script, and Devpost materials. Use it with this portal and MCP server for the full demo. See [Elastic Incident Triage Agent](#elastic-incident-triage-agent) below.

---

## Demo guide

To run the full AY Elastic Incident Triage Agent demo (log analysis → severity/compliance → ticket create/close/reopen), follow these two guides in order:

| Guide | Link | What it covers |
|-------|------|----------------|
| **DEMO FLOW** | [elastic-incident-triage-agent/demo/DEMO_FLOW.md](./elastic-incident-triage-agent/demo/DEMO_FLOW.md) | Step-by-step: reset Elasticsearch data → generate production logs → ingest into Elasticsearch → verify count → run the agent in Kibana → review CRITICAL incident output. |
| **DEMO PROMPT** | [elastic-incident-triage-agent/demo/DEMO_PROMPT.md](./elastic-incident-triage-agent/demo/DEMO_PROMPT.md) | Ready-to-paste prompts for the agent: primary demo (log analysis + ticket creation), latest ticket status, close/reopen incident with CONFIRM, and optional follow-ups (deep dive, compliance, operations, executive summary). |

**Order:** Use [DEMO_FLOW.md](./elastic-incident-triage-agent/demo/DEMO_FLOW.md) for environment and data setup; use [DEMO_PROMPT.md](./elastic-incident-triage-agent/demo/DEMO_PROMPT.md) for the exact text to type in the agent chat. Open the portal to see incidents created or updated by the agent.

### Generate demo logs (multi-incident)

The demo uses production-like ERROR/WARN logs indexed in Elasticsearch (`logs-production-app`). Generate them with the script in **elastic-incident-triage-agent/data/**:

| What | Where |
|------|--------|
| **Script** | [elastic-incident-triage-agent/data/generate_latest_logs_multi_incident.py](./elastic-incident-triage-agent/data/generate_latest_logs_multi_incident.py) |
| **Output** | `logs-production-app-multi-incident.ndjson` (multi-incident, ERROR/WARN, burst + spread patterns) |

From the project root:

```bash
cd elastic-incident-triage-agent/data
python generate_latest_logs_multi_incident.py
```

This creates **logs-production-app-multi-incident.ndjson** with multiple incident IDs (e.g. INC-CRIT-1001, INC-HIGH-2001), ready for bulk ingest into Elasticsearch. Then use [DEMO_FLOW.md](./elastic-incident-triage-agent/demo/DEMO_FLOW.md) (Step 3) to ingest, or run [elastic-incident-triage-agent/scripts/ingest_logs.sh](./elastic-incident-triage-agent/scripts/ingest_logs.sh) (set `ELASTIC_URL` and `API_KEY` for your cluster).

---

## Quick start

| Goal | Action |
|------|--------|
| **Portal UI** | Deploy with Firebase (see [Option A](#option-a--deploy-portal--mcp-together-cloud-function)) or run `npm run dev`. Log in with **admin** / **admin**. |
| **MCP for Kibana** | Use **Option A** (one deploy: portal + MCP at `/mcp`) or **Option B** (run [mcp-server](./mcp-server/) separately). |

---

## Demo login (portal)

| Field | Value |
|-------|--------|
| **Username** | `admin` |
| **Password** | `admin` |

Login state is stored in the browser (localStorage). **Demo only** — no Firebase Auth or OAuth.

---

## Two ways to run the MCP server

The portal and the MCP server **share the same Firestore** `incidents` collection. For Elastic Agent Builder to manage incidents, point Kibana’s MCP connector at your MCP endpoint.

| | **Option A — Cloud Function** | **Option B — Standalone server** |
|---|-------------------------------|----------------------------------|
| **What** | MCP runs as a Firebase Cloud Function; Hosting serves the portal and rewrites `/mcp` to the function. | MCP runs as a Node.js server in `mcp-server/` (local or any host). |
| **URL** | Portal: `https://YOUR_PROJECT.web.app/` · MCP: `https://YOUR_PROJECT.web.app/mcp` | Portal: your Hosting URL · MCP: e.g. `http://localhost:3000/mcp` or your server URL. |
| **Deploy** | `firebase deploy` (Hosting + Functions + Firestore rules). | Build/deploy portal; run `cd mcp-server && npm start` (or deploy mcp-server elsewhere). |
| **When to use** | Easiest for hackathon: one repo, one deploy, one URL. Requires Blaze plan. | Local dev or when you want a separate MCP host. |
| **Kibana Server URL** | `https://YOUR_PROJECT.web.app/mcp` | `http://your-mcp-host:3000/mcp` (or https if behind TLS). |

**Both options expose the same tools:** `create_incident`, `list_incidents`, `close_incident`, `reopen_incident`. Contract: [mcp-api.md](./mcp-api.md).

---

## Option A — Deploy portal + MCP together (Cloud Function)

1. **Firebase:** Create a project; enable **Firestore**, **Hosting**, and **Cloud Functions** (Blaze plan). Add the Web app config to `.env` (see [Setup](#setup-firebase--portal)).
2. **MCP auth:** Set **MCP_AUTH_SECRET** for the Cloud Function (Google Cloud Console → Cloud Functions → **mcp** → Edit → Environment variables), e.g. `openssl rand -hex 32`. The MCP endpoint rejects requests without a matching header.
3. **Build and deploy:**
   ```bash
   npm run build
   cd functions && npm install && cd ..
   firebase deploy
   ```
4. **Portal:** Open `https://YOUR_PROJECT.web.app/` and log in with **admin** / **admin**.
5. **Kibana:** Stack Management → Connectors → create **MCP** connector with **Server URL** = `https://YOUR_PROJECT.web.app/mcp` and HTTP header `Authorization: Bearer <your-MCP_AUTH_SECRET>` (or `X-API-Key: <your-MCP_AUTH_SECRET>`). In Agent Builder → Tools, add **create_incident**, **list_incidents**, **close_incident**, **reopen_incident**. See [ELASTIC-AGENT-BUILDER.md](./ELASTIC-AGENT-BUILDER.md).

---

## Option B — Run the MCP server separately

1. **Portal:** Set up Firebase and the portal as in [Setup](#setup-firebase--portal). Deploy Hosting or run `npm run dev`.
2. **MCP server:**
   ```bash
   cd mcp-server
   cp .env.example .env
   # Set GOOGLE_APPLICATION_CREDENTIALS and MCP_AUTH_SECRET
   npm install && npm start
   ```
   MCP: `http://localhost:3000/mcp`. Clients must send `Authorization: Bearer <secret>` or `X-API-Key: <secret>`.
3. **Kibana:** Create an MCP connector with **Server URL** = `http://localhost:3000/mcp` (or your MCP URL) and the same auth header. Add the four tools. See [mcp-server/README.md](./mcp-server/README.md) and [ELASTIC-AGENT-BUILDER.md](./ELASTIC-AGENT-BUILDER.md).

---

## Setup (Firebase + portal)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. [Firebase Console](https://console.firebase.google.com/) → create or select a project.
2. Enable **Firestore** and **Hosting** (and **Cloud Functions** for Option A).
3. Project settings → General → Your apps → add a **Web app** and copy the config.

### 3. Configure the app

Create a `.env` in the project root (Vite uses `VITE_`-prefixed vars):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Deploy Firestore rules (optional)

```bash
firebase deploy --only firestore:rules
```

Requires `firebase` CLI and `firebase login`. New project: `firebase use --add` and select it.

---

## Local development

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Log in with **admin** / **admin**. Data is read/written in Firestore `incidents`.

---

## Architecture

```
Elastic Agent Builder (ES|QL + MCP tools)
   ↓  create_incident / list_incidents / close_incident / reopen_incident
MCP server (functions/ or mcp-server/)  →  Firestore `incidents`
Incident Portal (Vite)  →  same Firestore
   ↓
Operators view and manage tickets (admin/admin)
```

- **Portal:** Vite app; create/list/close/reopen incidents in the UI; contract in [mcp-api.md](./mcp-api.md).
- **MCP:** Same tools and Firestore; either Cloud Function ([functions/](./functions/)) or standalone server ([mcp-server/](./mcp-server/)).

---

## Elastic Incident Triage Agent

The **[elastic-incident-triage-agent/](./elastic-incident-triage-agent/)** folder is the **AY Elastic Incident Triage Agent** package: a multi-step AI agent that uses Elasticsearch (ES|QL) for log analysis and this project’s MCP server for incident lifecycle (create, list, close, reopen). It is designed to work with this repo — portal UI + MCP endpoint + Firestore — for a complete demo.

### What’s in the agent folder

| Item | Description |
|------|-------------|
| **[elastic-incident-triage-agent/README.md](./elastic-incident-triage-agent/README.md)** | Agent overview and key features. |
| **agent/** | Copy into Elastic Agent Builder: [agent_instructions.md](./elastic-incident-triage-agent/agent/agent_instructions.md) (system prompt), [mcp_tools.md](./elastic-incident-triage-agent/agent/mcp_tools.md) (MCP usage), and ES|QL tool definitions: [retrieve_recent_incident_logs](./elastic-incident-triage-agent/agent/retrieve_recent_incident_logs.md), [summarize_incidents_by_id](./elastic-incident-triage-agent/agent/summarize_incidents_by_id.md). |
| **demo/** | [DEMO_FLOW.md](./elastic-incident-triage-agent/demo/DEMO_FLOW.md) — step-by-step (reset → generate logs → ingest → verify → run agent). [DEMO_PROMPT.md](./elastic-incident-triage-agent/demo/DEMO_PROMPT.md) — ready-to-paste prompts for primary demo, ticket status, close/reopen with CONFIRM, and optional follow-ups. |
| **data/** | [generate_latest_logs_multi_incident.py](./elastic-incident-triage-agent/data/generate_latest_logs_multi_incident.py) — generates `logs-production-app-multi-incident.ndjson` (multi-incident ERROR/WARN logs for Elasticsearch). |
| **scripts/** | [delete_data.sh](./elastic-incident-triage-agent/scripts/delete_data.sh), [ingest_logs.sh](./elastic-incident-triage-agent/scripts/ingest_logs.sh), [verify_count.sh](./elastic-incident-triage-agent/scripts/verify_count.sh) — reset index, bulk ingest, verify count (set `ELASTIC_URL` / `API_KEY` for your cluster). |
| **[DEVPOST_DESCRIPTION.md](./elastic-incident-triage-agent/DEVPOST_DESCRIPTION.md)** | Devpost-style description (Inspiration, What it does, How we built it, etc.). |
| **[shortcut.example.sh](./elastic-incident-triage-agent/shortcut.example.sh)** | Example curl commands for Elasticsearch and MCP (placeholders only). |

### How to run the full demo

1. **Portal + MCP:** Deploy or run the portal and MCP server (Option A or B above). Ensure Kibana’s MCP connector points at your MCP URL and has the auth header. Add the four MCP tools in Agent Builder. See [ELASTIC-AGENT-BUILDER.md](./ELASTIC-AGENT-BUILDER.md).
2. **Agent in Kibana:** Create an agent in Elastic Agent Builder. Use the instructions and ES|QL tools from **elastic-incident-triage-agent/agent/**; add the MCP tools from the connector.
3. **Data:** From **elastic-incident-triage-agent/data/**, run the Python script to generate NDJSON. Ingest with **elastic-incident-triage-agent/scripts/ingest_logs.sh** (or equivalent) into your Elasticsearch `logs-production-app` index.
4. **Run:** Follow [elastic-incident-triage-agent/demo/DEMO_FLOW.md](./elastic-incident-triage-agent/demo/DEMO_FLOW.md) and use the prompts in [elastic-incident-triage-agent/demo/DEMO_PROMPT.md](./elastic-incident-triage-agent/demo/DEMO_PROMPT.md). Open the portal to see incidents created or updated by the agent.

---

## Project layout

| Path | Purpose |
|------|--------|
| `index.html` | Entry HTML |
| `src/main.js` | App: auth, incidents, UI |
| `src/firebase.js` | Firebase app + Firestore |
| `src/auth.js` | Demo login (admin/admin, localStorage) |
| `src/incidents.js` | Firestore: create, list, get, update, close, reopen |
| `src/styles.css` | Styles |
| `firestore.rules` | Firestore rules (open for demo) |
| `firebase.json` | Hosting + rewrites + Firestore config |
| `mcp-api.md` | MCP tool contract (create/list/close/reopen) |
| `mcp-server/` | Standalone MCP server |
| `functions/` | Cloud Function: MCP at `/mcp` |
| `elastic-incident-triage-agent/` | AY Elastic Incident Triage Agent (agent instructions, demo, data, scripts, Devpost) |
| `ELASTIC-AGENT-BUILDER.md` | Kibana MCP connector + Agent Builder setup |
| `FIREBASE-SETUP.md` | Firebase project setup details |

---

## Hackathon notes

- **Elastic Agent Builder** can analyze logs (e.g. with ES|QL), decide escalation is needed, and call **create_incident** (and list/close/reopen) via the MCP server, which writes to the same Firestore `incidents` collection. Operators see and manage tickets in the portal.
- **Demo auth** keeps the hackathon setup simple (no OAuth); operators use admin/admin.
- The **MCP tools** follow the contract in `mcp-api.md` and are implemented as Firestore reads/writes, callable by an AI agent after analysis.

---

## License

MIT — see [LICENSE](./LICENSE).
