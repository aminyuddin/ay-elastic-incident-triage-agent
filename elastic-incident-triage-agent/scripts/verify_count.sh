#!/bin/bash
# Verify document count in logs-production-app
ELASTIC_URL="${ELASTIC_URL:-http://localhost:9200}"
# API_KEY="YOUR_API_KEY"

curl -s -X GET "${ELASTIC_URL}/logs-production-app/_count" \
  ${API_KEY:+ -H "Authorization: ApiKey $API_KEY"}
