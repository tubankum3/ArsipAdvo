// ====== STATE ======
const state = {
  perkara: [],
  arsip: [],
  searchPerkara: '',
  searchArsip: '',
  pagePerkara: 1,
  pageArsip: 1,
  perPagePerkara: 10,
  perPageArsip: 10,
  loadingPerkara: true,
  loadingArsip: true,
  errorPerkara: null,
  errorArsip: null
};

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
  const url = CONFIG.API_URL + '?action=' + encodeURIComponent(action) + '&token=' + encodeURIComponent(CONFIG.API_TOKEN || '');
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Terjadi kesalahan pada server.');
  return json.data;
}

// Note: no explicit Content-Type header is set on purpose. Sending the
// body as plain text avoids a CORS preflight request, which Apps Script
// Web Apps don't handle. Code.gs still parses it as JSON server-side.
async function apiPost(action, payload) {
  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action: action, token: CONFIG.API_TOKEN || '' }, payload))
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Terjadi kesalahan pada server.');
  return json.data;
}

function showGlobalError(message) {
  const el = document.getElementById('global-error');
  el.textContent = message;
  el.classList.remove('hidden');
}
function clearGlobalError() {
  document.getElementById('global-error').classList.add('hidden');
}

// ====== DATA LOADING ======
async function fetchPerkara() {
  state.loadingPerkara = true;
  state.errorPerkara = null;
  renderPerkaraSection();
  try {
    state.perkara = await apiGet('perkaraSelesai');
  } catch (err) {
    state.errorPerkara = err.message;
  } finally {
    state.loadingPerkara = false;
    renderPerkaraSection();
  }
}

async function fetchArsip() {
  state.loadingArsip = true;
  state.errorArsip = null;
  renderArsipSection();
  try {
    state.arsip = await apiGet('arsip');
  } catch (err) {
    state.errorArsip = err.message;
  } finally {
    state.loadingArsip = false;
    renderArsipSection();
  }
}

// ====== PAGINATION HELPER ======
function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

function renderPaginationControls(containerId, totalItems, page, perPage, onPageChange, onPerPageChange) {
  const container = document.getElementById(containerId);
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
function getFilteredPerkara() {
  const term = state.searchPerkara.toLowerCase();
  return state.perkara.filter(p =>
    (p.nomorPerkara || '').toLowerCase().includes(term) ||
    (p.jenisPerkara || '').toLowerCase().includes(term)
  );
}

function renderPerkaraSection() {
  const wrap = document.getElementById('perkara-table-wrap');

  if (state.loadingPerkara) {
    wrap.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm"><div class="spinner"></div>Memuat data...</div>`;
    document.getElementById('perkara-pagination').innerHTML = '';
    return;
  }
  if (state.errorPerkara) {
    wrap.innerHTML = `<div class="p-6 text-sm text-red-600">Gagal memuat data: ${escapeHtml(state.errorPerkara)}</div>`;
    document.getElementById('perkara-pagination').innerHTML = '';
    return;
  }

  const filtered = getFilteredPerkara();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPagePerkara));
  if (state.pagePerkara > totalPages) state.pagePerkara = totalPages;
  const rows = paginate(filtered, state.pagePerkara, state.perPagePerkara);

  wrap.innerHTML = `
    <table class="min-w-full">
      <thead class="bg-[#fcfcfc] border-b border-gray-200">
        <tr>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20 border-r border-gray-200">No</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Nomor Perkara</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Jenis Perkara</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Masuk</th>
          <th class="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
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
});

// ====== TABLE 2: DAFTAR ARSIP PERKARA SELESAI ======
function getFilteredArsip() {
  const term = state.searchArsip.toLowerCase();
  return state.arsip.filter(a =>
    (a.nomorPerkara || '').toLowerCase().includes(term) ||
    (a.jenisPerkara || '').toLowerCase().includes(term)
  );
}

function statusBadge(status) {
  const isArsip = status === 'Terarsip';
  const cls = isArsip ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}">${escapeHtml(status)}</span>`;
}

