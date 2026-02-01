/**
 * Firebase Cloud Functions — MCP endpoint for Incident Portal.
 * Deploy with firebase deploy; Hosting rewrites /mcp to this function.
 * Same project = one deploy for portal + MCP.
 */

import { onRequest } from 'firebase-functions/v2/https';
import app from './mcpApp.js';

export const mcp = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  app
);
