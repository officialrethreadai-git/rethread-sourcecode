const API_BASE = '';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  document.getElementById('login-form').addEventListener('submit', login);
  const me = await fetch(`${API_BASE}/api/admin/me`).then((r) => r.json());
  if (me.isAdmin) showBalances();
}

async function login(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    errorEl.textContent = body.error || 'Login failed';
    errorEl.classList.remove('hidden');
    return;
  }

  showBalances();
}

async function logout() {
  await fetch(`${API_BASE}/api/admin/logout`, { method: 'POST' });
  document.getElementById('balances-view').classList.add('hidden');
  document.getElementById('login-view').classList.remove('hidden');
}

function showBalances() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('balances-view').classList.remove('hidden');
  loadBalances();
  loadAiGate();
  loadAccounts();
}

async function loadBalances() {
  const grid = document.getElementById('balances-grid');
  grid.innerHTML = `<div class="glass-panel p-8 rounded-2xl text-center sm:col-span-2"><p class="text-sm text-offwhite-muted">Loading…</p></div>`;

  const res = await fetch(`${API_BASE}/api/admin/balances`);
  if (!res.ok) {
    grid.innerHTML = `<div class="glass-panel p-8 rounded-2xl text-center sm:col-span-2"><p class="text-sm text-red-400">Failed to load balances.</p></div>`;
    return;
  }
  const { fal, anthropic } = await res.json();

  grid.innerHTML = `
    ${renderFalCard(fal)}
    ${renderAnthropicCard(anthropic)}
  `;
}

function renderFalCard(fal) {
  if (!fal.available) {
    return `
      <div class="glass-panel p-6 rounded-2xl space-y-2">
        <h3 class="font-display font-bold text-sm text-offwhite uppercase tracking-wider">fal.ai (Image Generation)</h3>
        <p class="text-xs text-offwhite-muted">${fal.reason}</p>
        <a href="https://fal.ai/dashboard/billing" target="_blank" class="sc-btn sc-btn-outline sc-btn-sm mt-2">Check fal.ai Dashboard</a>
      </div>`;
  }
  return `
    <div class="glass-panel p-6 rounded-2xl space-y-1">
      <h3 class="font-display font-bold text-sm text-offwhite uppercase tracking-wider">fal.ai (Image Generation)</h3>
      <span class="block text-3xl font-display font-extrabold text-mint mt-1">$${Number(fal.balanceUsd).toFixed(2)}</span>
      <p class="text-[11px] text-offwhite-muted">Live balance from fal.ai's billing API.</p>
    </div>`;
}

function renderAnthropicCard(anthropic) {
  if (!anthropic.available) {
    return `
      <div class="glass-panel p-6 rounded-2xl space-y-2">
        <h3 class="font-display font-bold text-sm text-offwhite uppercase tracking-wider">Claude (Anthropic)</h3>
        <p class="text-xs text-offwhite-muted">${anthropic.reason}</p>
        <a href="https://console.anthropic.com/settings/plans" target="_blank" class="sc-btn sc-btn-outline sc-btn-sm mt-2">Check Anthropic Console</a>
      </div>`;
  }
  const remaining = anthropic.estimatedRemainingUsd;
  return `
    <div class="glass-panel p-6 rounded-2xl space-y-1">
      <h3 class="font-display font-bold text-sm text-offwhite uppercase tracking-wider">Claude (Anthropic)</h3>
      <span class="block text-3xl font-display font-extrabold ${remaining !== null ? 'text-mint' : 'text-offwhite'} mt-1">
        ${remaining !== null ? `~$${remaining.toFixed(2)} left` : `$${anthropic.spentThisMonthUsd.toFixed(4)} spent`}
      </span>
      <p class="text-[11px] text-offwhite-muted">Spend this month: $${anthropic.spentThisMonthUsd.toFixed(4)}</p>
    </div>`;
}

// AI GATE — pause or resume scanning + image generation from the admin panel.
// Use this before a live demo to stop users burning credit, then unpause
// when you're ready to show the AI features.
async function loadAiGate() {
  const res = await fetch(`${API_BASE}/api/admin/ai-gate`);
  if (!res.ok) return;
  const { paused } = await res.json();
  renderAiGate(paused);
}

