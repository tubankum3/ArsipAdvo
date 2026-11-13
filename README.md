# Sistem Manajemen Arsip & Peminjaman Perkara Pengadilan

Hosting URL: https://tubankum3.github.io/ArsipAdvo/

Aplikasi web manajemen arsip perkara pengadilan menggunakan **React.js (Vite + Tailwind CSS + Lucide Icons)** sebagai frontend dan **Google Apps Script (GAS) + Google Sheets** sebagai backend.

## Struktur Spreadsheet

1. **Perkara**: `abstraksiID`, `nomorPerkara`, `jenisPerkara`, `tahunMasuk`, `pengadilan`, `wilayah`, `pihakP`, `pihakT`, `statusPerkara`
2. **ArsipPerkara**: `arsipID`, `nomorPerkara`, `jenisPerkara`, `tahunMasuk`, `pengadilan`, `wilayah`, `pihakP`, `pihakT`, `kodeKlasifikasi`, `tahunSelesai`, `kurunWaktu`, `uraianBerkas`, `jumlahBerkas`, `lokasiSimpan`, `boksFolder`, `status`
3. **Peminjaman**: `peminjamanID`, `arsipID`, `peminjam`, `tanggalPinjam`, `tanggalKembali`, `keterangan`

## Panduan Deployment

### 1. Backend Google Apps Script (`Code.gs`)

1. Buat Google Spreadsheet baru di Google Drive.
2. Buka menu **Extensions > Apps Script**.
3. Hapus kode bawaan dan tempel seluruh isi file `Code.gs`.
4. Simpan proyek, pilih fungsi **`setupSheets`** di toolbar, lalu klik **Run** dan setujui izin akses (Authorize). Langkah ini akan membuat 3 sheet beserta header kolomnya secara otomatis.
5. Klik **Deploy > New deployment**.
6. Pilih tipe **Web app** dan atur:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
7. Klik **Deploy** lalu salin **Web App URL** (`https://script.google.com/macros/s/.../exec`).
8. Tempelkan URL tersebut pada konstanta `DEFAULT_GAS_URL` di `src/App.jsx` atau langsung melalui tombol **URL API** di header aplikasi.

> Setiap kali mengubah `Code.gs`, deploy ulang melalui **Deploy > Manage deployments > Edit (ikon pensil) > New version** agar perubahan aktif pada endpoint `/exec`.

### 2. Hosting Frontend di GitHub Pages (`https://tubankum3.github.io/ArsipAdvo/`)

Proyek ini sudah dikonfigurasi dengan `base: './'` di `vite.config.js`, `public/.nojekyll`, serta workflow otomatis di `.github/workflows/deploy.yml`.

1. Push seluruh source code proyek ini ke repositori GitHub `tubankum3/ArsipAdvo` pada branch `main`.
2. Di repositori GitHub, buka **Settings > Pages**.
3. Pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
4. Setiap push ke `main` akan menjalankan `npm run build` dan mempublikasikan folder `dist/` ke `https://tubankum3.github.io/ArsipAdvo/`.