function renderArsipSection() {
  const wrap = document.getElementById('arsip-table-wrap');

  if (state.loadingArsip) {
    wrap.innerHTML = `<div class="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm"><div class="spinner"></div>Memuat data...</div>`;
    document.getElementById('arsip-pagination').innerHTML = '';
    return;
  }
  if (state.errorArsip) {
    wrap.innerHTML = `<div class="p-6 text-sm text-red-600">Gagal memuat data: ${escapeHtml(state.errorArsip)}</div>`;
    document.getElementById('arsip-pagination').innerHTML = '';
    return;
  }

  const filtered = getFilteredArsip();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPageArsip));
  if (state.pageArsip > totalPages) state.pageArsip = totalPages;
  const rows = paginate(filtered, state.pageArsip, state.perPageArsip);

  wrap.innerHTML = `
    <table class="min-w-full">
      <thead class="bg-[#fcfcfc] border-b border-gray-200">
        <tr>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16 border-r border-gray-200">No</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Klasifikasi</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Nomor Perkara</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Jenis</th>
          <th class="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Masuk</th>
          <th class="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Selesai</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Lokasi</th>
          <th class="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Status</th>
          <th class="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        ${rows.length === 0 ? `
          <tr><td colspan="9" class="px-5 py-12 text-sm text-gray-500 font-medium text-center italic">Belum ada data arsip terekam.</td></tr>
        ` : rows.map((a, i) => `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${(state.pageArsip - 1) * state.perPageArsip + i + 1}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${escapeHtml(a.kodeKlasifikasi)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200 font-medium">${escapeHtml(a.nomorPerkara)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${escapeHtml(a.jenisPerkara)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200 text-center">${escapeHtml(a.tahunMasuk)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200 text-center">${escapeHtml(a.tahunSelesai)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${escapeHtml(a.lokasiSimpan)}</td>
            <td class="px-5 py-4 text-sm text-gray-800 border-r border-gray-200">${statusBadge(a.status)}</td>
            <td class="px-5 py-4 text-center text-sm">
              <div class="flex items-center justify-center gap-1">
                <button title="Lihat Detail" class="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" data-view="${escapeHtml(a.id)}">👁</button>
                <button title="Edit" class="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100" data-edit="${escapeHtml(a.id)}">✏️</button>
                ${a.status === 'Dipinjam'
                  ? `<button title="Kembalikan Arsip" class="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" data-return="${escapeHtml(a.id)}">↩️</button>`
                  : `<button title="Rekam Peminjaman" class="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" data-borrow="${escapeHtml(a.id)}">📗</button>`}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-view]').forEach(btn => {
    btn.onclick = () => openDetailModal(state.arsip.find(a => String(a.id) === btn.dataset.view));
  });
  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => openArsipFormModal('edit', state.arsip.find(a => String(a.id) === btn.dataset.edit));
  });
  wrap.querySelectorAll('[data-borrow]').forEach(btn => {
    btn.onclick = () => openPinjamModal(btn.dataset.borrow);
  });
  wrap.querySelectorAll('[data-return]').forEach(btn => {
    btn.onclick = () => {
      const archive = state.arsip.find(a => String(a.id) === btn.dataset.return);
      const active = (archive.peminjaman || []).find(p => !p.tanggalKembali);
      if (active) returnPeminjaman(archive.id, active.id);
    };
  });

  renderPaginationControls('arsip-pagination', filtered.length, state.pageArsip, state.perPageArsip,
    (page) => { state.pageArsip = page; renderArsipSection(); },
    (perPage) => { state.perPageArsip = perPage; state.pageArsip = 1; renderArsipSection(); }
  );
}

// ====== SHARED "INFORMASI UMUM" BLOCK ======
function informasiUmumHtml(record) {
  return `
    <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Nomor Perkara</div><div class="text-gray-900 font-bold">${escapeHtml(record.nomorPerkara)}</div></div>
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Jenis Perkara</div><div class="text-gray-900 font-bold">${escapeHtml(record.jenisPerkara)}</div></div>
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Pengadilan</div><div class="text-gray-900 font-bold">${escapeHtml(record.pengadilan) || '-'}</div></div>
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Wilayah</div><div class="text-gray-900 font-bold">${escapeHtml(record.wilayah) || '-'}</div></div>
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Pihak Penggugat</div><div class="text-gray-900 font-bold">${escapeHtml(record.pihakP) || '-'}</div></div>
      <div><div class="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Pihak Tergugat</div><div class="text-gray-900 font-bold">${escapeHtml(record.pihakT) || '-'}</div></div>
    </div>
  `;
}

