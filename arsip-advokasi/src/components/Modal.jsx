import React, { useState } from 'react';

export default function Modal({ modalData, onClose, onSubmit }) {
  const { type, record } = modalData;
  const [formData, setFormData] = useState({
    kodeKlasifikasi: record?.kodeKlasifikasi || '',
    tahunSelesai: record?.tahunSelesai || '',
    tingkatPerkembangan: record?.tingkatPerkembangan || '',
    jumlahBerkas: record?.jumlahBerkas || '',
    lokasiSimpan: record?.lokasiSimpan || '',
    keterangan: record?.keterangan || '',
    peminjam: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'archive' || type === 'edit') {
      onSubmit(type === 'edit' ? 'updateArsip' : 'archive', { id: record.id, ...record, ...formData });
    } else if (type === 'borrow') {
      onSubmit('addPeminjaman', { arsipId: record.id, ...formData });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-300">
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-gray-800">
            {type === 'archive' && 'Arsip Perkara Selesai'}
            {type === 'edit' && 'Edit Arsip Perkara'}
            {type === 'borrow' && 'Rekam Peminjaman Arsip'}
            {type === 'detail' && `Detail Arsip: ${record.nomorPerkara}`}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {type === 'detail' ? (
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded grid grid-cols-2 gap-2">
                <div><b>Nomor Perkara:</b> {record.nomorPerkara}</div>
                <div><b>Jenis:</b> {record.jenisPerkara}</div>
                <div><b>Lokasi:</b> {record.lokasiSimpan}</div>
                <div><b>Status:</b> {record.status}</div>
              </div>
              <h4 className="font-bold mt-4">Riwayat Peminjaman</h4>
              <table className="min-w-full border text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border">Peminjam</th>
                    <th className="p-2 border">Tgl Pinjam</th>
                    <th className="p-2 border">Tgl Kembali</th>
                    <th className="p-2 border">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {record.peminjaman?.length > 0 ? record.peminjaman.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{p.peminjam}</td>
                      <td className="p-2 border">{p.tanggalPinjam}</td>
                      <td className="p-2 border">{p.tanggalKembali || '-'}</td>
                      <td className="p-2 border">{p.keterangan}</td>
                    </tr>
                  )) : <tr><td colSpan="4" className="p-3 text-center italic text-gray-500">Belum ada riwayat.</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="modal-form" className="space-y-4 text-sm">
              {type === 'borrow' ? (
                <>
                  <div>
                    <label className="font-bold block mb-1">Nama Peminjam *</label>
                    <input required name="peminjam" value={formData.peminjam} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Tanggal Pinjam *</label>
                    <input required type="date" name="tanggalPinjam" value={formData.tanggalPinjam} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Keperluan *</label>
                    <textarea required name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Tujuan peminjaman" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-bold block mb-1">Kode Klasifikasi *</label>
                    <input required name="kodeKlasifikasi" value={formData.kodeKlasifikasi} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Tahun Selesai *</label>
                    <input required name="tahunSelesai" value={formData.tahunSelesai} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Tingkat Perkembangan *</label>
                    <input required name="tingkatPerkembangan" value={formData.tingkatPerkembangan} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Jumlah Berkas *</label>
                    <input required name="jumlahBerkas" value={formData.jumlahBerkas} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Lokasi Simpan *</label>
                    <input required name="lokasiSimpan" value={formData.lokasiSimpan} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Keterangan *</label>
                    <textarea required name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        <div className="bg-gray-100 px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm font-bold">Tutup</button>
          {type !== 'detail' && (
            <button type="submit" form="modal-form" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">Simpan</button>
          )}
        </div>
      </div>
    </div>
  );
}
