# Example curl commands for Elasticsearch and MCP (replace placeholders).
# Copy to shortcut.sh and set ELASTIC_URL, API_KEY, MCP_URL, MCP_AUTH_SECRET.

# Delete all docs in logs-production-app
# curl -X POST "https://YOUR_CLUSTER.es.REGION.aws.elastic.cloud:443/logs-production-app/_delete_by_query" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: ApiKey YOUR_API_KEY" \
#   -d '{"query":{"match_all":{}}}'

# Get document count
# curl -X GET "https://YOUR_CLUSTER.es.REGION.aws.elastic.cloud:443/logs-production-app/_count" \
#   -H "Authorization: ApiKey YOUR_API_KEY"

# Bulk ingest (run from elastic-incident-triage-agent/data after generating NDJSON)
# curl -X POST "https://YOUR_CLUSTER.es.REGION.aws.elastic.cloud:443/_bulk?pretty" \
#   -H "Authorization: ApiKey YOUR_API_KEY" \
#   -H "Content-Type: application/x-ndjson" \
#   --data-binary @logs-production-app-multi-incident.ndjson

# Call MCP list_incidents (replace MCP URL and auth)
# curl -X POST "https://YOUR_PROJECT.web.app/mcp" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_MCP_AUTH_SECRET" \
#   -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_incidents","arguments":{}}}'