// ====== MODAL: ARCHIVE / EDIT FORM ======
function openArsipFormModal(mode, record) {
  const isEdit = mode === 'edit';
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-300">
        <div class="bg-[#f5f5f5] px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center text-gray-800 font-bold"><span class="mr-2 text-xl">■</span>${isEdit ? 'Edit Arsip Perkara Selesai' : 'Arsip Perkara Selesai'}</div>
          <button data-close class="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form id="arsip-form">
          <div class="p-8 overflow-y-auto max-h-[70vh] space-y-6">
            ${informasiUmumHtml(record)}
            ${formField('kodeKlasifikasi', 'Kode Klasifikasi', record.kodeKlasifikasi)}
            ${formField('tahunSelesai', 'Tahun Selesai', record.tahunSelesai)}
            ${formField('tingkatPerkembangan', 'Tingkat Perkembangan', record.tingkatPerkembangan)}
            ${formField('jumlahBerkas', 'Jumlah Berkas', record.jumlahBerkas)}
            ${formField('lokasiSimpan', 'Lokasi Simpan (Gedung, Boks, Folder)', record.lokasiSimpan)}
            ${formTextArea('keterangan', 'Keterangan', record.keterangan)}
          </div>
          <div class="bg-[#f5f5f5] px-8 py-4 border-t border-gray-200 flex justify-between items-center">
            <div class="text-xs text-gray-600 italic">Input yang bertanda <span class="text-red-500 font-bold">*</span> harus diisi</div>
            <div class="space-x-3">
              <button type="button" data-close class="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300">Batal</button>
              <button type="submit" class="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);

  root.querySelector('#arsip-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      if (isEdit) {
        await apiPost('updateArsip', Object.assign({ id: record.id }, payload));
      } else {
        await apiPost('archive', Object.assign({ id: record.id }, payload));
      }
      closeModal();
      clearGlobalError();
      await Promise.all([fetchPerkara(), fetchArsip()]);
    } catch (err) {
      showGlobalError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  };
}

function formField(name, label, value) {
  return `
    <div class="grid grid-cols-[220px_1fr] items-center gap-6">
      <label class="text-sm font-bold text-gray-700 text-right">${escapeHtml(label)} <span class="text-red-500">*</span></label>
      <input required name="${name}" type="text" value="${escapeHtml(value)}"
        class="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm" />
    </div>
  `;
}

function formTextArea(name, label, value) {
  return `
    <div class="grid grid-cols-[220px_1fr] items-start gap-6">
      <label class="text-sm font-bold text-gray-700 text-right mt-2">${escapeHtml(label)} <span class="text-red-500">*</span></label>
      <textarea required name="${name}" class="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm min-h-[100px] shadow-sm resize-none">${escapeHtml(value)}</textarea>
    </div>
  `;
}

