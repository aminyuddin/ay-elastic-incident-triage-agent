# DEMO_PROMPT.md
## AY Elastic Incident Triage Agent

This file contains ready-to-use demo prompts for testing and demonstrating
the AY Elastic Incident Triage Agent.

All prompts below are entered into the chat input with the agent
selected in Elastic Agent Builder.

---

## ✅ Primary Demo Prompt (Log Analysis + Ticket Creation)

Paste this in the chat input:

```
We are seeing repeated ERROR logs in the core-banking service.
Transactions are timing out and payment retries are failing.
Security logs show multiple authentication failures during the same time window.

Please analyze recent production logs, assess severity and compliance risk,
and take appropriate incident action if required.
```
---

## ✅ Ticket Awareness

### Latest Ticket Status

```
What is the latest incident ticket and what is its current status?
```
---

## ✅ Ticket Lifecycle Demonstration (MCP + CONFIRM)

### Close an Incident

```
Close incident INC-CRIT-1001.
```

Follow-up:
```
CONFIRM
```
---

### Reopen an Incident

```
Reopen incident INC-CRIT-1001.
```

Follow-up:
```
CONFIRM
```
---

## ✅ Focused Follow-up Prompts (Optional)

These prompts demonstrate explainability, depth, and role-based value.

### 1️⃣ Specific Incident Deep Dive

```
Analyze incident INC-CRIT-1001 and explain why it was classified as CRITICAL.
```

Good for:
- Explainable reasoning
- Evidence-backed classification
- Compliance justification

---

### 2️⃣ Compliance-Only Angle

```
Assess compliance risk for recent production incidents and identify any regulatory concerns.
```

Good for:
- Risk and governance narrative
- Compliance awareness

---

### 3️⃣ Operations-First View

```
What immediate actions should operations take based on recent production incident logs?
```

Good for:
- SRE and operations-focused judges
- Actionability and realism

---

### 4️⃣ Executive Summary View

```
Provide an executive summary of recent production incidents and escalation status.
```

Good for:
- Management-level perspective
- Concise, high-level output

---

## 🎯 Recommended Demo Order

1. Run the Primary Demo Prompt
2. Show severity, compliance risk, and ticket creation
3. Ask for Latest Ticket Status
4. Demonstrate Close Incident with CONFIRM
5. Demonstrate Reopen Incident with CONFIRM
6. Run Incident Deep Dive
7. End with Executive Summary

This flow demonstrates:
- Elasticsearch log analysis
- Deterministic, evidence-based reasoning
- MCP-controlled ticket lifecycle
- Human-in-the-loop safety
- Production readiness
