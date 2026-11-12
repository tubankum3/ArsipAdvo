import React from 'react';

export default function Navbar({ activeView, setActiveView }) {
  return (
    <nav className="bg-blue-700 shadow-md">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        <span className="text-white text-xl font-bold">Arsip Advokasi</span>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveView('peminjaman')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'peminjaman' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'}`}
          >
            Peminjaman
          </button>
          <button
            onClick={() => setActiveView('arsiparis')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'arsiparis' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'}`}
          >
            Arsiparis
          </button>
        </div>
      </div>
    </nav>
  );
}
