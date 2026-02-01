# Incident Portal — Cloud Function (MCP endpoint)

This folder is a **Firebase Cloud Function** that exposes the same MCP tools as [../mcp-server/](../mcp-server/): **create_incident**, **list_incidents**, **close_incident**, **reopen_incident**. It reads and writes the same Firestore `incidents` collection as the Vite portal.

**Use this when you want one URL and one deploy:** the portal and the MCP endpoint live on the same Firebase Hosting domain (portal at `/`, MCP at `/mcp`). You do **not** run this folder directly; you deploy it with `firebase deploy` from the repo root.

---

## What this does

| Item | Description |
|------|-------------|
| **Function name** | `mcp` (HTTP trigger) |
| **Tools** | `create_incident`, `list_incidents`, `close_incident`, `reopen_incident` — same contract as [../mcp-api.md](../mcp-api.md) |
| **Data** | Firestore `incidents` collection (same as the portal) |
| **Mode** | Stateless (each request is independent; no session store) |

After deployment, Firebase Hosting rewrites requests to `https://YOUR_PROJECT.web.app/mcp` to this function. Kibana’s MCP connector **Server URL** should be that URL.

| Tool | Description |
|------|-------------|
| **create_incident** | Create an incident in Firestore (same schema as the portal). |
| **list_incidents** | List incidents by `created_at` DESC; optional filter by status (OPEN \| CLOSED). |
| **close_incident** | Close an incident by Firestore document `id` (from list_incidents). Sets status CLOSED, records closed_at. |
| **reopen_incident** | Reopen a closed incident by Firestore document `id`. Sets status OPEN, clears closed_at. |

**Auth:** The MCP endpoint is protected by header auth. You must set **MCP_AUTH_SECRET** (see below) and send it from Kibana in an HTTP header so only your agent can call the tools.

---

## How /mcp works (where is the config)

**Request flow**

1. Client (e.g. Kibana) calls `https://YOUR_PROJECT.web.app/mcp` (POST/GET/DELETE).
2. **Firebase Hosting** receives the request. The **rewrite** in `firebase.json` (project root) says: if path is `/mcp`, forward to the Cloud Function named `mcp`.
3. The **Cloud Function** `mcp` (defined in `functions/index.js`) runs. It is an HTTP function that uses the Express app in `functions/mcpApp.js`.
4. The Express app checks **auth** (header must match `MCP_AUTH_SECRET`), then handles the MCP protocol (list tools, call tools) and talks to Firestore via `functions/firestore.js`.

**Where the config is**

| What | Where |
|------|--------|
| **URL path** `/mcp` and **which function** | **`firebase.json`** (project root) → `hosting.rewrites`: `source: "/mcp"`, `function.functionId: "mcp"`, `function.region: "us-central1"`. |
| **Function entry** (name `mcp`, region, timeout) | **`functions/index.js`** → `export const mcp = onRequest({ region: 'us-central1', ... }, app)`. |
| **MCP logic** (tools, auth middleware, Express routes) | **`functions/mcpApp.js`** → routes for `/` and `/mcp` (Hosting can send either path to the function). |
| **Auth secret** (so only your agent can call) | **Environment variable** `MCP_AUTH_SECRET` for the Cloud Function — set in Google Cloud Console → Cloud Functions → **mcp** → Edit → Environment variables. |
| **Firestore** (same DB as portal) | **`functions/firestore.js`** — uses Firebase Admin default credentials in Cloud Functions (no extra config). |

To change the **path** from `/mcp` to something else (e.g. `/api/mcp`): change `source` in `firebase.json` and the Kibana connector **Server URL** to match.

---

## MCP auth (required)

The endpoint rejects requests without a valid auth header so the public cannot create or view tickets.

---

## Where to get the header and how to config

You use **one secret** in two places: on the **server** (as `MCP_AUTH_SECRET`) and in **Kibana** (as the header value). They must match.

### 1. Get the header value (the secret)

**You choose or generate a secret.** For example:

- Generate a random value (recommended):
  ```bash
  openssl rand -hex 32
  ```
- Or use any long, random string you keep private (e.g. a password manager).

**Example:** `a1b2c3d4e5f6...` (64 hex chars). This is your **MCP_AUTH_SECRET**. You will use the **exact same string** in step 2 (server) and step 3 (Kibana).

### 2. Config on the server (Cloud Function)

Set the same secret as an **environment variable** so the function can check incoming headers.

**Option A — Google Cloud Console (recommended)**

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your Firebase project.
2. Go to **Cloud Functions** (or **More products** → **Serverless** → **Cloud Functions**).
3. Click the **mcp** function.
4. Click **Edit** (top).
5. Expand **Runtime, build, connections and security**.
6. Under **Environment variables**, click **Add variable**:
   - **Name:** `MCP_AUTH_SECRET`
   - **Value:** the secret you generated (e.g. the output of `openssl rand -hex 32`).
7. Click **Deploy** (or **Next** until **Deploy**). Wait for the new revision to be live.

**Option B — gcloud CLI**

After deploying the function once (`firebase deploy --only functions`), set the variable and create a new revision:

```bash
# Replace YOUR_PROJECT and YOUR_SECRET; region must match (e.g. us-central1)
gcloud run services update mcp \
  --region=us-central1 \
  --set-env-vars="MCP_AUTH_SECRET=YOUR_SECRET" \
  --project=YOUR_PROJECT
```

(If the service name differs, list with `gcloud run services list --project=YOUR_PROJECT` and use the name that corresponds to the `mcp` function.)

