/* ============================================
   Campus Connect — Shared JS
   API helpers, auth, chart config, utilities
   ============================================ */

const API_BASE = '';

// ============ API HELPERS ============
async function api(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Error');
        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        throw err;
    }
}

async function apiGet(endpoint) { return api(endpoint); }
async function apiPost(endpoint, body) {
    return api(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

// ============ AUTH ============
function getUser() {
    const u = localStorage.getItem('scm_user');
    return u ? JSON.parse(u) : null;
}

function setUser(user) {
    localStorage.setItem('scm_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('scm_user');
    window.location.href = 'index.html';
}

function requireAuth(allowedRoles = []) {
    const user = getUser();
    if (!user) { window.location.href = 'index.html'; return null; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// ============ CHART DEFAULTS ============
const chartColors = {
    cyan:   { bg: 'rgba(18, 181, 203, 0.2)', border: '#12b5cb' },
    blue:   { bg: 'rgba(26, 115, 232, 0.2)', border: '#1a73e8' },
    green:  { bg: 'rgba(30, 142, 62, 0.2)', border: '#1e8e3e' },
    yellow: { bg: 'rgba(249, 171, 0, 0.2)', border: '#f9ab00' },
    red:    { bg: 'rgba(217, 48, 37, 0.2)', border: '#d93025' },
    pink:   { bg: 'rgba(233, 30, 99, 0.2)',  border: '#e91e63' },
    purple: { bg: 'rgba(161, 66, 244, 0.2)', border: '#a142f4' },
};
const colorList = Object.values(chartColors);

function getChartDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = '#5f6368';
    Chart.defaults.font.family = "'Inter', 'Google Sans', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.elements.bar.borderRadius = 8;
    Chart.defaults.elements.line.tension = 0.4;
}

// ============ STATUS HELPERS ============
function getStatusBadge(status) {
    if (!status) return '<span class="badge average">N/A</span>';
    const cls = status.toLowerCase().replace(/\s/g, '-');
    return `<span class="badge ${cls}">${status}</span>`;
}

function getRiskColor(level) {
    const map = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ef4444', 'Critical': '#dc2626' };
    return map[level] || '#94a3b8';
}

// ============ UI HELPERS ============
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function animateValue(el, start, end, duration = 1000) {
    const range = end - start;
    const startTime = performance.now();
    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + range * eased;
        el.textContent = Number.isInteger(end) ? Math.round(current) : current.toFixed(1);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// ============ SIDEBAR BUILDER ============
function buildSidebar(role, activePage) {
    const links = {
        student: [
            { icon: '📊', label: 'Dashboard', href: 'student-dashboard.html', page: 'student-dashboard' },
        ],
        teacher: [
            { icon: '📊', label: 'Dashboard', href: 'teacher-dashboard.html', page: 'teacher-dashboard' },
            { icon: '📈', label: 'Analytics', href: 'analytics.html', page: 'analytics' },
        ],
        admin: [
            { icon: '📊', label: 'Dashboard', href: 'admin-dashboard.html', page: 'admin-dashboard' },
            { icon: '👩‍🏫', label: 'Teacher View', href: 'teacher-dashboard.html', page: 'teacher-dashboard' },
            { icon: '📈', label: 'Analytics', href: 'analytics.html', page: 'analytics' },
        ]
    };

    const navLinks = (links[role] || links.student)
        .map(l => `<a class="nav-link ${l.page === activePage ? 'active' : ''}" href="${l.href}">
            <span class="nav-icon">${l.icon}</span> ${l.label}
        </a>`).join('');

    const user = getUser();
    const displayName = user?.name || user?.username || 'User';

    return `
        <div class="sidebar-logo">
            <div class="logo-icon">
                <svg class="genz-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            </div>
            <h2>Campus Connect</h2>
        </div>
        <nav class="sidebar-nav">${navLinks}</nav>
        <div class="sidebar-footer">
            <div style="padding:8px 16px;font-size:13px;color:var(--text-muted)">
                <div style="font-weight:600;color:var(--text-secondary)">${displayName}</div>
                <div style="text-transform:capitalize">${role}</div>
            </div>
            <button class="btn-pill primary" style="width: 100%; margin-top: 16px;" onclick="logout()">Sign Out</button>
        </div>
    `;
}

// Init chart defaults on load
if (typeof Chart !== 'undefined') getChartDefaults();
