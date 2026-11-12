import React, { useState } from 'react';

export default function PerkaraTable({ perkara, loading, onOpenModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = perkara.filter(p =>
    (p.nomorPerkara || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.jenisPerkara || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedRows = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return <div className="flex justify-center py-10 text-gray-500 text-sm">Memuat data perkara...</div>;
  }

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 relative pt-2">
      <div className="absolute -top-4 left-6 bg-white px-3 py-1 text-gray-700 font-bold flex items-center text-sm border border-gray-200 rounded-t-md shadow-sm border-b-white">
        <span className="mr-2">📄</span><span>Daftar Perkara</span>
      </div>
      <div className="p-6">
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-5 pr-12 py-2.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-inner"
            placeholder="Cari berdasarkan Nomor Perkara atau Jenis..."
          />
        </div>

        <div className="overflow-x-auto border-x border-t border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase w-16 border-r">No</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Nomor Perkara</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Jenis Perkara</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r">Tahun Masuk</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {paginatedRows.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-500 italic">Tidak ada perkara selesai ditemukan.</td></tr>
              ) : (
                paginatedRows.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-gray-50">
                    <td className="px-5 py-3 border-r text-gray-600">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-5 py-3 border-r font-medium text-gray-900">{p.nomorPerkara}</td>
                    <td className="px-5 py-3 border-r text-gray-700">{p.jenisPerkara}</td>
                    <td className="px-5 py-3 border-r text-gray-700">{p.tahunMasuk}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => onOpenModal('archive', p)}
                        className="px-3 py-1 bg-cyan-500 text-white rounded text-xs font-bold hover:bg-cyan-600 transition-colors shadow-sm"
                      >
                        Arsipkan
                      </button>
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
