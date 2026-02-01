/**
 * Firestore (Firebase Admin) for Cloud Function — same data model as portal.
 * In Cloud Functions, default credentials are used (no env needed).
 */

import admin from 'firebase-admin';

let db = null;

export function initFirestore() {
  if (db) return db;
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  db = admin.firestore();
  return db;
}

const COLLECTION = 'incidents';

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

export async function listIncidents(opts = {}) {
  const firestore = initFirestore();
  let ref = firestore.collection(COLLECTION).orderBy('created_at', 'desc');
  const snapshot = await ref.get();
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

export async function getIncident(id) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    created_at: data.created_at?.toDate?.() ?? data.created_at,
    closed_at: data.closed_at?.toDate?.() ?? data.closed_at,
  };
}

export async function updateIncident(id, updates) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  await ref.update(updates);
}

export async function closeIncident(id) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  await ref.update({
    status: 'CLOSED',
    closed_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function reopenIncident(id) {
  const firestore = initFirestore();
  const ref = firestore.collection(COLLECTION).doc(id);
  await ref.update({
    status: 'OPEN',
    closed_at: admin.firestore.FieldValue.delete(),
  });
}
