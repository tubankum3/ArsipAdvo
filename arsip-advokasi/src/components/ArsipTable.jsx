import React, { useState } from 'react';

export default function ArsipTable({ arsip, loading, onOpenModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = arsip.filter(a =>
    (a.nomorPerkara || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.jenisPerkara || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.kodeKlasifikasi || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedRows = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return <div className="flex justify-center py-10 text-gray-500 text-sm">Memuat data arsip...</div>;
  }

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 relative pt-2">
      <div className="absolute -top-4 left-6 bg-white px-3 py-1 text-gray-700 font-bold flex items-center text-sm border border-gray-200 rounded-t-md shadow-sm border-b-white">
        <span className="mr-2">🗂️</span><span>Daftar Arsip Perkara</span>
      </div>
      <div className="p-6">
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-5 pr-12 py-2.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-inner"
            placeholder="Cari berdasarkan Nomor Perkara, Klasifikasi, atau Jenis..."
          />
        </div>

        <div className="overflow-x-auto border-x border-t border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Klasifikasi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Nomor Perkara</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Jenis</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Lokasi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {paginatedRows.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500 italic">Belum ada data arsip terekam.</td></tr>
              ) : (
                paginatedRows.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-r text-gray-600">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-4 py-3 border-r text-gray-700">{a.kodeKlasifikasi}</td>
                    <td className="px-4 py-3 border-r font-medium text-gray-900">{a.nomorPerkara}</td>
                    <td className="px-4 py-3 border-r text-gray-700">{a.jenisPerkara}</td>
                    <td className="px-4 py-3 border-r text-gray-700">{a.lokasiSimpan}</td>
                    <td className="px-4 py-3 border-r">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button title="Lihat Detail" onClick={() => onOpenModal('detail', a)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">👁</button>
                        <button title="Cetak Resume" onClick={() => { onOpenModal('detail', a); setTimeout(() => window.print(), 300); }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">🖨</button>
                        <button title="Edit" onClick={() => onOpenModal('edit', a)} className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100">✏️</button>
                        {a.status !== 'Dipinjam' && (
                          <button title="Rekam Peminjaman" onClick={() => onOpenModal('borrow', a)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">📗</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Halaman {page} dari {totalPages} ({filtered.length} data)</span>
          <div className="space-x-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-40">&lsaquo;</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-40">&rsaquo;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
