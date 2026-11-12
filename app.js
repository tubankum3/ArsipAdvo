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
  loadingPerkara: false,
  loadingArsip: false,
  errorPerkara: null,
  errorArsip: null
};

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

  document.getElementById('stat-total-arsip').textContent = totalArsip;
  document.getElementById('stat-dipinjam').textContent = dipinjam;
  document.getElementById('stat-tersedia').textContent = tersedia;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-peminjaman').addEventListener('click', () => switchView('peminjaman'));
  document.getElementById('nav-arsiparis').addEventListener('click', () => switchView('arsiparis'));
  
  document.getElementById('tab-perkara').addEventListener('click', () => switchArsiparisTab('perkara'));
  document.getElementById('tab-arsip').addEventListener('click', () => switchArsiparisTab('arsip'));
});

function switchArsiparisTab(tabName) {
  const tabPerkara = document.getElementById('tab-perkara');
  const tabArsip = document.getElementById('tab-arsip');
  const contentPerkara = document.getElementById('tab-content-perkara');
  const contentArsip = document.getElementById('tab-content-arsip');

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

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.indexOf('PASTE_YOUR') === -1;
}

async function apiGet(action) {
  const url = CONFIG.API_URL + '?action=' + encodeURIComponent(action);
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Terjadi kesalahan pada server.');
  return json;
}

function showGlobalError(message) {
  const el = document.getElementById('global-error');
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearGlobalError() {
  document.getElementById('global-error').classList.add('hidden');
}

async function fetchAllData() {
  // Cek cache lokal terlebih dahulu agar aplikasi langsung tampil instan
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
    
    // Simpan ke localStorage untuk akses cepat berikutnya
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

function renderPerkaraSection() {
  const wrap = document.getElementById('perkara-table-wrap');
  if (!wrap) return;
  if (state.loadingPerkara && state.perkara.length === 0) {
    wrap.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm"><div class="spinner"></div>Memuat data perkara...</div>`;
    return;
  }
  const filtered = state.perkara.filter(p => (p.nomorPerkara || '').toLowerCase().includes(state.searchPerkara.toLowerCase()));
  const rows = paginate(filtered, state.pagePerkara, state.perPagePerkara);

  wrap.innerHTML = `
    <table class="min-w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">No</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nomor Perkara</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Jenis Perkara</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tahun Masuk</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${rows.length === 0 ? `<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 italic">Tidak ada data.</td></tr>` : 
          rows.map((p, i) => `
            <tr class="hover:bg-gray-50">
              <td class="px-5 py-3 text-sm">${(state.pagePerkara - 1) * state.perPagePerkara + i + 1}</td>
              <td class="px-5 py-3 text-sm font-medium">${escapeHtml(p.nomorPerkara)}</td>
              <td class="px-5 py-3 text-sm">${escapeHtml(p.jenisPerkara)}</td>
              <td class="px-5 py-3 text-sm">${escapeHtml(p.tahunMasuk)}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  `;
  renderPaginationControls('perkara-pagination', filtered.length, state.pagePerkara, state.perPagePerkara,
    (p) => { state.pagePerkara = p; renderPerkaraSection(); },
    (pp) => { state.perPagePerkara = pp; state.pagePerkara = 1; renderPerkaraSection(); }
  );
}

function renderArsipSection() {
  const wrap = document.getElementById('arsip-table-wrap');
  if (!wrap) return;
  if (state.loadingArsip && state.arsip.length === 0) {
    wrap.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm"><div class="spinner"></div>Memuat data arsip...</div>`;
    return;
  }
  const filtered = state.arsip.filter(a => (a.nomorPerkara || '').toLowerCase().includes(state.searchArsip.toLowerCase()));
  const rows = paginate(filtered, state.pageArsip, state.perPageArsip);

  wrap.innerHTML = `
    <table class="min-w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">No</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nomor Perkara</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Klasifikasi</th>
          <th class="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Lokasi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${rows.length === 0 ? `<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 italic">Tidak ada data arsip.</td></tr>` : 
          rows.map((a, i) => `
            <tr class="hover:bg-gray-50">
              <td class="px-5 py-3 text-sm">${(state.pageArsip - 1) * state.perPageArsip + i + 1}</td>
              <td class="px-5 py-3 text-sm font-medium">${escapeHtml(a.nomorPerkara)}</td>
              <td class="px-5 py-3 text-sm">${escapeHtml(a.kodeKlasifikasi)}</td>
              <td class="px-5 py-3 text-sm">${escapeHtml(a.lokasiSimpan)}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  `;
  renderPaginationControls('arsip-pagination', filtered.length, state.pageArsip, state.perPageArsip,
    (p) => { state.pageArsip = p; renderArsipSection(); },
    (pp) => { state.perPageArsip = pp; state.pageArsip = 1; renderArsipSection(); }
  );
}

function renderPeminjamanSection() {
  const wrap = document.getElementById('peminjaman-table-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div class="p-6 text-sm text-gray-600">Modul peminjaman siap digunakan dengan sinkronisasi data lokal.</div>`;
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'search-perkara') { state.searchPerkara = e.target.value; renderPerkaraSection(); }
  if (e.target.id === 'search-arsip') { state.searchArsip = e.target.value; renderArsipSection(); }
});

// Inisialisasi awal
if (!isConfigured()) {
  showGlobalError('Silakan masukkan URL Web App Apps Script Anda ke dalam file config.js');
} else {
  fetchAllData();
}
