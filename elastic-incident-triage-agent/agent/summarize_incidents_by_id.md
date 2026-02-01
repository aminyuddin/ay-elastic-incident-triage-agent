Tool ID: summarize_incidents_by_id
Type: ES|QL

Query:
FROM logs-production-app*
| WHERE log.level IN ("ERROR", "WARN")
| STATS
    error_count = COUNT(*) WHERE log.level == "ERROR",
    warn_count  = COUNT(*) WHERE log.level == "WARN",
    services    = COUNT_DISTINCT(service.name),
    service_list = VALUES(service.name),
    categories  = VALUES(event.category),
    first_seen  = MIN(@timestamp),
    last_seen   = MAX(@timestamp)
BY incident.id
| SORT error_count DESC


Description:
Aggregates ERROR and WARN production logs by incident ID to produce
incident-level evidence, including error volume, affected services,
event categories, and time range for downstream severity and compliance analysis.

Labels:
incident
aggregation
analysis
