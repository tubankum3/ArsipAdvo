/**
 * Sistem Manajemen Arsip & Peminjaman Perkara Pengadilan
 * Backend: Google Apps Script + Google Sheets
 */

var SHEET_PERKARA = 'Perkara';
var SHEET_ARSIP = 'ArsipPerkara';
var SHEET_PEMINJAMAN = 'Peminjaman';

var SHEETS_CONFIG = {
  Perkara: [
    'abstraksiID',
    'nomorPerkara',
    'jenisPerkara',
    'tahunMasuk',
    'pengadilan',
    'wilayah',
    'pihakP',
    'pihakT',
    'statusPerkara'
  ],
  ArsipPerkara: [
    'arsipID',
    'nomorPerkara',
    'jenisPerkara',
    'tahunMasuk',
    'pengadilan',
    'wilayah',
    'pihakP',
    'pihakT',
    'kodeKlasifikasi',
    'tahunSelesai',
    'kurunWaktu',
    'uraianBerkas',
    'jumlahBerkas',
    'lokasiSimpan',
    'boksFolder',
    'status'
  ],
  Peminjaman: [
    'peminjamanID',
    'arsipID',
    'peminjam',
    'tanggalPinjam',
    'tanggalKembali',
    'keterangan'
  ]
};

/**
 * Jalankan fungsi ini satu kali di Apps Script Editor untuk membuat
 * ke-3 sheet beserta header kolom yang sesuai.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var sheetName in SHEETS_CONFIG) {
    if (!Object.prototype.hasOwnProperty.call(SHEETS_CONFIG, sheetName)) continue;
    var headers = SHEETS_CONFIG[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
}

/**
 * Menangani HTTP GET Request
 * Mengembalikan seluruh data dari sheet Perkara, ArsipPerkara, dan Peminjaman
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone();

    var dataPerkara = getSheetData_(ss.getSheetByName(SHEET_PERKARA), tz);
    var dataArsip = getSheetData_(ss.getSheetByName(SHEET_ARSIP), tz);
    var dataPeminjaman = getSheetData_(ss.getSheetByName(SHEET_PEMINJAMAN), tz);

    return jsonResponse_({
      status: 'success',
      perkara: dataPerkara,
      arsip: dataArsip,
      peminjaman: dataPeminjaman
    });
  } catch (error) {
    return jsonResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    });
  }
}

/**
 * Menangani HTTP POST Request
 * Mendukung Content-Type: text/plain;charset=utf-8 agar tidak memicu CORS preflight
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ status: 'error', message: 'Payload request kosong.' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var d = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone();

    // 1. Tambah Data Perkara Baru
    if (action === 'addPerkara') {
      var sheetPerkara = ss.getSheetByName(SHEET_PERKARA);
      if (!sheetPerkara) {
        return jsonResponse_({ status: 'error', message: 'Sheet Perkara tidak ditemukan. Jalankan setupSheets() terlebih dahulu.' });
      }

      var abstraksiID = d.abstraksiID || 'PRK-' + Date.now();
      var newPerkara = [
        abstraksiID,
        d.nomorPerkara || '',
        d.jenisPerkara || '',
        d.tahunMasuk || '',
        d.pengadilan || '',
        d.wilayah || '',
        d.pihakP || '',
        d.pihakT || '',
        d.statusPerkara || 'Putus'
      ];

      sheetPerkara.appendRow(newPerkara);
      return jsonResponse_({
        status: 'success',
        message: 'Perkara berhasil ditambahkan',
        abstraksiID: abstraksiID
      });
    }

    // 2. Arsipkan Perkara (Insert ke ArsipPerkara + Delete row di Perkara)
    if (action === 'arsipkanPerkara') {
      var sheetArsip = ss.getSheetByName(SHEET_ARSIP);
      var sheetPerkara = ss.getSheetByName(SHEET_PERKARA);
      if (!sheetArsip || !sheetPerkara) {
        return jsonResponse_({ status: 'error', message: 'Sheet Perkara atau ArsipPerkara tidak ditemukan.' });
      }

      if (!d.abstraksiID) {
        return jsonResponse_({ status: 'error', message: 'abstraksiID wajib disertakan untuk proses pengarsipan.' });
      }

      var perkaraRowInfo = findRowByColumnValue_(sheetPerkara, 'abstraksiID', d.abstraksiID);
      if (!perkaraRowInfo) {
        return jsonResponse_({ status: 'error', message: 'Data perkara dengan ID ' + d.abstraksiID + ' tidak ditemukan atau sudah diarsipkan.' });
      }

      var arsipID = d.arsipID || 'ARS-' + Date.now();
      sheetArsip.appendRow([
        arsipID,
        d.nomorPerkara || '',
        d.jenisPerkara || '',
        d.tahunMasuk || '',
        d.pengadilan || '',
        d.wilayah || '',
        d.pihakP || '',
        d.pihakT || '',
        d.kodeKlasifikasi || '',
        d.tahunSelesai || '',
        d.kurunWaktu || '',
        d.uraianBerkas || '',
        d.jumlahBerkas || '',
        d.lokasiSimpan || '',
        d.boksFolder || '',
        'Terarsip'
      ]);
      SpreadsheetApp.flush();
      sheetPerkara.deleteRow(perkaraRowInfo.rowNumber);

      return jsonResponse_({
        status: 'success',
        message: 'Perkara berhasil diarsipkan',
        arsipID: arsipID
      });
    }

    // 3. Pinjam Arsip (Insert ke Peminjaman & ubah status ArsipPerkara -> 'Dipinjam')
    if (action === 'pinjamArsip') {
      var sheetPinjam = ss.getSheetByName(SHEET_PEMINJAMAN);
      var sheetArsip = ss.getSheetByName(SHEET_ARSIP);
      if (!sheetPinjam || !sheetArsip) {
        return jsonResponse_({ status: 'error', message: 'Sheet ArsipPerkara atau Peminjaman tidak ditemukan.' });
      }

      if (!d.arsipID || !d.peminjam) {
        return jsonResponse_({ status: 'error', message: 'arsipID dan nama peminjam wajib diisi.' });
      }

      var arsipRowInfo = findRowByColumnValue_(sheetArsip, 'arsipID', d.arsipID);
      if (!arsipRowInfo) {
        return jsonResponse_({ status: 'error', message: 'Arsip dengan ID ' + d.arsipID + ' tidak ditemukan.' });
      }

      var statusColIndex = arsipRowInfo.headers.indexOf('status');
      var currentStatus = statusColIndex !== -1 ? String(arsipRowInfo.rowValues[statusColIndex]) : '';
      if (currentStatus === 'Dipinjam') {
        return jsonResponse_({ status: 'error', message: 'Berkas arsip ini sedang dipinjam.' });
      }

      var peminjamanID = d.peminjamanID || 'PJM-' + Date.now();
      var tanggalPinjam = d.tanggalPinjam || Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

      sheetPinjam.appendRow([
        peminjamanID,
        d.arsipID,
        d.peminjam,
        tanggalPinjam,
        '',
        d.keterangan || ''
      ]);

      if (statusColIndex !== -1) {
        sheetArsip.getRange(arsipRowInfo.rowNumber, statusColIndex + 1).setValue('Dipinjam');
      }

      return jsonResponse_({
        status: 'success',
        message: 'Peminjaman arsip berhasil dicatat',
        peminjamanID: peminjamanID
      });
    }

    // 4. Kembalikan Arsip (Isi tanggalKembali di Peminjaman & ubah status ArsipPerkara -> 'Terarsip')
    if (action === 'kembalikanArsip') {
      var sheetPinjam = ss.getSheetByName(SHEET_PEMINJAMAN);
      var sheetArsip = ss.getSheetByName(SHEET_ARSIP);
      if (!sheetPinjam || !sheetArsip) {
        return jsonResponse_({ status: 'error', message: 'Sheet ArsipPerkara atau Peminjaman tidak ditemukan.' });
      }

      if (!d.arsipID) {
        return jsonResponse_({ status: 'error', message: 'arsipID wajib disertakan.' });
      }

      var tanggalKembali = d.tanggalKembali || Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
      var rowsPinjam = sheetPinjam.getDataRange().getValues();
      var updatedPinjam = false;

      if (rowsPinjam.length > 1) {
        var headersPinjam = rowsPinjam[0];
        var colPjmId = headersPinjam.indexOf('peminjamanID');
        var colArsipId = headersPinjam.indexOf('arsipID');
        var colTglKembali = headersPinjam.indexOf('tanggalKembali');

        for (var i = rowsPinjam.length - 1; i >= 1; i--) {
          var matchesArsip = String(rowsPinjam[i][colArsipId]) === String(d.arsipID);
          var matchesPjmId = d.peminjamanID ? String(rowsPinjam[i][colPjmId]) === String(d.peminjamanID) : true;
          var isStillOpen = !rowsPinjam[i][colTglKembali];

          if (matchesArsip && matchesPjmId && isStillOpen) {
            sheetPinjam.getRange(i + 1, colTglKembali + 1).setValue(tanggalKembali);
            updatedPinjam = true;
            break;
          }
        }
      }

      var arsipRowInfo = findRowByColumnValue_(sheetArsip, 'arsipID', d.arsipID);
      if (arsipRowInfo) {
        var statusColIdx = arsipRowInfo.headers.indexOf('status');
        if (statusColIdx !== -1) {
          sheetArsip.getRange(arsipRowInfo.rowNumber, statusColIdx + 1).setValue('Terarsip');
        }
      }

      return jsonResponse_({
        status: 'success',
        message: updatedPinjam
          ? 'Arsip berhasil dikembalikan'
          : 'Status arsip dikembalikan ke Terarsip',
        tanggalKembali: tanggalKembali
      });
    }

    return jsonResponse_({ status: 'error', message: 'Aksi tidak valid: ' + action });
  } catch (error) {
    return jsonResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_e) {}
  }
}

// ====== HELPER FUNCTIONS ======

function getSheetData_(sheet, tz) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var headers = rows[0];
  var data = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var isEmpty = row.every(function (cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isEmpty) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime())) {
        val = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
      }
      obj[headers[j]] = val;
    }
    data.push(obj);
  }
  return data;
}

function findRowByColumnValue_(sheet, columnName, targetValue) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return null;

  var headers = rows[0];
  var colIdx = headers.indexOf(columnName);
  if (colIdx === -1) return null;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][colIdx]) === String(targetValue)) {
      return {
        rowNumber: i + 1,
        headers: headers,
        rowValues: rows[i]
      };
    }
  }
  return null;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