**Then:** Use the **exact same secret** in your MCP connector (Kibana / Agent Builder) as the API key or Bearer token.

If you deploy from the CLI instead, you can set it before deploy (e.g. in a `.env` file used by the emulator; for production, set it in the Console as above).

### 3. Config in Kibana (the header)

Tell Kibana to send that secret on every request to the MCP endpoint:

1. In **Kibana**, go to **Stack Management** → **Connectors**.
2. Create or edit your **MCP** connector (the one whose Server URL is `https://YOUR_PROJECT.web.app/mcp`).
3. Open **Additional settings** and find **HTTP headers**.
4. Add a header — **one** of these two:

   **Option A — Authorization (Bearer)**  
   - **Header name:** `Authorization`  
   - **Value:** `Bearer <paste-your-secret-here>`  
   - Example: `Bearer a1b2c3d4e5f6...` (one space after `Bearer`, then the exact secret).  
   - **Type:** **Secret** (so Kibana stores it securely).

   **Option B — X-API-Key**  
   - **Header name:** `X-API-Key`  
   - **Value:** `<paste-your-secret-here>` (the raw secret, no `Bearer`).  
   - **Type:** **Secret**.

5. Save the connector. Use **Test** to confirm Kibana can reach the MCP server and list tools.

**Summary:** The **header** is either `Authorization: Bearer <secret>` or `X-API-Key: <secret>`. You get the value by generating a secret (e.g. `openssl rand -hex 32`), set it as **MCP_AUTH_SECRET** on the Cloud Function, and set the same value in Kibana’s connector HTTP headers. If they match, requests are allowed; otherwise the function returns 401. If **MCP_AUTH_SECRET** is not set (or empty), the function returns **503**.

**If you can call without setting the secret:** (1) Check which **connector URL** Kibana uses — if it points to **mcp-server** (e.g. `http://localhost:3000/mcp`) instead of the Cloud Function (`https://YOUR_PROJECT.web.app/mcp`), auth is enforced by mcp-server and its `.env`. (2) After adding **MCP_AUTH_SECRET** in Google Cloud Console, **redeploy** so the function picks it up: `firebase deploy --only functions`.

---

## Why use this instead of mcp-server?

| | **functions/** (this folder) | **mcp-server/** |
|---|------------------------------|------------------|
| **Runs as** | Firebase Cloud Function (serverless) | Standalone Node.js server |
| **Deploy** | `firebase deploy` from repo root (with Hosting) | Run `npm start` or deploy to Cloud Run / any host |
| **URL** | Same as portal: `https://YOUR_PROJECT.web.app/mcp` | Separate URL (e.g. `http://localhost:3000/mcp`) |
| **Config** | No `.env` in production; uses Firebase default credentials | Needs `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON` |
| **When to use** | Hackathon demo: one repo, one deploy, one URL to share | Local dev or when you need stateful MCP sessions |

Use **functions/** for the simplest hackathon setup. Use **mcp-server/** when you run the MCP server separately (local or another host).

---

## Build and run (from repo root)

You do **not** run anything inside `functions/` by hand. All commands below are from the **project root**.

**Two installs:** run `npm install` in the **root** (portal) and `npm install` in **functions/** (this folder). Each has its own `package.json`.

1. **Root:** `npm install` — portal deps (Vite, Firebase Web SDK).
2. **Functions:** `cd functions && npm install && cd ..` — function deps (firebase-functions, express, MCP SDK, firebase-admin); required so `firebase deploy` can bundle the function.
3. **Build portal:** `npm run build` — outputs to `dist/`.
4. **Deploy:** `firebase deploy` — Hosting + this function + Firestore rules.
5. **Portal:** `https://YOUR_PROJECT.web.app/` · **MCP (Kibana Server URL):** `https://YOUR_PROJECT.web.app/mcp`

To deploy only the MCP function: `firebase deploy --only functions`. To deploy only Hosting: `firebase deploy --only hosting`.

---

## Prerequisites

- **Firebase project** with **Firestore** and **Hosting** (and **Cloud Functions** enabled).
- **Blaze (pay-as-you-go) plan** — required for Cloud Functions.
- **Firebase CLI** logged in and project selected: `firebase use <project-id>`.

---

## Kibana configuration

1. **Stack Management → Connectors** → Create connector → **MCP**.
2. **Server URL:** `https://YOUR_PROJECT.web.app/mcp` (replace with your Hosting URL).
3. **HTTP headers:** Add **Authorization** = `Bearer <your-MCP_AUTH_SECRET>` (or **X-API-Key** = `<your-MCP_AUTH_SECRET>`). Use **Secret** type for the value.
4. **Agent Builder → Tools** → Add MCP tools from this connector: **create_incident**, **list_incidents**, **close_incident**, **reopen_incident**.

See [../ELASTIC-AGENT-BUILDER.md](../ELASTIC-AGENT-BUILDER.md) for full steps. Project license: [../LICENSE](../LICENSE) (MIT).

---

## Folder layout

| File | Purpose |
|------|---------|
| `index.js` | Exports the `mcp` HTTP function (wires Express app to Cloud Functions). |
| `mcpApp.js` | Express app: stateless MCP server with create_incident, list_incidents, close_incident, reopen_incident. |
| `firestore.js` | Firestore helpers (create, list, close, reopen incidents); uses default credentials in Cloud Functions. |
| `package.json` | Dependencies: firebase-functions, express, @modelcontextprotocol/sdk, firebase-admin, zod. |
