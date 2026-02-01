import json
import random
from datetime import datetime, timedelta, UTC

OUTPUT_FILE = "logs-production-app-multi-incident.ndjson"
INDEX_NAME = "logs-production-app"

INCIDENTS = [
    {
        "id": "INC-CRIT-1001",
        "severity": "CRITICAL",
        "services": [
            ("payments-api", "transaction"),
            ("auth-service", "security"),
            ("core-banking", "performance"),
            ("notification-service", "application"),
        ],
        "log_levels": ["ERROR"],
        "burst": True,
        "count": 500,
    },
    {
        "id": "INC-HIGH-2001",
        "severity": "HIGH",
        "services": [
            ("payments-api", "transaction"),
        ],
        "log_levels": ["ERROR"],
        "burst": False,
        "count": 250,
    },
    {
        "id": "INC-MED-3001",
        "severity": "MEDIUM",
        "services": [
            ("core-banking", "performance"),
        ],
        "log_levels": ["WARN", "ERROR"],
        "burst": False,
        "count": 150,
    },
    {
        "id": "INC-LOW-4001",
        "severity": "LOW",
        "services": [
            ("notification-service", "application"),
        ],
        "log_levels": ["WARN"],
        "burst": False,
        "count": 100,
    },
]

MESSAGES = {
    "transaction": [
        "Transaction timeout while processing payment request",
        "Failed to commit transaction",
    ],
    "security": [
        "Detected potential PII exposure in authentication request payload",
    ],
    "performance": [
        "Service response time exceeded SLA threshold",
    ],
    "application": [
        "Failed to publish event to message broker",
    ],
}

def iso_recent(seconds_ago):
    return (datetime.now(UTC) - timedelta(seconds=seconds_ago)).isoformat()


with open(OUTPUT_FILE, "w") as f:
    for incident in INCIDENTS:
        base_offset = random.randint(60, 900)

        for i in range(incident["count"]):
            service, category = random.choice(incident["services"])
            level = random.choice(incident["log_levels"])
            message = random.choice(MESSAGES[category])

            # Burst simulation
            if incident["burst"]:
                seconds_ago = base_offset - i
            else:
                seconds_ago = base_offset + random.randint(0, 600)

            action = {
                "create": {
                    "_index": INDEX_NAME
                }
            }

            document = {
                "@timestamp": iso_recent(max(seconds_ago, 0)),
                "service": {"name": service},
                "log": {"level": level},
                "message": message,
                "event": {"category": category},
                "incident": {"id": incident["id"]}
            }

            f.write(json.dumps(action) + "\n")
            f.write(json.dumps(document) + "\n")

print(f"✅ Generated multi-incident logs → {OUTPUT_FILE}")
