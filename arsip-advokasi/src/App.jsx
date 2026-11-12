import React, { useState, useEffect } from 'react';
import { CONFIG } from './config';
import Navbar from './components/components/Navbar';
import DashboardStats from './components/DashboardStats';
import PerkaraTable from './components/PerkaraTable';
import ArsipTable from './components/ArsipTable';
import PeminjamanTable from './components/PeminjamanTable';
import Modal from './components/Modal';

export default function App() {
  const [activeView, setActiveView] = useState('peminjaman');
  const [arsiparisTab, setArsiparisTab] = useState('perkara');
  const [perkara, setPerkara] = useState([]);
  const [arsip, setArsip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null); // { type, record }

  const fetchData = async (force = false) => {
    const cached = localStorage.getItem('arsip_cache_data');
    if (cached && !force) {
      try {
        const parsed = JSON.parse(cached);
        setPerkara(parsed.perkara || []);
        setArsip(parsed.arsip || []);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getData`);
      const json = await res.json();
      if (json.status === 'success') {
        setPerkara(json.perkara || []);
        setArsip(json.arsip || []);
        localStorage.setItem('arsip_cache_data', JSON.stringify({
          perkara: json.perkara || [],
          arsip: json.arsip || []
        }));
      } else {
        throw new Error(json.message || 'Gagal memuat data dari server.');
      }
    } catch (err) {
      if (!cached) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePost = async (action, payload) => {
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload })
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      localStorage.removeItem('arsip_cache_data');
      await fetchData(true);
      setModalData(null);
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <Navbar activeView={activeView} setActiveView={setActiveView} />

      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-4">
            {error}
          </div>
        )}

        {activeView === 'peminjaman' ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Peminjaman Arsip</h1>
              <p className="text-gray-600 mt-1">Pengelolaan dan pemantauan status peminjaman arsip perkara.</p>
              <div className="border-b-4 border-blue-600 w-16 mt-4"></div>
            </div>

            <DashboardStats arsip={arsip} />
            <PeminjamanTable arsip={arsip} loading={loading} onOpenModal={(type, record) => setModalData({ type, record })} />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Manajemen Arsip</h1>
              <p className="text-gray-600 mt-1">Perekaman dan pengelolaan data arsip perkara.</p>
              <div className="border-b-4 border-blue-600 w-16 mt-4"></div>
            </div>

            <div className="border-b border-gray-200 flex space-x-8">
              <button
                onClick={() => setArsiparisTab('perkara')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${arsiparisTab === 'perkara' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Daftar Perkara
              </button>
              <button
                onClick={() => setArsiparisTab('arsip')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${arsiparisTab === 'arsip' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Daftar Arsip
              </button>
            </div>

            {arsiparisTab === 'perkara' ? (
              <PerkaraTable perkara={perkara} loading={loading} onOpenModal={(type, record) => setModalData({ type, record })} />
            ) : (
              <ArsipTable arsip={arsip} loading={loading} onOpenModal={(type, record) => setModalData({ type, record })} />
            )}
          </div>
        )}
      </main>

      {modalData && (
        <Modal modalData={modalData} onClose={() => setModalData(null)} onSubmit={handlePost} />
      )}
    </div>
  );
}