function renderAiGate(paused) {
  let section = document.getElementById('ai-gate-section');
  if (!section) {
    section = document.createElement('div');
    section.id = 'ai-gate-section';
    // Insert before balances grid
    const grid = document.getElementById('balances-grid');
    grid.parentNode.insertBefore(section, grid);
  }

  section.innerHTML = `
    <div class="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 mb-4 ${paused ? 'border-l-4 border-red-400' : 'border-l-4 border-mint'}">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center ${paused ? 'bg-red-100' : 'bg-mint/10'}">
          <svg class="w-5 h-5 ${paused ? 'text-red-500' : 'text-mint'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            ${paused
              ? '<path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>'
              : '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-offwhite">AI APIs — <span class="${paused ? 'text-red-400' : 'text-mint'}">${paused ? 'PAUSED' : 'ACTIVE'}</span></p>
          <p class="text-[10px] text-offwhite-muted">${paused ? 'Scanning and image generation are blocked for all users.' : 'Scanning and image generation are available to approved users.'}</p>
        </div>
      </div>
      <button onclick="toggleAiGate(${!paused})" class="sc-btn ${paused ? 'sc-btn-primary' : 'sc-btn-outline'} sc-btn-sm shrink-0">
        ${paused ? 'Resume AI' : 'Pause AI'}
      </button>
    </div>`;
}

async function toggleAiGate(pause) {
  const res = await fetch(`${API_BASE}/api/admin/ai-gate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paused: pause }),
  });
  if (!res.ok) return;
  const { paused } = await res.json();
  renderAiGate(paused);
}

// ACCOUNT APPROVAL QUEUE — the shared AI budget (fal.ai + Claude, ~$8
// combined) is small, so visitors must sign up and be approved by the admin
// before their account can scan fabric or generate images.
async function loadAccounts() {
  const res = await fetch(`${API_BASE}/api/admin/accounts`);
  if (!res.ok) return;
  const accounts = await res.json();
  renderAccounts(accounts);
}

function renderAccounts(accounts) {
  let section = document.getElementById('accounts-section');
  if (!section) {
    section = document.createElement('div');
    section.id = 'accounts-section';
    section.className = 'space-y-3';
    document.getElementById('balances-view').appendChild(section);
  }

  const pending = accounts.filter((a) => a.status === 'pending');
  const decided = accounts.filter((a) => a.status !== 'pending').slice(0, 10);

  section.innerHTML = `
    <h2 class="font-display font-bold text-lg text-offwhite pt-2">Account Requests</h2>
    <p class="text-offwhite-muted text-xs">The AI budget is shared and limited — approve only the people who should be able to sign in and use the scan/generate features.</p>
    <div class="space-y-2">
      ${pending.length === 0 ? '<p class="text-xs text-offwhite-muted">No pending account requests.</p>' : pending.map((a) => `
        <div class="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-offwhite">${escapeHtml(a.name)}</p>
            <p class="text-[10px] text-offwhite-muted font-mono">${escapeHtml(a.email)} · ${new Date(a.createdAt).toLocaleString()}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="respondToAccount('${a.id}', 'approve')" class="sc-btn sc-btn-primary sc-btn-sm">Approve</button>
            <button onclick="respondToAccount('${a.id}', 'deny')" class="sc-btn sc-btn-outline sc-btn-sm">Deny</button>
            <button onclick="deleteAccount('${a.id}')" class="sc-btn sc-btn-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100" title="Delete account">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
    ${decided.length ? `
      <details class="text-xs text-offwhite-muted">
        <summary class="cursor-pointer">Recent decisions (${decided.length})</summary>
        <div class="mt-2 space-y-2">
          ${decided.map((a) => `
            <div class="flex items-center justify-between gap-3">
              <span>${escapeHtml(a.name)} (${escapeHtml(a.email)}) — <strong>${a.status}</strong></span>
              <button onclick="deleteAccount('${a.id}')" class="sc-btn sc-btn-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shrink-0" title="Delete account">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>`).join('')}
        </div>
      </details>` : ''}
  `;
}

async function respondToAccount(id, action) {
  await fetch(`${API_BASE}/api/admin/accounts/${id}/${action}`, { method: 'POST' });
  loadAccounts();
}

async function deleteAccount(id) {
  if (!confirm('Delete this account? This cannot be undone.')) return;
  const res = await fetch(`${API_BASE}/api/admin/accounts/${id}`, { method: 'DELETE' });
  if (!res.ok) { alert('Delete failed'); return; }
  loadAccounts();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
