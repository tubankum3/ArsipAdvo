// ====== STATE ======
const state = {
  activeView: 'peminjaman',
  perkara: [],
  arsip: [],
  searchPerkara: '',
  searchArsip: '',
  searchPeminjaman: '',
  pagePerkara: 1,
  pageArsip: 1,
  pagePeminjaman: 1,
  perPagePerkara: 10,
  perPageArsip: 10,
  perPagePeminjaman: 10,
  loadingPerkara: true,
  loadingArsip: true,
  errorPerkara: null,
  errorArsip: null
};

// ====== NAVIGATION & DASHBOARD ======
function switchView(viewName) {
  state.activeView = viewName;
  document.getElementById('view-peminjaman').classList.toggle('hidden', viewName !== 'peminjaman');
  document.getElementById('view-arsiparis').classList.toggle('hidden', viewName !== 'arsiparis');

  const btnPeminjaman = document.getElementById('nav-peminjaman');
  const btnArsiparis = document.getElementById('nav-arsiparis');

  if (viewName === 'peminjaman') {
    btnPeminjaman.className = "nav-btn bg-blue-800 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors";
    btnArsiparis.className = "nav-btn text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors";
    renderPeminjamanSection();
    renderStats();
  } else {
    btnArsiparis.className = "nav-btn bg-blue-800 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors";
    btnPeminjaman.className = "nav-btn text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors";
    renderPerkaraSection();
    renderArsipSection();
  }
}

function renderStats() {
  if (!state.arsip) return;
  const totalArsip = state.arsip.length;
  const dipinjam = state.arsip.filter(a => a.status === 'Dipinjam').length;
  const tersedia = totalArsip - dipinjam;

  const statTotal = document.getElementById('stat-total-arsip');
  const statDipinjam = document.getElementById('stat-dipinjam');
  const statTersedia = document.getElementById('stat-tersedia');

  if (statTotal) statTotal.textContent = totalArsip;
  if (statDipinjam) statDipinjam.textContent = dipinjam;
  if (statTersedia) statTersedia.textContent = tersedia;
}

document.addEventListener('DOMContentLoaded', () => {
  const navPeminjaman = document.getElementById('nav-peminjaman');
  const navArsiparis = document.getElementById('nav-arsiparis');
  const tabPerkara = document.getElementById('tab-perkara');
  const tabArsip = document.getElementById('tab-arsip');

  if (navPeminjaman) navPeminjaman.addEventListener('click', () => switchView('peminjaman'));
  if (navArsiparis) navArsiparis.addEventListener('click', () => switchView('arsiparis'));
  if (tabPerkara) tabPerkara.addEventListener('click', () => switchArsiparisTab('perkara'));
  if (tabArsip) tabArsip.addEventListener('click', () => switchArsiparisTab('arsip'));
});

function switchArsiparisTab(tabName) {
  const tabPerkara = document.getElementById('tab-perkara');
  const tabArsip = document.getElementById('tab-arsip');
  const contentPerkara = document.getElementById('tab-content-perkara');
  const contentArsip = document.getElementById('tab-content-arsip');

  if (!tabPerkara || !tabArsip || !contentPerkara || !contentArsip) return;

  if (tabName === 'perkara') {
    tabPerkara.className = "border-blue-600 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors";
    tabArsip.className = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors";
    contentPerkara.classList.remove('hidden');
    contentArsip.classList.add('hidden');
  } else {
    tabArsip.className = "border-blue-600 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors";
    tabPerkara.className = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors";
    contentArsip.classList.remove('hidden');
    contentPerkara.classList.add('hidden');
  }
}

// ====== SMALL HELPERS ======
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ====== API LAYER ======
async function apiGet(action) {
  const url = CONFIG.API_URL + '?action=' + encodeURIComponent(action);
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON response from server.');
  }
  if (json.status !== 'success') throw new Error(json.message || 'Terjadi kesalahan pada server.');
  return json;
}

async function apiPost(action, payload) {
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: action }, payload))
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.warn('Received HTML response for POST. Assuming success.', text.substring(0, 100));
      return true;
    }
    if (json.status !== 'success') throw new Error(json.message || 'Terjadi kesalahan pada server.');
    return json.data || true;
  } catch (err) {
    throw new Error(err.message);
  }
}

