import React from 'react';

export default function DashboardStats({ arsip }) {
  const totalArsip = arsip.length;
  const dipinjam = arsip.filter(a => a.status === 'Dipinjam').length;
  const tersedia = totalArsip - dipinjam;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Total Arsip</div>
        <div className="text-4xl font-black text-blue-600">{totalArsip}</div>
      </div>
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Sedang Dipinjam</div>
        <div className="text-4xl font-black text-amber-500">{dipinjam}</div>
      </div>
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Tersedia</div>
        <div className="text-4xl font-black text-green-500">{tersedia}</div>
      </div>
    </div>
  );
}
