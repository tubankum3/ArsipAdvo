import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Scale,
  Archive,
  BookOpen,
  Search,
  RefreshCw,
  Plus,
  Eye,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Settings,
  MapPin,
  Box,
  FileText,
  History,
  FolderArchive,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

/**
 * Ganti nilai di bawah ini dengan URL Web App Google Apps Script Anda
 * setelah melakukan Deploy -> New deployment -> Web app.
 * Atau atur langsung melalui tombol "Konfigurasi API" di aplikasi.
 */
const DEFAULT_GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
const STORAGE_KEY_URL = 'arsip_perkara_gas_url';
const ITEMS_PER_PAGE = 10;

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isConfiguredUrl(url) {
  return Boolean(
    url &&
      url.trim() !== '' &&
      url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' &&
      /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/i.test(url.trim())
  );
}

function StatusBadge({ status }) {
  const isBorrowed = status === 'Dipinjam' || status === 'Masih Dipinjam';
  if (isBorrowed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>{status}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span>{status || 'Terarsip'}</span>
    </span>
  );
}

function TableSkeleton({ cols = 6, rows = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-4 px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div key={cIdx} className="h-4 rounded bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function PaginationBar({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-600">
      <span className="tabular-nums">
        Menampilkan <strong className="font-semibold text-slate-900">{start}–{end}</strong> dari{' '}
        <strong className="font-semibold text-slate-900">{totalItems}</strong> data
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Sebelumnya</span>
        </button>
        <span className="px-2 font-mono text-xs tabular-nums text-slate-700">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Berikutnya</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, maxWidth = 'max-w-2xl', children }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  // ====== KONFIGURASI API ======
  const [gasUrl, setGasUrl] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    return saved || DEFAULT_GAS_URL;
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configInput, setConfigInput] = useState(gasUrl === DEFAULT_GAS_URL ? '' : gasUrl);

  // ====== STATE PERAN & NAVIGASI ======
  const [role, setRole] = useState('arsiparis'); // 'arsiparis' | 'peminjam'
  const [arsiparisTab, setArsiparisTab] = useState('perkara'); // 'perkara' | 'arsip' | 'peminjaman'
  const [searchQuery, setSearchQuery] = useState('');
  const [peminjamStatusFilter, setPeminjamStatusFilter] = useState('semua'); // 'semua' | 'Terarsip' | 'Dipinjam'
  const [page, setPage] = useState(1);

  // ====== STATE DATA ======
  const [perkaraList, setPerkaraList] = useState([]);
  const [arsipList, setArsipList] = useState([]);
  const [peminjamanList, setPeminjamanList] = useState([]);

  // ====== STATE LOADING & NOTIFIKASI ======
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // ====== STATE MODAL WORKFLOW ======
  const [showAddPerkaraModal, setShowAddPerkaraModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [borrowTarget, setBorrowTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

  // ====== FORM STATES ======
  const [perkaraForm, setPerkaraForm] = useState({
    nomorPerkara: '',
    jenisPerkara: 'Perdata Gugatan',
    tahunMasuk: String(new Date().getFullYear()),
    pengadilan: '',
    wilayah: '',
    pihakP: '',
    pihakT: '',
    statusPerkara: 'Putus'
  });

  const [archiveForm, setArchiveForm] = useState({
    kodeKlasifikasi: '',
    tahunSelesai: String(new Date().getFullYear()),
    kurunWaktu: '',
    uraianBerkas: '',
    jumlahBerkas: '1 Berkas',
    lokasiSimpan: '',
    boksFolder: ''
  });

  const [borrowForm, setBorrowForm] = useState({
    peminjam: '',
    tanggalPinjam: getTodayISO(),
    keterangan: ''
  });

  const [returnDate, setReturnDate] = useState(getTodayISO());

  const urlReady = isConfiguredUrl(gasUrl);

  const showToast = useCallback((type, text) => {
    setFeedback({ type, text });
  }, []);

  // Reset pagination when filters/tabs/roles change
  useEffect(() => {
    setPage(1);
  }, [role, arsiparisTab, searchQuery, peminjamStatusFilter]);

  // ====== FETCH DATA (GET) ======
  const fetchData = useCallback(
    async (targetUrl = gasUrl) => {
      if (!isConfiguredUrl(targetUrl)) {
        setPerkaraList([]);
        setArsipList([]);
        setPeminjamanList([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(targetUrl, { method: 'GET' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Gagal menghubungi Google Apps Script.`);
        }
        const json = await res.json();
        if (json.status !== 'success') {
          throw new Error(json.message || 'Respons backend tidak valid.');
        }
        setPerkaraList(Array.isArray(json.perkara) ? json.perkara : []);
        setArsipList(Array.isArray(json.arsip) ? json.arsip : []);
        setPeminjamanList(Array.isArray(json.peminjaman) ? json.peminjaman : []);
      } catch (err) {
        showToast('error', err.message || 'Gagal memuat data dari Google Sheets.');
      } finally {
        setLoading(false);
      }
    },
    [gasUrl, showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ====== POST ACTION (Content-Type: text/plain;charset=utf-8 untuk hindari CORS preflight) ======
  const postAction = async (action, data) => {
    if (!urlReady) {
      setShowConfigModal(true);
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    setSubmitting(true);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, data })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Permintaan ke server gagal.`);
      }

      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Operasi gagal dijalankan.');
      }

      await fetchData();
      return json;
    } finally {
      setSubmitting(false);
    }
  };

  // ====== MAPPING PEMINJAMAN AKTIF PER ARSIP ======
  const arsipMap = useMemo(() => {
    const map = {};
    arsipList.forEach((a) => {
      map[String(a.arsipID)] = a;
    });
    return map;
  }, [arsipList]);

  const activeBorrowByArsipId = useMemo(() => {
    const map = {};
    peminjamanList.forEach((p) => {
      if (!p.tanggalKembali) {
        map[String(p.arsipID)] = p;
      }
    });
    return map;
  }, [peminjamanList]);

  // ====== FILTERING PENCARIAN ======
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPerkara = useMemo(() => {
    if (!normalizedQuery) return perkaraList;
    return perkaraList.filter((item) =>
      [
        item.abstraksiID,
        item.nomorPerkara,
        item.jenisPerkara,
        item.tahunMasuk,
        item.pengadilan,
        item.wilayah,
        item.pihakP,
        item.pihakT,
        item.statusPerkara
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [perkaraList, normalizedQuery]);

  const filteredArsip = useMemo(() => {
    return arsipList.filter((item) => {
      if (role === 'peminjam' && peminjamStatusFilter !== 'semua') {
        if (item.status !== peminjamStatusFilter) return false;
      }
      if (!normalizedQuery) return true;
      return [
        item.arsipID,
        item.nomorPerkara,
        item.jenisPerkara,
        item.tahunMasuk,
        item.pengadilan,
        item.wilayah,
        item.pihakP,
        item.pihakT,
        item.kodeKlasifikasi,
        item.tahunSelesai,
        item.kurunWaktu,
        item.uraianBerkas,
        item.lokasiSimpan,
        item.boksFolder,
        item.status
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [arsipList, role, peminjamStatusFilter, normalizedQuery]);

  const filteredPeminjaman = useMemo(() => {
    const sorted = [...peminjamanList].reverse();
    if (!normalizedQuery) return sorted;
    return sorted.filter((item) => {
      const arsip = arsipMap[String(item.arsipID)];
      return [
        item.peminjamanID,
        item.arsipID,
        arsip ? arsip.nomorPerkara : '',
        item.peminjam,
        item.tanggalPinjam,
        item.tanggalKembali,
        item.keterangan
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [peminjamanList, arsipMap, normalizedQuery]);

  // ====== STATISTIK RINGKAS ======
  const stats = useMemo(() => {
    const terarsip = arsipList.filter((a) => a.status === 'Terarsip').length;
    const dipinjam = arsipList.filter((a) => a.status === 'Dipinjam').length;
    return {
      belumDiarsipkan: perkaraList.length,
      totalArsip: arsipList.length,
      tersedia: terarsip,
      dipinjam,
      totalPeminjaman: peminjamanList.length
    };
  }, [perkaraList, arsipList, peminjamanList]);

  // ====== HANDLERS ======
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const cleaned = configInput.trim();
    if (!isConfiguredUrl(cleaned)) {
      showToast('error', 'Format URL tidak valid. Pastikan berawalan https://script.google.com/macros/s/.../exec');
      return;
    }
    localStorage.setItem(STORAGE_KEY_URL, cleaned);
    setGasUrl(cleaned);
    setShowConfigModal(false);
    showToast('success', 'URL Web App Google Apps Script disimpan. Memuat data...');
    await fetchData(cleaned);
  };

  const handleAddPerkaraSubmit = async (e) => {
    e.preventDefault();
    try {
      await postAction('addPerkara', {
        ...perkaraForm,
        abstraksiID: 'PRK-' + Date.now()
      });
      setShowAddPerkaraModal(false);
      setPerkaraForm({
        nomorPerkara: '',
        jenisPerkara: 'Perdata Gugatan',
        tahunMasuk: String(new Date().getFullYear()),
        pengadilan: '',
        wilayah: '',
        pihakP: '',
        pihakT: '',
        statusPerkara: 'Putus'
      });
      showToast('success', 'Perkara baru berhasil ditambahkan ke daftar perkara.');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const openArchiveModal = (perkara) => {
    setArchiveTarget(perkara);
    setArchiveForm({
      kodeKlasifikasi: '',
      tahunSelesai: String(new Date().getFullYear()),
      kurunWaktu: `${perkara.tahunMasuk || new Date().getFullYear()} - ${new Date().getFullYear()}`,
      uraianBerkas: `${perkara.jenisPerkara || 'Perkara'} Nomor ${perkara.nomorPerkara || '-'}`,
      jumlahBerkas: '1 Berkas',
      lokasiSimpan: '',
      boksFolder: ''
    });
  };

  const handleArchiveSubmit = async (e) => {
    e.preventDefault();
    if (!archiveTarget) return;
    try {
      await postAction('arsipkanPerkara', {
        abstraksiID: archiveTarget.abstraksiID,
        nomorPerkara: archiveTarget.nomorPerkara,
        jenisPerkara: archiveTarget.jenisPerkara,
        tahunMasuk: archiveTarget.tahunMasuk,
        pengadilan: archiveTarget.pengadilan,
        wilayah: archiveTarget.wilayah,
        pihakP: archiveTarget.pihakP,
        pihakT: archiveTarget.pihakT,
        ...archiveForm
      });
      setArchiveTarget(null);
      showToast('success', `Perkara ${archiveTarget.nomorPerkara} berhasil dipindahkan ke ArsipPerkara.`);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const openBorrowModal = (arsip) => {
    setBorrowTarget(arsip);
    setBorrowForm({
      peminjam: '',
      tanggalPinjam: getTodayISO(),
      keterangan: ''
    });
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowTarget) return;
    try {
      await postAction('pinjamArsip', {
        arsipID: borrowTarget.arsipID,
        peminjam: borrowForm.peminjam,
        tanggalPinjam: borrowForm.tanggalPinjam,
        keterangan: borrowForm.keterangan
      });
      setBorrowTarget(null);
      showToast('success', `Berkas ${borrowTarget.nomorPerkara} berhasil dipinjam oleh ${borrowForm.peminjam}.`);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const openReturnModal = (arsip) => {
    setReturnTarget(arsip);
    setReturnDate(getTodayISO());
  };

  const handleReturnConfirm = async (e) => {
    e.preventDefault();
    if (!returnTarget) return;
    const activeLoan = activeBorrowByArsipId[String(returnTarget.arsipID)];
    try {
      await postAction('kembalikanArsip', {
        arsipID: returnTarget.arsipID,
        peminjamanID: activeLoan ? activeLoan.peminjamanID : '',
        tanggalKembali: returnDate
      });
      setReturnTarget(null);
      showToast('success', `Berkas ${returnTarget.nomorPerkara} telah dikembalikan dan berstatus Terarsip.`);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // ====== PAGINATED DATA ======
  const activeDataset =
    role === 'peminjam'
      ? filteredArsip
      : arsiparisTab === 'perkara'
      ? filteredPerkara
      : arsiparisTab === 'arsip'
      ? filteredArsip
      : filteredPeminjaman;

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return activeDataset.slice(start, start + ITEMS_PER_PAGE);
  }, [activeDataset, page]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* TOP BAR (3-Zone Clean Contract) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:gap-8">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Scale className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900">
              Arsip Perkara
            </span>
          </div>

          {/* Zone 2: Role Switcher */}
          <nav aria-label="Pilih Peran Pengguna" className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRole('arsiparis')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                role === 'arsiparis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderArchive className="h-3.5 w-3.5" />
              <span>Arsiparis</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('peminjam')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                role === 'peminjam'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Peminjam</span>
            </button>
          </nav>

          {/* Zone 3: Refresh & Konfigurasi */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setConfigInput(gasUrl === DEFAULT_GAS_URL ? '' : gasUrl);
                setShowConfigModal(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              title="Konfigurasi URL Google Apps Script"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">URL API</span>
            </button>
            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading || !urlReady}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* SETUP BANNER WHEN GAS URL NOT CONFIGURED */}
        {!urlReady && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="text-sm text-amber-950">
                <p className="font-semibold">Backend Google Apps Script belum terhubung</p>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  Deploy <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">Code.gs</code> sebagai Web App, lalu masukkan URL eksekusinya melalui tombol konfigurasi untuk mulai membaca dan menulis data ke Google Sheets.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfigInput('');
                setShowConfigModal(true);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-amber-800 whitespace-nowrap shrink-0"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Hubungkan URL GAS</span>
            </button>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded p-1 opacity-70 hover:opacity-100"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* PAGE HEADER + PRIMARY ACTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {role === 'arsiparis' ? 'Ruang Kerja Arsiparis' : 'Ruang Kerja Peminjam'}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {role === 'arsiparis'
                ? 'Manajemen Arsip Perkara Pengadilan'
                : 'Katalog & Sirkulasi Peminjaman Arsip'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {role === 'arsiparis'
                ? 'Kelola perkara belum diarsipkan, arsip perkara aktif, serta log riwayat peminjaman berkas.'
                : 'Telusuri ketersediaan berkas arsip perkara, lihat lokasi penyimpanan, pinjam, atau kembalikan berkas.'}
            </p>
          </div>

          {role === 'arsiparis' && arsiparisTab === 'perkara' && (
            <button
              type="button"
              onClick={() => setShowAddPerkaraModal(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Perkara</span>
            </button>
          )}
        </div>

        {/* METRIC SUMMARY STRIP (Flat hairline divided grid, tabular numerals) */}
        <section
          aria-label="Ringkasan Data Arsip"
          className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Belum Diarsipkan</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {stats.belumDiarsipkan}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Total Berkas Arsip</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {stats.totalArsip}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Tersedia (Terarsip)</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
              {stats.tersedia}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Sedang Dipinjam</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-700">
              {stats.dipinjam}
            </p>
          </div>
        </section>

        {/* WORKSPACE PANEL: TABS + SEARCH + TABLE */}
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            {role === 'arsiparis' ? (
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setArsiparisTab('perkara')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    arsiparisTab === 'perkara'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Perkara</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    ({filteredPerkara.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setArsiparisTab('arsip')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    arsiparisTab === 'arsip'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Arsip Perkara</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    ({filteredArsip.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setArsiparisTab('peminjaman')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    arsiparisTab === 'peminjaman'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Peminjaman</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    ({filteredPeminjaman.length})
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
                {[
                  { id: 'semua', label: 'Semua Berkas' },
                  { id: 'Terarsip', label: 'Terarsip (Tersedia)' },
                  { id: 'Dipinjam', label: 'Sedang Dipinjam' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeminjamStatusFilter(opt.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      peminjamStatusFilter === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor perkara, pihak, lokasi, klasifikasi..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* DATA TABLE AREA */}
          {loading ? (
            <TableSkeleton cols={6} rows={6} />
          ) : activeDataset.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <Archive className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {searchQuery
                  ? 'Tidak ada data yang cocok dengan pencarian'
                  : 'Belum ada data tersedia'}
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                {!urlReady
                  ? 'Hubungkan URL Web App Google Apps Script terlebih dahulu untuk menampilkan data dari Google Sheets.'
                  : searchQuery
                  ? 'Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh data.'
                  : role === 'arsiparis' && arsiparisTab === 'perkara'
                  ? 'Tambahkan data perkara baru menggunakan tombol Tambah Perkara untuk memulai proses pengarsipan.'
                  : 'Data akan muncul secara otomatis setelah dicatat pada Google Sheets.'}
              </p>
              {role === 'arsiparis' && arsiparisTab === 'perkara' && urlReady && !searchQuery && (
                <button
                  type="button"
                  onClick={() => setShowAddPerkaraModal(true)}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Perkara Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* TAB 1: ARSIPARIS -> PERKARA BELUM DIARSIPKAN */}
              {role === 'arsiparis' && arsiparisTab === 'perkara' && (
                <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">ID & Nomor Perkara</th>
                      <th className="px-4 py-3">Jenis & Tahun</th>
                      <th className="px-4 py-3">Pengadilan & Wilayah</th>
                      <th className="px-4 py-3">Penggugat / Pemohon (P)</th>
                      <th className="px-4 py-3">Tergugat / Termohon (T)</th>
                      <th className="px-4 py-3">Status Perkara</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, idx) => (
                      <tr key={`perkara-${row.abstraksiID || 'row'}-${(page - 1) * ITEMS_PER_PAGE + idx}`} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 align-top">
                          <div className="font-semibold text-slate-900 tabular-nums">{row.nomorPerkara}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">{row.abstraksiID}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-slate-800">{row.jenisPerkara}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">Masuk {row.tahunMasuk}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-slate-800">{row.pengadilan}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{row.wilayah}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-700">{row.pihakP || '-'}</td>
                        <td className="px-4 py-3.5 align-top text-slate-700">{row.pihakT || '-'}</td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {row.statusPerkara || 'Putus'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <button
                            type="button"
                            onClick={() => openArchiveModal(row)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Arsipkan</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB 2: ARSIPARIS -> ARSIP PERKARA */}
              {role === 'arsiparis' && arsiparisTab === 'arsip' && (
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Arsip ID & Nomor Perkara</th>
                      <th className="px-4 py-3">Klasifikasi & Selesai</th>
                      <th className="px-4 py-3">Pengadilan / Pihak</th>
                      <th className="px-4 py-3">Lokasi & Boks</th>
                      <th className="px-4 py-3">Jumlah</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, idx) => (
                      <tr key={`arsip-${row.arsipID || 'row'}-${(page - 1) * ITEMS_PER_PAGE + idx}`} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 align-top">
                          <div className="font-semibold text-slate-900 tabular-nums">{row.nomorPerkara}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">{row.arsipID}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-mono text-xs font-medium text-slate-900">{row.kodeKlasifikasi || '-'}</div>
                          <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                            {row.jenisPerkara} · Selesai {row.tahunSelesai}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-slate-800">{row.pengadilan}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {row.pihakP} vs {row.pihakT}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-slate-800">{row.lokasiSimpan || '-'}</div>
                          <div className="mt-0.5 font-mono text-xs text-slate-500">Boks: {row.boksFolder || '-'}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-700 tabular-nums">{row.jumlahBerkas || '-'}</td>
                        <td className="px-4 py-3.5 align-top">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <button
                            type="button"
                            onClick={() => setDetailTarget(row)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB 3: ARSIPARIS -> LOG RIWAYAT PEMINJAMAN */}
              {role === 'arsiparis' && arsiparisTab === 'peminjaman' && (
                <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">ID Peminjaman</th>
                      <th className="px-4 py-3">Arsip ID & Perkara</th>
                      <th className="px-4 py-3">Peminjam</th>
                      <th className="px-4 py-3">Tanggal Pinjam</th>
                      <th className="px-4 py-3">Tanggal Kembali</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, idx) => {
                      const arsip = arsipMap[String(row.arsipID)];
                      const returned = Boolean(row.tanggalKembali);
                      return (
                        <tr key={`pjm-${row.peminjamanID || 'row'}-${(page - 1) * ITEMS_PER_PAGE + idx}`} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-5 py-3.5 align-top font-mono text-xs font-medium text-slate-900 tabular-nums">
                            {row.peminjamanID}
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                              {row.arsipID}
                            </div>
                            {arsip && (
                              <div className="mt-0.5 text-xs text-slate-500 tabular-nums">{arsip.nomorPerkara}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 align-top font-medium text-slate-800">{row.peminjam}</td>
                          <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-700 tabular-nums">
                            {row.tanggalPinjam || '-'}
                          </td>
                          <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-700 tabular-nums">
                            {row.tanggalKembali || '—'}
                          </td>
                          <td className="px-4 py-3.5 align-top text-slate-600">{row.keterangan || '-'}</td>
                          <td className="px-5 py-3.5 align-top text-right">
                            <StatusBadge status={returned ? 'Sudah Dikembalikan' : 'Masih Dipinjam'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* PERAN PEMINJAM: KATALOG BERKAS ARSIP */}
              {role === 'peminjam' && (
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Arsip ID & Nomor Perkara</th>
                      <th className="px-4 py-3">Jenis & Klasifikasi</th>
                      <th className="px-4 py-3">Para Pihak</th>
                      <th className="px-4 py-3">Lokasi Simpan & Boks</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, idx) => {
                      const activeBorrow = activeBorrowByArsipId[String(row.arsipID)];
                      const isDipinjam = row.status === 'Dipinjam';
                      return (
                        <tr key={`catalog-${row.arsipID || 'row'}-${(page - 1) * ITEMS_PER_PAGE + idx}`} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-5 py-3.5 align-top">
                            <div className="font-semibold text-slate-900 tabular-nums">{row.nomorPerkara}</div>
                            <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">{row.arsipID}</div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="text-slate-800">{row.jenisPerkara}</div>
                            <div className="mt-0.5 font-mono text-xs text-slate-500">
                              {row.kodeKlasifikasi || '-'} · {row.kurunWaktu || row.tahunSelesai}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="text-slate-700">{row.pihakP || '-'}</div>
                            <div className="mt-0.5 text-xs text-slate-500">vs {row.pihakT || '-'}</div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="text-slate-800">{row.lokasiSimpan || '-'}</div>
                            <div className="mt-0.5 font-mono text-xs text-slate-500">Boks: {row.boksFolder || '-'}</div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <StatusBadge status={row.status} />
                            {isDipinjam && activeBorrow && (
                              <div className="mt-1 text-xs text-slate-500">
                                Oleh: {activeBorrow.peminjam}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 align-top text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailTarget(row)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                                <span>Lihat Detail</span>
                              </button>
                              {isDipinjam ? (
                                <button
                                  type="button"
                                  onClick={() => openReturnModal(row)}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 whitespace-nowrap"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Kembalikan</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openBorrowModal(row)}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                                >
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  <span>Pinjam</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <PaginationBar
            currentPage={page}
            totalItems={activeDataset.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Sistem Manajemen Arsip & Peminjaman Perkara Pengadilan
      </footer>

      {/* ====== MODAL 1: KONFIGURASI URL GAS ====== */}
      {showConfigModal && (
        <ModalShell
          title="Konfigurasi URL Web App Google Apps Script"
          subtitle="Hubungkan frontend React ini ke URL eksekusi (/exec) dari Google Apps Script Anda."
          maxWidth="max-w-lg"
          onClose={() => setShowConfigModal(false)}
        >
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Web App GAS
              </label>
              <input
                type="url"
                required
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Pastikan Web App di-deploy dengan opsi <strong>Execute as: Me</strong> dan{' '}
                <strong>Who has access: Anyone</strong>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Simpan & Muat Data
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ====== MODAL 2: TAMBAH PERKARA BARU ====== */}
      {showAddPerkaraModal && (
        <ModalShell
          title="Tambah Data Perkara Baru"
          subtitle="Data perkara akan masuk ke sheet Perkara dan siap untuk proses pengarsipan."
          onClose={() => !submitting && setShowAddPerkaraModal(false)}
        >
          <form onSubmit={handleAddPerkaraSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Perkara *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.nomorPerkara}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, nomorPerkara: e.target.value })}
                  placeholder="Contoh: 124/Pdt.G/2025/PN Tbn"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Perkara *
                </label>
                <select
                  value={perkaraForm.jenisPerkara}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, jenisPerkara: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="Perdata Gugatan">Perdata Gugatan</option>
                  <option value="Perdata Permohonan">Perdata Permohonan</option>
                  <option value="Pidana Biasa">Pidana Biasa</option>
                  <option value="Pidana Singkat">Pidana Singkat</option>
                  <option value="PHI / Niaga">PHI / Niaga</option>
                  <option value="TUN">Tata Usaha Negara</option>
                  <option value="Agama">Perkara Agama</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Masuk *
                </label>
                <input
                  type="number"
                  required
                  min="1950"
                  max="2100"
                  value={perkaraForm.tahunMasuk}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, tahunMasuk: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Perkara *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.statusPerkara}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, statusPerkara: e.target.value })}
                  placeholder="Putus / Minutasi / BHT"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pengadilan *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.pengadilan}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, pengadilan: e.target.value })}
                  placeholder="Contoh: Pengadilan Negeri Tuban"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilayah *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.wilayah}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, wilayah: e.target.value })}
                  placeholder="Contoh: Jawa Timur"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pihak Penggugat / Pemohon (P) *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.pihakP}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, pihakP: e.target.value })}
                  placeholder="Nama penggugat / pemohon"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pihak Tergugat / Termohon (T) *
                </label>
                <input
                  type="text"
                  required
                  value={perkaraForm.pihakT}
                  onChange={(e) => setPerkaraForm({ ...perkaraForm, pihakT: e.target.value })}
                  placeholder="Nama tergugat / termohon"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAddPerkaraModal(false)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Perkara'}</span>
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ====== MODAL 3: WORKFLOW PENGARSIPAN PERKARA ====== */}
      {archiveTarget && (
        <ModalShell
          title="Arsipkan Berkas Perkara"
          subtitle="Data perkara akan dipindahkan dari sheet Perkara ke ArsipPerkara dengan status Terarsip."
          onClose={() => !submitting && setArchiveTarget(null)}
        >
          <form onSubmit={handleArchiveSubmit} className="space-y-5">
            {/* Ringkasan data awal otomatis terisi */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Data Awal Perkara (Otomatis Terisi)</p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Nomor Perkara: </span>
                  <span className="font-semibold text-slate-900 tabular-nums">{archiveTarget.nomorPerkara}</span>
                </div>
                <div>
                  <span className="text-slate-500">Jenis & Tahun: </span>
                  <span className="font-medium text-slate-900">
                    {archiveTarget.jenisPerkara} ({archiveTarget.tahunMasuk})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Pengadilan: </span>
                  <span className="font-medium text-slate-900">
                    {archiveTarget.pengadilan} · {archiveTarget.wilayah}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Para Pihak: </span>
                  <span className="font-medium text-slate-900">
                    {archiveTarget.pihakP} vs {archiveTarget.pihakT}
                  </span>
                </div>
              </div>
            </div>

            {/* Field Kearsipan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Klasifikasi *
                </label>
                <input
                  type="text"
                  required
                  value={archiveForm.kodeKlasifikasi}
                  onChange={(e) => setArchiveForm({ ...archiveForm, kodeKlasifikasi: e.target.value })}
                  placeholder="Contoh: HK.02 / 01.03"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Selesai *
                </label>
                <input
                  type="number"
                  required
                  min="1950"
                  max="2100"
                  value={archiveForm.tahunSelesai}
                  onChange={(e) => setArchiveForm({ ...archiveForm, tahunSelesai: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kurun Waktu *
                </label>
                <input
                  type="text"
                  required
                  value={archiveForm.kurunWaktu}
                  onChange={(e) => setArchiveForm({ ...archiveForm, kurunWaktu: e.target.value })}
                  placeholder="Contoh: 2024 - 2025"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Berkas *
                </label>
                <input
                  type="text"
                  required
                  value={archiveForm.jumlahBerkas}
                  onChange={(e) => setArchiveForm({ ...archiveForm, jumlahBerkas: e.target.value })}
                  placeholder="Contoh: 2 Bundel / 1 Berkas"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Simpan *
                </label>
                <input
                  type="text"
                  required
                  value={archiveForm.lokasiSimpan}
                  onChange={(e) => setArchiveForm({ ...archiveForm, lokasiSimpan: e.target.value })}
                  placeholder="Contoh: Ruang Arsip Lt. 2 - Rak B3"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boks / Folder *
                </label>
                <input
                  type="text"
                  required
                  value={archiveForm.boksFolder}
                  onChange={(e) => setArchiveForm({ ...archiveForm, boksFolder: e.target.value })}
                  placeholder="Contoh: BOKS-12 / FOLDER-04"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Berkas *
                </label>
                <textarea
                  rows={3}
                  required
                  value={archiveForm.uraianBerkas}
                  onChange={(e) => setArchiveForm({ ...archiveForm, uraianBerkas: e.target.value })}
                  placeholder="Ringkasan isi berkas, putusan, dan lampiran arsip..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setArchiveTarget(null)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Memindahkan...' : 'Simpan & Arsipkan'}</span>
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ====== MODAL 4: DETAIL ARSIP PERKARA ====== */}
      {detailTarget && (
        <ModalShell
          title={`Detail Arsip: ${detailTarget.nomorPerkara}`}
          subtitle={`Arsip ID: ${detailTarget.arsipID}`}
          onClose={() => setDetailTarget(null)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <strong className="font-semibold text-slate-900">{detailTarget.lokasiSimpan || '-'}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Box className="h-3.5 w-3.5 text-slate-400" />
                  <span>{detailTarget.boksFolder || '-'}</span>
                </span>
              </div>
              <StatusBadge status={detailTarget.status} />
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Arsip ID</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-slate-900 tabular-nums">{detailTarget.arsipID}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nomor Perkara</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">{detailTarget.nomorPerkara}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Jenis Perkara</dt>
                <dd className="mt-0.5 text-slate-900">{detailTarget.jenisPerkara || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kode Klasifikasi</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-slate-900">{detailTarget.kodeKlasifikasi || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pengadilan</dt>
                <dd className="mt-0.5 text-slate-900">{detailTarget.pengadilan || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Wilayah</dt>
                <dd className="mt-0.5 text-slate-900">{detailTarget.wilayah || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pihak Penggugat / Pemohon (P)</dt>
                <dd className="mt-0.5 text-slate-900">{detailTarget.pihakP || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pihak Tergugat / Termohon (T)</dt>
                <dd className="mt-0.5 text-slate-900">{detailTarget.pihakT || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Tahun Masuk / Tahun Selesai</dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-900 tabular-nums">
                  {detailTarget.tahunMasuk || '-'} / {detailTarget.tahunSelesai || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kurun Waktu</dt>
                <dd className="mt-0.5 text-slate-900 tabular-nums">{detailTarget.kurunWaktu || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Jumlah Berkas</dt>
                <dd className="mt-0.5 text-slate-900 tabular-nums">{detailTarget.jumlahBerkas || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Lokasi Simpan & Boks/Folder</dt>
                <dd className="mt-0.5 text-slate-900">
                  {detailTarget.lokasiSimpan || '-'} ({detailTarget.boksFolder || '-'})
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Uraian Berkas</dt>
                <dd className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 leading-relaxed">
                  {detailTarget.uraianBerkas || 'Tidak ada uraian tambahan.'}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="h-9 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ====== MODAL 5: PINJAM ARSIP ====== */}
      {borrowTarget && (
        <ModalShell
          title="Form Peminjaman Berkas Arsip"
          subtitle={`${borrowTarget.nomorPerkara} · ${borrowTarget.arsipID}`}
          maxWidth="max-w-lg"
          onClose={() => !submitting && setBorrowTarget(null)}
        >
          <form onSubmit={handleBorrowSubmit} className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              Lokasi penyimpanan: <strong className="text-slate-900">{borrowTarget.lokasiSimpan}</strong> · Boks:{' '}
              <strong className="font-mono text-slate-900">{borrowTarget.boksFolder}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Peminjam *
              </label>
              <input
                type="text"
                required
                value={borrowForm.peminjam}
                onChange={(e) => setBorrowForm({ ...borrowForm, peminjam: e.target.value })}
                placeholder="Contoh: Budi Santoso, S.H. (Panitera Pengganti)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pinjam *
              </label>
              <input
                type="date"
                required
                value={borrowForm.tanggalPinjam}
                onChange={(e) => setBorrowForm({ ...borrowForm, tanggalPinjam: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Keperluan
              </label>
              <textarea
                rows={2}
                value={borrowForm.keterangan}
                onChange={(e) => setBorrowForm({ ...borrowForm, keterangan: e.target.value })}
                placeholder="Contoh: Pemeriksaan berkas banding / permohonan salinan putusan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setBorrowTarget(null)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Mencatat...' : 'Catat Peminjaman'}</span>
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ====== MODAL 6: KONFIRMASI PENGEMBALIAN ARSIP ====== */}
      {returnTarget && (
        <ModalShell
          title="Konfirmasi Pengembalian Berkas"
          subtitle={`${returnTarget.nomorPerkara} · ${returnTarget.arsipID}`}
          maxWidth="max-w-md"
          onClose={() => !submitting && setReturnTarget(null)}
        >
          <form onSubmit={handleReturnConfirm} className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              Apakah Anda yakin ingin menandai berkas perkara ini sudah dikembalikan ke ruang arsip?
            </p>

            {activeBorrowByArsipId[String(returnTarget.arsipID)] && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Peminjam Aktif: </span>
                  <strong className="text-slate-900">
                    {activeBorrowByArsipId[String(returnTarget.arsipID)].peminjam}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Tanggal Pinjam: </span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {activeBorrowByArsipId[String(returnTarget.arsipID)].tanggalPinjam}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengembalian *
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setReturnTarget(null)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submitting ? 'Memproses...' : 'Konfirmasi Kembalikan'}</span>
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
