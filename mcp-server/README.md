# Incident Portal MCP Server

MCP server that exposes the same tools as the Cloud Function: **create_incident**, **list_incidents**, **close_incident**, **reopen_incident**. Writes/reads the same Firebase Firestore `incidents` collection as the Vite portal. Use with **Elastic Agent Builder** (Kibana MCP connector).

## Contract

See [../mcp-api.md](../mcp-api.md) for the full tool contract.

| Tool | Description |
|------|-------------|
| **create_incident** | Create an incident in Firestore (same schema as the portal). |
| **list_incidents** | List incidents ordered by `created_at` DESC; optional filter by status (OPEN \| CLOSED). |
| **close_incident** | Close an incident by Firestore document `id` (from list_incidents). Sets status CLOSED, records closed_at. |
| **reopen_incident** | Reopen a closed incident by Firestore document `id`. Sets status OPEN, clears closed_at. |

## Auth (required)

The MCP endpoint is protected by header auth so only clients that know the secret can create or list tickets.

If `MCP_AUTH_SECRET` is not set, the server returns 503. If the header is missing or wrong, it returns 401.

---

## Where to get the header and how to config (mcp-server)

You use **one secret** in two places: in **mcp-server** (as `MCP_AUTH_SECRET` in `.env`) and in **Kibana** (as the header value). They must match.

### 1. Get the header value (the secret)

**You choose or generate a secret.** For example:

- Generate a random value (recommended):
  ```bash
  openssl rand -hex 32
  ```
- Or use any long, random string you keep private.

**Example:** `a1b2c3d4e5f6...` (64 hex chars). This is your **MCP_AUTH_SECRET**. Use the **exact same string** in step 2 (mcp-server) and step 3 (Kibana).

### 2. Config on the server (mcp-server)

Set the same secret in **mcp-server** via `.env`:

1. In the **mcp-server** folder: `cp .env.example .env`
2. Edit `.env` and set:
   ```bash
   MCP_AUTH_SECRET=a1b2c3d4e5f6...   # paste the secret you generated
   ```
3. Restart the server: `npm start`

If you deploy mcp-server to Cloud Run, Railway, etc., set **MCP_AUTH_SECRET** as an environment variable there (same value).

### 3. Config in Kibana (the header)

Tell Kibana to send that secret on every request:

1. In **Kibana**, go to **Stack Management** → **Connectors**.
2. Create or edit your **MCP** connector (Server URL = `http://localhost:3000/mcp` or your mcp-server URL).
3. Open **Additional settings** → **HTTP headers** and add **one** of:

   **Option A — Authorization (Bearer)**  
   - **Header name:** `Authorization`  
   - **Value:** `Bearer <paste-your-secret-here>` (one space after `Bearer`).  
   - **Type:** **Secret**.

   **Option B — X-API-Key**  
   - **Header name:** `X-API-Key`  
   - **Value:** `<paste-your-secret-here>` (raw secret).  
   - **Type:** **Secret**.

4. Save the connector. Use **Test** to confirm Kibana can reach the MCP server and list tools.

**Summary:** Generate a secret (e.g. `openssl rand -hex 32`), put it in **mcp-server/.env** as **MCP_AUTH_SECRET**, and set the same value in Kibana’s connector as **Authorization: Bearer &lt;secret&gt;** or **X-API-Key: &lt;secret&gt;**.

---

## Setup

1. **Firebase** — Use the same Firebase project as the Vite portal. Create a **service account** key:
   - Firebase Console → Project settings → Service accounts → Generate new private key.
   - Save the JSON file and set its path in `.env` (see below).

2. **Env** — Copy `.env.example` to `.env` and set:

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./path-to-your-service-account.json
   MCP_AUTH_SECRET=your-secret-here   # required; use same value in Kibana connector header
   ```

   Or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the stringified JSON (e.g. in production).

## Run locally

```bash
cd mcp-server
npm install
npm start
```

Server listens on `http://0.0.0.0:3000`. MCP endpoint: **http://localhost:3000/mcp**.

- **Kibana MCP connector Server URL:** `http://localhost:3000/mcp` (or `https://your-host/mcp` if behind TLS/ngrok).

## Deploy (for Kibana to reach it)

- Run on a host Kibana can reach (same network or public URL).
- Or expose local port with **ngrok**: `ngrok http 3000` → use the `https://...` URL as Server URL in Kibana, e.g. `https://xxxx.ngrok.io/mcp`.
- Or deploy to Cloud Run, Railway, etc.; set `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON` in the environment.

## Kibana configuration

1. **Stack Management → Connectors** → Create connector → **MCP**.
2. **Server URL:** `http://<host>:3000/mcp` (or your deployed/ngrok URL).
3. **HTTP headers:** Add **Authorization** = `Bearer <your-MCP_AUTH_SECRET>` or **X-API-Key** = `<your-MCP_AUTH_SECRET>` (use Secret type). Same value as in mcp-server `.env`.
4. In **Agent Builder → Tools** → New tool → **MCP** → select this connector → choose **create_incident**, **list_incidents**, **close_incident**, **reopen_incident** (or bulk import).

See [../ELASTIC-AGENT-BUILDER.md](../ELASTIC-AGENT-BUILDER.md) for full steps. Project license: [../LICENSE](../LICENSE) (MIT).
