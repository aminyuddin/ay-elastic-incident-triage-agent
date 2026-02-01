/**
 * Incident Portal — Elastic Agent Builder MCP-style demo.
 * Entry: demo auth, Firestore incidents (create/list), UI binding.
 * The MCP "tools" (Create Incident, List Incidents) are implemented via Firestore
 * and documented in mcp-api.md for the AI agent.
 */

import {
  validateDemoCredentials,
  getCurrentUser,
  setLoggedIn,
  logout as authLogout,
  isAuthenticated,
} from './auth.js';
import {
  createIncident,
  listIncidents,
  getIncident,
  closeIncident,
  reopenIncident,
} from './incidents.js';

// --- DOM refs ---
const loginSection = document.getElementById('login-section');
const portalEl = document.getElementById('portal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const createForm = document.getElementById('create-incident-form');
const incidentListEl = document.getElementById('incident-list');
const listView = document.querySelector('.list-view');
const detailView = document.querySelector('.detail-view');
const detailBack = document.getElementById('detail-back');
const incidentDetailEl = document.getElementById('incident-detail');
const listSection = document.getElementById('list-section');
const filterAll = document.getElementById('filter-all');
const filterOpen = document.getElementById('filter-open');
const filterClosed = document.getElementById('filter-closed');
const createModal = document.getElementById('create-modal');
const openCreateModalBtn = document.getElementById('open-create-modal');
const createModalClose = document.getElementById('create-modal-close');
const createModalOverlay = document.getElementById('create-modal-overlay');
const createModalCancel = document.getElementById('create-modal-cancel');
const refreshBtn = document.getElementById('refresh-btn');

// --- Render based on auth ---
function showPortal(show) {
  if (show) {
    loginSection.classList.add('hidden');
    portalEl.classList.remove('hidden');
    setFilterActive('');
    loadIncidents();
  } else {
    loginSection.classList.remove('hidden');
    portalEl.classList.add('hidden');
  }
}

let currentStatusFilter = ''; // '' = All, 'OPEN', 'CLOSED'

function showList(show) {
  listView?.classList.toggle('hidden', !show);
  detailView?.classList.toggle('hidden', show);
}

// --- Login ---
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!validateDemoCredentials(username, password)) {
    loginError.textContent = 'Invalid credentials. Demo: admin / admin';
    return;
  }
  setLoggedIn(username);
  showPortal(true);
});

// --- Logout ---
logoutBtn?.addEventListener('click', () => {
  authLogout();
  showPortal(false);
});

// --- Refresh incident list ---
refreshBtn?.addEventListener('click', () => {
  loadIncidents();
});

// --- Create ticket modal ---
function openCreateModal() {
  createModal?.classList.remove('hidden');
}

function closeCreateModal() {
  createModal?.classList.add('hidden');
}

openCreateModalBtn?.addEventListener('click', openCreateModal);
createModalClose?.addEventListener('click', closeCreateModal);
createModalOverlay?.addEventListener('click', closeCreateModal);
createModalCancel?.addEventListener('click', closeCreateModal);

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const payload = {
    incident_id: document.getElementById('incident_id').value.trim(),
    severity: document.getElementById('severity').value,
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    affected_services: document.getElementById('affected_services').value.trim(),
    compliance_risk: document.getElementById('compliance_risk').value,
    recommended_actions: document.getElementById('recommended_actions').value.trim(),
  };

  const btn = createForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await createIncident(payload, user);
    createForm.reset();
    closeCreateModal();
    loadIncidents();
  } catch (err) {
    console.error(err);
    alert('Failed to create incident. Check console and Firebase config.');
  } finally {
    btn.disabled = false;
  }
});

// --- List incidents ---
function severityClass(severity) {
  if (severity === 'CRITICAL') return 'severity-critical';
  if (severity === 'HIGH') return 'severity-high';
  if (severity === 'MEDIUM') return 'severity-medium';
  return 'severity-low';
}

function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : (d?.toDate ? d.toDate() : new Date(d));
  return date.toLocaleString();
}

function setFilterActive(status) {
  currentStatusFilter = status;
  filterAll?.classList.toggle('active', status === '');
  filterOpen?.classList.toggle('active', status === 'OPEN');
  filterClosed?.classList.toggle('active', status === 'CLOSED');
}

