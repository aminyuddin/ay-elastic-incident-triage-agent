/**
 * Firestore (Firebase Admin) helpers for the Incident MCP server.
 * Same data model as the portal — writes/reads the `incidents` collection.
 */

import admin from 'firebase-admin';

let db = null;

/**
 * Initialize Firebase Admin with service account.
 * Set GOOGLE_APPLICATION_CREDENTIALS to path to service account JSON,
 * or pass credentials via FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON).
 * Call once before create/list; if not configured, first tool call will throw.
 */
export function initFirestore() {
  if (db) return db;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp(); // uses Application Default Credentials from that path
  } else {
    throw new Error(
      'Firestore not configured. Set GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) or FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON).'
    );
  }

  db = admin.firestore();
  return db;
}

const COLLECTION = 'incidents';

/**
 * Create an incident document (MCP create_incident tool).
 * @param {Object} payload - incident_id, severity, title, description, affected_services, compliance_risk, recommended_actions
 * @param {string} createdBy - e.g. "elastic-agent" or "admin"
 */
export async function createIncident(payload, createdBy = 'elastic-agent') {
  const firestore = initFirestore();

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
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = await firestore.collection(COLLECTION).add(doc);
  const snap = await ref.get();
  const data = snap.data();
  return {
    id: ref.id,
    ...data,
    created_at: data.created_at?.toDate?.() ?? new Date(),
  };
}

/**
 * List incidents ordered by created_at DESC (MCP list_incidents tool).
 * @param {{ status?: 'OPEN' | 'CLOSED' }} [opts] - Optional filter by status.
 */
export async function listIncidents(opts = {}) {
  const firestore = initFirestore();

  const snapshot = await firestore
    .collection(COLLECTION)
    .orderBy('created_at', 'desc')
    .get();

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
 * Close an incident (set status CLOSED and closed_at).
 */
export async function closeIncident(id) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  await ref.update({
    status: 'CLOSED',
    closed_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Reopen an incident (set status OPEN, clear closed_at).
 */
export async function reopenIncident(id) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  await ref.update({
    status: 'OPEN',
    closed_at: admin.firestore.FieldValue.delete(),
  });
}