// ====== MODAL: VIEW DETAIL (+ borrowing history) ======
function openDetailModal(archive) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-300">
        <div class="bg-[#f5f5f5] px-6 py-3 border-b border-gray-200 flex justify-between items-center print:hidden">
          <div class="flex items-center text-gray-800 font-bold"><span class="mr-2 text-xl">■</span>Detail Arsip: ${escapeHtml(archive.nomorPerkara)}</div>
          <div class="flex items-center gap-3">
            <button data-print class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700">🖨 Cetak</button>
            <button data-close class="text-gray-500 hover:text-gray-700 border border-gray-300 p-1 rounded bg-white">✕</button>
          </div>
        </div>
        <div id="print-area" class="p-8 overflow-y-auto max-h-[80vh] space-y-6">
          ${informasiUmumHtml(archive)}
          <div class="grid grid-cols-2 gap-x-8 gap-y-4">
            ${detailField('Kode Klasifikasi', archive.kodeKlasifikasi)}
            ${detailField('Tahun Selesai', archive.tahunSelesai)}
            ${detailField('Tingkat Perkembangan', archive.tingkatPerkembangan)}
            ${detailField('Jumlah Berkas', archive.jumlahBerkas)}
            ${detailField('Lokasi Simpan', archive.lokasiSimpan)}
            <div class="border-b border-gray-100 pb-2">
              <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</div>
              <div class="text-sm font-medium text-gray-800">${statusBadge(archive.status)}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Keterangan</div>
              <div class="text-sm text-gray-800 italic whitespace-pre-wrap mt-1">${escapeHtml(archive.keterangan)}</div>
            </div>
          </div>
          <div class="mt-8">
            <h4 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-4">Riwayat Peminjaman</h4>
            <div class="overflow-hidden border border-gray-200 rounded">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Peminjam</th>
                    <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Tgl Pinjam</th>
                    <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Tgl Kembali</th>
                    <th class="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Keterangan</th>
                    <th class="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                  ${(archive.peminjaman && archive.peminjaman.length > 0) ? archive.peminjaman.map(p => `
                    <tr>
                      <td class="px-4 py-2 text-sm text-gray-800 font-medium">${escapeHtml(p.peminjam)}</td>
                      <td class="px-4 py-2 text-sm text-gray-800">${escapeHtml(p.tanggalPinjam)}</td>
                      <td class="px-4 py-2 text-sm text-gray-800">${escapeHtml(p.tanggalKembali) || '-'}</td>
                      <td class="px-4 py-2 text-sm text-gray-800">${escapeHtml(p.keterangan)}</td>
                      <td class="px-4 py-2 text-sm text-center print:hidden">
                        ${!p.tanggalKembali
                          ? `<button data-return-detail="${escapeHtml(p.id)}" class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded hover:bg-green-200 uppercase">Kembalikan</button>`
                          : `<span class="text-[10px] text-gray-400 font-bold uppercase italic">Selesai</span>`}
                      </td>
                    </tr>
                  `).join('') : `<tr><td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500 italic">Belum ada riwayat peminjaman.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="bg-[#f5f5f5] px-8 py-4 border-t border-gray-200 flex justify-end print:hidden">
          <button data-close class="px-6 py-2 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-700">Tutup</button>
        </div>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  root.querySelector('[data-print]').onclick = () => window.print();
  root.querySelectorAll('[data-return-detail]').forEach(b => {
    b.onclick = () => returnPeminjaman(archive.id, b.dataset.returnDetail);
  });
}

function detailField(label, value) {
  return `
    <div class="border-b border-gray-100 pb-2">
      <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">${escapeHtml(label)}</div>
      <div class="text-sm font-medium text-gray-800">${escapeHtml(value)}</div>
    </div>
  `;
}

// ====== MODAL: RECORD PEMINJAMAN (BORROW) ======
function openPinjamModal(archiveId) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden border border-gray-300">
        <div class="bg-[#f5f5f5] px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center text-gray-800 font-bold text-sm">📗 Rekam Peminjaman Arsip</div>
          <button data-close class="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form id="pinjam-form">
          <div class="p-8 space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700">Nama Peminjam <span class="text-red-500">*</span></label>
              <input required name="peminjam" type="text" placeholder="Nama Lengkap Peminjam"
                class="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700">Tanggal Pinjam <span class="text-red-500">*</span></label>
              <input required name="tanggalPinjam" type="date" value="${todayISO()}"
                class="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700">Keterangan / Keperluan <span class="text-red-500">*</span></label>
              <textarea required name="keterangan" placeholder="Tujuan peminjaman berkas"
                class="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm min-h-[100px] shadow-sm resize-none"></textarea>
            </div>
          </div>
          <div class="bg-[#f5f5f5] px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" data-close class="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300">Batal</button>
            <button type="submit" class="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">Rekam Peminjaman</button>
          </div>
        </form>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  root.querySelector('#pinjam-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      await apiPost('addPeminjaman', Object.assign({ arsipId: archiveId }, payload));
      closeModal();
      clearGlobalError();
      await fetchArsip();
    } catch (err) {
      showGlobalError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Rekam Peminjaman';
    }
  };
}

async function returnPeminjaman(archiveId, peminjamanId) {
  try {
    await apiPost('returnPeminjaman', { arsipId: archiveId, peminjamanId: peminjamanId });
    clearGlobalError();
    await fetchArsip();
    closeModal();
  } catch (err) {
    showGlobalError(err.message);
  }
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ====== INIT ======
function init() {
  if (!isConfigured()) {
    showGlobalError('Aplikasi belum terhubung ke Google Sheet. Tempel URL Web App Apps Script Anda ke dalam config.js (lihat README.md).');
    state.loadingPerkara = false;
    state.loadingArsip = false;
    renderPerkaraSection();
    renderArsipSection();
    return;
  }
  fetchPerkara();
  fetchArsip();
}

init();