async function loadIncidents() {
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshText = refreshBtn?.querySelector('.btn-refresh-text');
  if (refreshBtn && refreshText) {
    refreshBtn.disabled = true;
    refreshText.textContent = 'Reloading..';
    refreshBtn.classList.add('refresh-spin');
  }
  incidentListEl.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const opts = currentStatusFilter ? { status: currentStatusFilter } : {};
    const incidents = await listIncidents(opts);
    // Open first, then by created_at desc
    incidents.sort((a, b) => {
      const sa = (a.status || 'OPEN') === 'OPEN' ? 0 : 1;
      const sb = (b.status || 'OPEN') === 'OPEN' ? 0 : 1;
      if (sa !== sb) return sa - sb;
      const ta = (a.created_at && a.created_at.getTime) ? a.created_at.getTime() : 0;
      const tb = (b.created_at && b.created_at.getTime) ? b.created_at.getTime() : 0;
      return tb - ta;
    });
    if (incidents.length === 0) {
      incidentListEl.innerHTML = '<p class="empty">No incidents' + (currentStatusFilter ? ' in this filter.' : ' yet.') + '</p>';
      return;
    }
    incidentListEl.innerHTML = incidents
      .map(
        (inc) => {
          const status = inc.status || 'OPEN';
          const closedMeta = inc.closed_at ? ` · Closed ${formatDate(inc.closed_at)}` : '';
          return `
        <div class="incident-card ${severityClass(inc.severity)} ${status === 'CLOSED' ? 'incident-closed' : ''}" data-id="${inc.id}">
          <div class="card-header">
            <span class="inc-id">${escapeHtml(inc.incident_id || inc.id)}</span>
            <span class="badge severity-${(inc.severity || '').toLowerCase()}">${escapeHtml(inc.severity || '—')}</span>
            <span class="badge status status-${status.toLowerCase()}">${escapeHtml(status)}</span>
          </div>
          <div class="card-title">${escapeHtml(inc.title || '—')}</div>
          <div class="card-meta">${formatDate(inc.created_at)} · ${escapeHtml(inc.created_by || '—')}${closedMeta}</div>
        </div>
      `;
        }
      )
      .join('');

    incidentListEl.querySelectorAll('.incident-card').forEach((el) => {
      el.addEventListener('click', () => showDetail(el.dataset.id, incidents));
    });
    if (refreshBtn && refreshText) {
      refreshBtn.classList.remove('refresh-spin');
      refreshText.textContent = 'Reload';
      refreshBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    incidentListEl.innerHTML =
      '<p class="error">Failed to load incidents. Check Firebase config and rules.</p>';
    if (refreshBtn && refreshText) {
      refreshBtn.classList.remove('refresh-spin');
      refreshText.textContent = 'Reload';
      refreshBtn.disabled = false;
    }
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s ?? '';
  return div.innerHTML;
}

// --- Detail view ---
function renderDetail(inc) {
  const status = inc.status || 'OPEN';
  const closedLine = inc.closed_at
    ? `<p><strong>Closed</strong> ${formatDate(inc.closed_at)}</p>`
    : '';
  const actions =
    status === 'OPEN'
      ? '<button type="button" id="detail-close" class="btn-primary btn-close">Close incident</button>'
      : '<button type="button" id="detail-reopen" class="btn-secondary">Reopen incident</button>';
  incidentDetailEl.innerHTML = `
    <div class="detail-content ${severityClass(inc.severity)}" data-id="${inc.id}">
      <p><strong>Incident ID</strong> ${escapeHtml(inc.incident_id || inc.id)}</p>
      <p><strong>Severity</strong> <span class="badge severity-${(inc.severity || '').toLowerCase()}">${escapeHtml(inc.severity || '—')}</span></p>
      <p><strong>Status</strong> <span class="badge status status-${status.toLowerCase()}">${escapeHtml(status)}</span></p>
      <p><strong>Title</strong> ${escapeHtml(inc.title || '—')}</p>
      <p><strong>Description</strong> ${escapeHtml(inc.description || '—')}</p>
      <p><strong>Affected services</strong> ${(inc.affected_services || []).map(escapeHtml).join(', ') || '—'}</p>
      <p><strong>Compliance risk</strong> <span class="compliance-${(inc.compliance_risk || 'NONE').toLowerCase()}">${escapeHtml(inc.compliance_risk || 'NONE')}</span></p>
      <p><strong>Recommended actions</strong></p>
      <ul>${(inc.recommended_actions || []).map((a) => `<li>${escapeHtml(a)}</li>`).join('') || '<li>—</li>'}</ul>
      <p><strong>Created</strong> ${formatDate(inc.created_at)} by ${escapeHtml(inc.created_by || '—')}</p>
      ${closedLine}
      <div class="detail-actions">${actions}</div>
    </div>
  `;
  const closeBtn = incidentDetailEl.querySelector('#detail-close');
  const reopenBtn = incidentDetailEl.querySelector('#detail-reopen');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      closeBtn.disabled = true;
      try {
        await closeIncident(inc.id);
        const updated = await getIncident(inc.id);
        if (updated) renderDetail(updated);
      } catch (err) {
        console.error(err);
        alert('Failed to close incident.');
      } finally {
        closeBtn.disabled = false;
      }
    });
  }
  if (reopenBtn) {
    reopenBtn.addEventListener('click', async () => {
      reopenBtn.disabled = true;
      try {
        await reopenIncident(inc.id);
        const updated = await getIncident(inc.id);
        if (updated) renderDetail(updated);
      } catch (err) {
        console.error(err);
        alert('Failed to reopen incident.');
      } finally {
        reopenBtn.disabled = false;
      }
    });
  }
}

function showDetail(id, incidents) {
  const inc = incidents.find((i) => i.id === id);
  if (!inc) return;
  listView?.classList.add('hidden');
  detailView?.classList.remove('hidden');
  renderDetail(inc);
}

detailBack?.addEventListener('click', () => {
  showList(true);
  loadIncidents();
});

// --- Status filter ---
filterAll?.addEventListener('click', () => {
  setFilterActive('');
  loadIncidents();
});
filterOpen?.addEventListener('click', () => {
  setFilterActive('OPEN');
  loadIncidents();
});
filterClosed?.addEventListener('click', () => {
  setFilterActive('CLOSED');
  loadIncidents();
});

// --- Init ---
if (isAuthenticated()) {
  showPortal(true);
} else {
  showPortal(false);
}