function showGlobalError(message) {
  const el = document.getElementById('global-error');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function clearGlobalError() {
  const el = document.getElementById('global-error');
  if (el) el.classList.add('hidden');
}

// ====== DATA LOADING (DENGAN LOCALSTORAGE CACHE) ======
async function fetchAllData() {
  const cachedData = localStorage.getItem('arsip_cache_data');
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      state.perkara = parsed.perkara || [];
      state.arsip = parsed.arsip || [];
      renderPerkaraSection();
      renderArsipSection();
      renderPeminjamanSection();
      renderStats();
    } catch (e) {
      console.error(e);
    }
  } else {
    state.loadingPerkara = true;
    state.loadingArsip = true;
    renderPerkaraSection();
    renderArsipSection();
  }

  try {
    const data = await apiGet('getData');
    state.perkara = data.perkara || [];
    state.arsip = data.arsip || [];
    
    localStorage.setItem('arsip_cache_data', JSON.stringify({
      perkara: state.perkara,
      arsip: state.arsip
    }));
  } catch (err) {
    if (!cachedData) {
      state.errorPerkara = err.message;
      state.errorArsip = err.message;
      showGlobalError('Gagal memuat data dari server: ' + err.message);
    }
  } finally {
    state.loadingPerkara = false;
    state.loadingArsip = false;
    renderPerkaraSection();
    renderArsipSection();
    renderPeminjamanSection();
    renderStats();
  }
}

// ====== PAGINATION HELPER ======
function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

function renderPaginationControls(containerId, totalItems, page, perPage, onPageChange, onPerPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  container.innerHTML = `
    <div class="flex items-center justify-between text-sm text-gray-600 flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <span>Baris per halaman:</span>
        <select class="border border-gray-300 rounded px-2 py-1 text-sm" data-perpage>
          ${[10, 25, 50].map(n => `<option value="${n}" ${n === perPage ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="flex items-center gap-3">
        <span>Halaman ${page} dari ${totalPages} (${totalItems} data)</span>
        <button data-prev class="px-2 py-1 border border-gray-300 rounded disabled:opacity-40" ${page <= 1 ? 'disabled' : ''}>&lsaquo;</button>
        <button data-next class="px-2 py-1 border border-gray-300 rounded disabled:opacity-40" ${page >= totalPages ? 'disabled' : ''}>&rsaquo;</button>
      </div>
    </div>
  `;
  container.querySelector('[data-prev]').onclick = () => onPageChange(Math.max(1, page - 1));
  container.querySelector('[data-next]').onclick = () => onPageChange(Math.min(totalPages, page + 1));
  container.querySelector('[data-perpage]').onchange = (e) => onPerPageChange(Number(e.target.value));
}

// ====== TABLE 1: DAFTAR PERKARA SELESAI ======
function renderPerkaraSection() {
  const wrap = document.getElementById('perkara-table-wrap');
  if (!wrap) return;

  if (state.loadingPerkara && state.perkara.length === 0) {
    wrap.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm"><div class="spinner"></div>Memuat data...</div>`;
    return;
  }
  if (state.errorPerkara) {
    wrap.innerHTML = `<div class="p-6 text-sm text-red-600">Gagal memuat data: ${escapeHtml(state.errorPerkara)}</div>`;
    return;
  }

  const filtered = state.perkara.filter(p => (p.nomorPerkara || '').toLowerCase().includes(state.searchPerkara.toLowerCase()) || (p.jenisPerkara || '').toLowerCase().includes(state.searchPerkara.toLowerCase()));
  const rows = paginate(filtered, state.pagePerkara, state.perPagePerkara);

  wrap.innerHTML = `
    <table class="min-w-full">
      <thead class="bg-[#fcfcfc] border-b border-gray-200">
        <tr>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase w-20 border-r border-gray-200">No</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Nomor Perkara</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Jenis Perkara</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Masuk</th>
          <th class="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        ${rows.length === 0 ? `
          <tr><td colspan="5" class="px-5 py-10 text-center text-gray-500 italic">Tidak ada perkara selesai yang ditemukan.</td></tr>
        ` : rows.map((p, i) => `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${(state.pagePerkara - 1) * state.perPagePerkara + i + 1}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200 font-medium">${escapeHtml(p.nomorPerkara)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${escapeHtml(p.jenisPerkara)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${escapeHtml(p.tahunMasuk)}</td>
            <td class="px-5 py-4 text-center text-sm">
              <button class="px-3 py-1.5 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors shadow-sm text-xs font-bold" data-archive-id="${escapeHtml(p.id)}">
                Arsipkan
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-archive-id]').forEach(btn => {
    btn.onclick = () => {
      const record = state.perkara.find(p => String(p.id) === btn.dataset.archiveId);
      openArsipFormModal('create', record);
    };
  });

  renderPaginationControls('perkara-pagination', filtered.length, state.pagePerkara, state.perPagePerkara,
    (page) => { state.pagePerkara = page; renderPerkaraSection(); },
    (perPage) => { state.perPagePerkara = perPage; state.pagePerkara = 1; renderPerkaraSection(); }
  );
}

// ====== INPUT SEARCH & FILTER LISTENERS ======
document.addEventListener('input', (e) => {
  if (e.target.id === 'search-perkara') {
    state.searchPerkara = e.target.value;
    state.pagePerkara = 1;
    renderPerkaraSection();
  }
  if (e.target.id === 'search-arsip') {
    state.searchArsip = e.target.value;
    state.pageArsip = 1;
    renderArsipSection();
  }
  if (e.target.id === 'search-peminjaman') {
    state.searchPeminjaman = e.target.value;
    state.pagePeminjaman = 1;
    renderPeminjamanSection();
