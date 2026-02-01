#!/bin/bash
# Ingest NDJSON logs (run from elastic-incident-triage-agent/data after generating, or set NDJSON path)
# ELASTIC_URL="${ELASTIC_URL:-http://localhost:9200}"
# API_KEY="YOUR_API_KEY"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$(dirname "$SCRIPT_DIR")/data"
NDJSON="${NDJSON:-$DATA_DIR/logs-production-app-multi-incident.ndjson}"

if [ ! -f "$NDJSON" ]; then
  echo "Generate logs first: cd elastic-incident-triage-agent/data && python generate_latest_logs_multi_incident.py"
  exit 1
fi

ELASTIC_URL="${ELASTIC_URL:-http://localhost:9200}"
curl -X POST "${ELASTIC_URL}/_bulk" \
  -H "Content-Type: application/x-ndjson" \
  ${API_KEY:+ -H "Authorization: ApiKey $API_KEY"} \
  --data-binary @"$NDJSON"
