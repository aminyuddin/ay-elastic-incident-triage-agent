/**
 * Stateless MCP Express app for Cloud Functions.
 * Tools (same as mcp-server): create_incident, list_incidents, close_incident, reopen_incident.
 * Each request creates a new McpServer + transport (no session store).
 * Mount at / so Hosting rewrite /mcp -> function receives path /.
 * Protected by header auth: set MCP_AUTH_SECRET and send Authorization: Bearer <secret> or X-API-Key: <secret>.
 */

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { createIncident, listIncidents, closeIncident, reopenIncident } from './firestore.js';

/** Serialize incident for structuredContent (dates → ISO strings). */
function toStructured(incident) {
  const created_at = incident.created_at instanceof Date
    ? incident.created_at.toISOString()
    : incident.created_at;
  const closed_at = incident.closed_at instanceof Date
    ? incident.closed_at.toISOString()
    : incident.closed_at;
  return { ...incident, created_at, closed_at };
}

// Read at cold start; must be set in Cloud Function env (Google Cloud Console → mcp → Environment variables)
const MCP_AUTH_SECRET = process.env.MCP_AUTH_SECRET;

const isSecretConfigured = () => {
  return (
    typeof MCP_AUTH_SECRET === 'string' &&
    MCP_AUTH_SECRET.trim().length > 0
  );
};

/** Reject if MCP_AUTH_SECRET is not set or request does not send a valid auth header. */
function requireAuth(req, res, next) {
  if (!isSecretConfigured()) {
    res.status(503).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'MCP auth not configured. Set MCP_AUTH_SECRET in the Cloud Function environment and send Authorization: Bearer <secret> or X-API-Key: <secret>.' },
      id: null,
    });
    return;
  }
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = (bearer ?? apiKey ?? '').trim();
  if (token !== MCP_AUTH_SECRET.trim()) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized. Send Authorization: Bearer <secret> or X-API-Key: <secret>.' },
      id: null,
    });
    return;
  }
  next();
}

function createServer() {
  const server = new McpServer(
    { name: 'incident-portal-mcp', version: '1.0.0' },
    { capabilities: { logging: {}, tools: { listChanged: false } } }
  );

  server.registerTool(
    'create_incident',
    {
      description:
        'Create a new incident ticket in the incident portal. Writes to Firestore. Use when escalation is required (e.g. after ES|QL analysis).',
      inputSchema: {
        incident_id: z.string().describe('e.g. INC-CRIT-1001'),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('Severity'),
        title: z.string().describe('Short title'),
        description: z.string().optional().describe('Description of the incident'),
        affected_services: z
          .union([z.array(z.string()), z.string()])
          .optional()
          .describe('Comma-separated or array of affected service names'),
        compliance_risk: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional().describe('Compliance risk'),
        recommended_actions: z
          .union([z.array(z.string()), z.string()])
          .optional()
          .describe('Recommended actions (array or newline-separated string)'),
      },
    },
    async (args) => {
      const payload = {
        incident_id: args.incident_id,
        severity: args.severity,
        title: args.title,
        description: args.description ?? '',
        affected_services: args.affected_services,
        compliance_risk: args.compliance_risk ?? 'NONE',
        recommended_actions: args.recommended_actions,
      };
      const incident = await createIncident(payload, 'elastic-agent');
      const structured = toStructured(incident);
      return {
        content: [{ type: 'text', text: `Created incident ${incident.incident_id} (id: ${incident.id})` }],
        structuredContent: {
          results: [{ type: 'json', data: structured }],
        },
      };
    }
  );

  server.registerTool(
    'list_incidents',
    {
      description:
        'List incident tickets from the incident portal. Returns incidents from Firestore ordered by created_at descending. Optionally filter by status (OPEN or CLOSED).',
      inputSchema: {
        status: z.enum(['OPEN', 'CLOSED']).optional().describe('Filter by status: OPEN or CLOSED'),
      },
    },
    async (args) => {
      const opts = args?.status ? { status: args.status } : {};
      const incidents = await listIncidents(opts);
      const structured = incidents.map(toStructured);
      const results = structured.map((incident) => ({ type: 'json', data: incident }));
      return {
        content: [
          { type: 'text', text: `Listed ${structured.length} incident(s)` },
          { type: 'text', text: JSON.stringify({ results }) },
        ],
        structuredContent: { results },
      };
    }
  );

  server.registerTool(
    'close_incident',
    {
      description:
        'Close an incident ticket. Pass the Firestore document id (from list_incidents). Sets status to CLOSED and records closed_at.',
      inputSchema: {
        id: z.string().describe('Firestore document id of the incident (from list_incidents)'),
      },
    },
    async (args) => {
      await closeIncident(args.id);
      return {
        content: [{ type: 'text', text: `Closed incident ${args.id}` }],
        structuredContent: {
          results: [{ type: 'json', data: { id: args.id, status: 'CLOSED' } }],
        },
      };
    }
  );

  server.registerTool(
    'reopen_incident',
    {
      description:
        'Reopen a closed incident ticket. Pass the Firestore document id (from list_incidents). Sets status to OPEN and clears closed_at.',
      inputSchema: {
        id: z.string().describe('Firestore document id of the incident (from list_incidents)'),
      },
    },
    async (args) => {
      await reopenIncident(args.id);
      return {
        content: [{ type: 'text', text: `Reopened incident ${args.id}` }],
        structuredContent: {
          results: [{ type: 'json', data: { id: args.id, status: 'OPEN' } }],
        },
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

// Protect all MCP routes with header auth
app.use(requireAuth);

const mcpHandler = async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    console.error('MCP POST error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
};

// Hosting rewrites /mcp -> function; function may receive path / or /mcp
app.post('/', mcpHandler);
app.post('/mcp', mcpHandler);

app.get('/', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST for MCP.' },
    id: null,
  });
});
app.get('/mcp', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST for MCP.' },
    id: null,
  });
});

app.delete('/', (req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
});
app.delete('/mcp', (req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
});

export default app;
