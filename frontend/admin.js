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
  loadAccessRequests();
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
      <p class="text-[11px] text-offwhite-muted">Real spend this month: $${anthropic.spentThisMonthUsd.toFixed(4)} (Cost Report API).
        ${remaining !== null ? `Estimated from a $${anthropic.startingCreditUsd} starting credit you configured — not a live balance (Anthropic doesn't expose one).` : ''}</p>
    </div>`;
}

// GENERATE-ACCESS APPROVAL QUEUE — lets the admin approve which visitors
// can use the (low-budget) fal.ai image generation feature during a demo.
async function loadAccessRequests() {
  const res = await fetch(`${API_BASE}/api/admin/generate-access`);
  if (!res.ok) return;
  const requests = await res.json();
  renderAccessRequests(requests);
}

function renderAccessRequests(requests) {
  let section = document.getElementById('access-requests-section');
  if (!section) {
    section = document.createElement('div');
    section.id = 'access-requests-section';
    section.className = 'space-y-3';
    document.getElementById('balances-view').appendChild(section);
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending').slice(0, 8);

  section.innerHTML = `
    <h2 class="font-display font-bold text-lg text-offwhite pt-2">Generate Access Requests</h2>
    <p class="text-offwhite-muted text-xs">fal.ai credit is limited — approve only the people who should be able to click "Generate Image" during the demo.</p>
    <div class="space-y-2">
      ${pending.length === 0 ? '<p class="text-xs text-offwhite-muted">No pending requests.</p>' : pending.map((r) => `
        <div class="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-offwhite">${escapeHtml(r.name)}</p>
            <p class="text-[10px] text-offwhite-muted">${new Date(r.requestedAt).toLocaleString()}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="respondToAccess('${r.id}', 'approve')" class="sc-btn sc-btn-primary sc-btn-sm">Approve</button>
            <button onclick="respondToAccess('${r.id}', 'deny')" class="sc-btn sc-btn-outline sc-btn-sm">Deny</button>
          </div>
        </div>
      `).join('')}
    </div>
    ${decided.length ? `
      <details class="text-xs text-offwhite-muted">
        <summary class="cursor-pointer">Recent decisions</summary>
        <div class="mt-2 space-y-1">
          ${decided.map((r) => `<div>${escapeHtml(r.name)} — ${r.status}</div>`).join('')}
        </div>
      </details>` : ''}
  `;
}

async function respondToAccess(id, action) {
  await fetch(`${API_BASE}/api/admin/generate-access/${id}/${action}`, { method: 'POST' });
  loadAccessRequests();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
