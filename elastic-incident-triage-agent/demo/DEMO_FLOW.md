# AY Elastic Incident Triage Agent – Demo Flow

This demo demonstrates how the AY Elastic Incident Triage Agent performs
automated incident and compliance triage using Elastic Agent Builder and
Elasticsearch (ES|QL).

---

## Step 1: Reset Environment (Clean Slate)

Delete existing production logs to ensure a deterministic demo.

```bash
curl -X POST "http://localhost:9200/logs-production-app/_delete_by_query" \
  -H "Content-Type: application/json" \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -d '{"query":{"match_all":{}}}'
```

Or use the script (edit for your Elasticsearch URL and API key):

```bash
./scripts/delete_data.sh
```

---

## Step 2: Generate Production Logs

Generate realistic multi-incident production logs with:
- Multiple incident IDs
- ERROR and WARN severity mix
- Burst and outage patterns

From the **elastic-incident-triage-agent/data** folder:

```bash
cd elastic-incident-triage-agent/data
python generate_latest_logs_multi_incident.py
```

This produces:

```
logs-production-app-multi-incident.ndjson
```

---

## Step 3: Ingest Logs into Elasticsearch

```bash
curl -X POST "http://localhost:9200/_bulk" \
  -H "Content-Type: application/x-ndjson" \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  --data-binary @logs-production-app-multi-incident.ndjson
```

Or use the script (edit for your URL and key):

```bash
./scripts/ingest_logs.sh
```

---

## Step 4: Verify Ingestion

Confirm documents are indexed.

```bash
curl -X GET "http://localhost:9200/logs-production-app/_count" \
  -H "Authorization: ApiKey YOUR_API_KEY"
```

Or:

```bash
./scripts/verify_count.sh
```

Expected result:

```
count >= 1000
```

---

## Step 5: Run the Agent (Core Demo)

Open Kibana and navigate to:

Agents -> AY Elastic Incident Triage Agent

Paste the demo prompt from:

```
elastic-incident-triage-agent/demo/DEMO_PROMPT.md
```

Click Run.

The agent will:
- Retrieve logs using ES|QL tools
- Group logs by incident.id
- Classify severity and compliance risk
- Generate evidence-backed remediation actions
- Create or reference incidents via MCP when appropriate

**MCP:** Ensure your MCP connector points at this project’s MCP endpoint (Cloud Function or mcp-server). See the main [../../README.md](../../README.md) and [../../ELASTIC-AGENT-BUILDER.md](../../ELASTIC-AGENT-BUILDER.md).

---

## Step 6: Review Output

Expected demo result:
- Incident INC-CRIT-1001 classified as CRITICAL
- Compliance risk flagged as HIGH
- Escalation required
- Clear, explainable evidence summary

---

## Demo Objective

This flow demonstrates:
- Real Elasticsearch data usage
- Deterministic, auditable AI reasoning
- Native integration with Elastic Agent Builder
- Safe incident lifecycle management using MCP
