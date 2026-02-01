/**
 * Firestore operations for incidents.
 * These implement the MCP-style "Create Incident" and "List Incidents" tools
 * documented in mcp-api.md. Elastic Agent Builder would call equivalent
 * operations (e.g. via an MCP server) after ES|QL analysis to create/list tickets.
 *
 * - Create: addDoc to `incidents` collection (equivalent to POST /incidents)
 * - List: getDocs ordered by created_at DESC (equivalent to GET /incidents)
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase.js';

const COLLECTION = 'incidents';

/**
 * Create an incident document in Firestore (MCP "Create Incident" tool).
 * @param {Object} payload - Incident fields (incident_id, severity, title, etc.)
 * @param {string} createdBy - Username (e.g. demo "admin")
 * @returns {Promise<Object>} Created incident with id and created_at
 */
export async function createIncident(payload, createdBy) {
  const doc = {
    incident_id: payload.incident_id ?? '',
    severity: payload.severity ?? 'MEDIUM',
    title: payload.title ?? '',
    description: payload.description ?? '',
    affected_services: Array.isArray(payload.affected_services)
      ? payload.affected_services
      : (payload.affected_services || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    compliance_risk: payload.compliance_risk ?? 'NONE',
    recommended_actions: Array.isArray(payload.recommended_actions)
      ? payload.recommended_actions
      : (payload.recommended_actions || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
    status: 'OPEN',
    created_by: createdBy,
    created_at: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), doc);
  return {
    id: ref.id,
    ...doc,
    created_at: new Date(),
  };
}

/**
 * List incidents from Firestore, ordered by created_at DESC (MCP "List Incidents" tool).
 * @param {{ status?: 'OPEN' | 'CLOSED' }} [opts] - Optional filter by status (client-side).
 * @returns {Promise<Array<Object>>}
 */
export async function listIncidents(opts = {}) {
  const q = query(
    collection(db, COLLECTION),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  let list = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_at: data.created_at?.toDate?.() ?? data.created_at,
      closed_at: data.closed_at?.toDate?.() ?? data.closed_at,
    };
  });
  if (opts.status) {
    list = list.filter((inc) => (inc.status || 'OPEN') === opts.status);
  }
  return list;
}

/**
 * Get a single incident by id.
 * @param {string} id - Document id
 * @returns {Promise<Object|null>}
 */
export async function getIncident(id) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    created_at: data.created_at?.toDate?.() ?? data.created_at,
    closed_at: data.closed_at?.toDate?.() ?? data.closed_at,
  };
}

/**
 * Update an incident (e.g. status, closed_at).
 * @param {string} id - Document id
 * @param {Object} updates - Fields to update (status, closed_at, etc.)
 */
export async function updateIncident(id, updates) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, updates);
}

/**
 * Close an incident (set status CLOSED and closed_at).
 * @param {string} id - Document id
 */
export async function closeIncident(id) {
  await updateIncident(id, {
    status: 'CLOSED',
    closed_at: serverTimestamp(),
  });
}

/**
 * Reopen an incident (set status OPEN, clear closed_at).
 * @param {string} id - Document id
 */
export async function reopenIncident(id) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    status: 'OPEN',
    closed_at: deleteField(),
  });
}
