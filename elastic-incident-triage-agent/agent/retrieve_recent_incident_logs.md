Tool ID: retrieve_recent_incident_logs
Type: ES|QL

Query:
FROM logs-production*
| WHERE @timestamp >= NOW() - 30 MINUTES
| WHERE log.level IN ("ERROR", "WARN")
| KEEP @timestamp, service.name, log.level, message, incident.id, event.category
| SORT @timestamp DESC
| LIMIT 1000


Description:
Retrieves recent ERROR and WARN production logs from Elasticsearch data streams.
Returns structured log evidence including timestamp, service, severity level,
incident correlation ID, and event category for downstream incident analysis.

Labels:
incident
observability
logs
