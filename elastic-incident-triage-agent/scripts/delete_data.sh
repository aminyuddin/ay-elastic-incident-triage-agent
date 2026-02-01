#!/bin/bash
# Delete existing production logs (edit ELASTIC_URL and API_KEY for your cluster)
ELASTIC_URL="${ELASTIC_URL:-http://localhost:9200}"
# API_KEY="YOUR_API_KEY"  # Uncomment and set for Elastic Cloud / secured cluster

curl -X POST "${ELASTIC_URL}/logs-production-app/_delete_by_query" \
  -H "Content-Type: application/json" \
  ${API_KEY:+ -H "Authorization: ApiKey $API_KEY"} \
  -d '{"query":{"match_all":{}}}'
