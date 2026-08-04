/**
 * Manajemen Arsip — Google Apps Script backend
 * ------------------------------------------------
 * This script turns a Google Sheet into a tiny JSON API that the static
 * front-end (index.html + app.js, hosted on GitHub Pages) talks to.
 *
 * SETUP (see README.md for full step-by-step instructions):
 *  1. Create a Google Sheet.
 *  2. Extensions > Apps Script, delete any starter code, paste this file in.
 *  3. Run `setupSheets` once (Run menu > select "setupSheets" > Run) to
 *     create the 3 tabs with headers + sample data. Approve permissions.
 *  4. Deploy > New deployment > type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  5. Copy the Web App URL into config.js as CONFIG.API_URL.
 */

// ====== SHEET / FIELD CONFIG ======
var SHEET_PERKARA = 'PerkaraSelesai';
var SHEET_ARSIP = 'ArsipPerkaraSelesai';
var SHEET_PEMINJAMAN = 'Peminjaman';

var HEADERS = {};
HEADERS[SHEET_PERKARA] = ['id', 'nomorPerkara', 'jenisPerkara', 'tahunMasuk', 'pengadilan', 'wilayah', 'pihakP', 'pihakT'];
HEADERS[SHEET_ARSIP] = ['id', 'nomorPerkara', 'jenisPerkara', 'tahunMasuk', 'pengadilan', 'wilayah', 'pihakP', 'pihakT', 'kodeKlasifikasi', 'tahunSelesai', 'tingkatPerkembangan', 'jumlahBerkas', 'lokasiSimpan', 'keterangan', 'status'];
HEADERS[SHEET_PEMINJAMAN] = ['id', 'arsipId', 'peminjam', 'tanggalPinjam', 'tanggalKembali', 'keterangan'];

// Sample rows so the app has something to show immediately after setup.
// Mirrors the example data from the reference React component.
var SAMPLE_PERKARA = [
  ['1', '276/Pdt.G/2017/PN.Jkt.Pst', 'Perdata', 2017, 'PN Jakarta Pusat', 'DKI Jakarta', 'PT ABC', 'Kementerian Keuangan'],
  ['2', '46/Pdt.G/2017/PN.Skh', 'Perdata', 2017, 'PN Sukoharjo', 'Jawa Tengah', 'Budi Utomo', 'KPP Pratama Sukoharjo'],
  ['3', '491/Pdt.G/2017/PN.Smg', 'Perdata', 2017, 'PN Semarang', 'Jawa Tengah', 'Siti Aminah', 'Kanwil DJP Jawa Tengah I'],
  ['4', '371/PDT.G/2017/PN.BDG', 'Perbuatan Melawan Hukum', 2017, 'PN Bandung', 'Jawa Barat', 'Wawan Hermawan', 'KPKNL BMN Bandung'],
  ['5', '490/Pdt.G/2017/PN.Smg', 'Perdata', 2017, 'PN Semarang', 'Jawa Tengah', '', ''],
  ['6', '16/Pdt.G/2017/PN.Tlg', 'Perkara Perdata', 2017, 'PN Tulungagung', 'Jawa Timur', '', ''],
  ['7', '16/PDT.G/2014/PN.GS', 'Perdata', 2014, 'PN Gresik', 'Jawa Timur', '', ''],
  ['8', '3/PDT.G/2014/PN.Mgl', 'Perdata', 2014, 'PN Magelang', 'Jawa Tengah', '', ''],
  ['9', '511/Pdt.G/2014/PN.SBY', 'Perdata', 2014, 'PN Surabaya', 'Jawa Timur', '', ''],
  ['10', '47/Pdt.G/2014/PN.Pkl', 'Perdata', 2015, 'PN Pekalongan', 'Jawa Tengah', '', '']
];

/**
 * Run this once from the Apps Script editor to create the sheet tabs
 * (PerkaraSelesai, ArsipPerkaraSelesai, Peminjaman) with the right
 * headers, and to seed PerkaraSelesai with sample rows if it's empty.
 * Safe to run again later — it won't duplicate headers or sample data.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(HEADERS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[name]);
      sh.setFrozenRows(1);
    }
  });

  var perkaraSheet = ss.getSheetByName(SHEET_PERKARA);
  if (perkaraSheet.getLastRow() <= 1) {
    SAMPLE_PERKARA.forEach(function (row) { perkaraSheet.appendRow(row); });
  }

  // Remove the blank default "Sheet1" if it's still empty and unused.
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

// ====== OPTIONAL ACCESS TOKEN ======
// Anyone who can view your GitHub Pages site can also see the Apps Script
// URL in config.js, since static sites publish their JS source to every
// visitor. That URL alone isn't secret. As a lightweight extra check, you
// can set a Script Property named API_TOKEN (Project Settings > Script
// Properties, in the Apps Script editor) and put the same value in
// config.js. Requests without a matching token will be rejected. This
// raises the bar against casual/accidental access but is NOT real
// authentication — treat it as a deterrent, not a security boundary, for
// genuinely sensitive case data.
function getApiToken_() {
  return PropertiesService.getScriptProperties().getProperty('API_TOKEN') || '';
}

function assertAuthorized_(token) {
  var expected = getApiToken_();
  if (expected && token !== expected) {
    throw new Error('Unauthorized: missing or invalid token.');
  }
}

// ====== HTTP ENTRY POINTS ======

function doGet(e) {
  try {
    assertAuthorized_(e.parameter.token);
    var action = e.parameter.action;
    var data;
    if (action === 'allData') {
      var perkara = getObjects_(SHEET_PERKARA);
      var arsip = getObjects_(SHEET_ARSIP);
      var peminjaman = getObjects_(SHEET_PEMINJAMAN);
      var peminjamanMap = {};
      for (var i = 0; i < peminjaman.length; i++) {
        var p = peminjaman[i];
        if (!peminjamanMap[p.arsipId]) peminjamanMap[p.arsipId] = [];
        peminjamanMap[p.arsipId].push(p);
      }
      data = {
        perkara: perkara,
        arsip: arsip.map(function (a) {
          a.peminjaman = peminjamanMap[a.id] || [];
          return a;
        })
      };
    } else if (action === 'perkaraSelesai') {
      data = getObjects_(SHEET_PERKARA);
    } else if (action === 'arsip') {
      var arsip = getObjects_(SHEET_ARSIP);
      var peminjaman = getObjects_(SHEET_PEMINJAMAN);
      var peminjamanMap = {};
      for (var i = 0; i < peminjaman.length; i++) {
        var p = peminjaman[i];
        if (!peminjamanMap[p.arsipId]) peminjamanMap[p.arsipId] = [];
        peminjamanMap[p.arsipId].push(p);
      }
      data = arsip.map(function (a) {
        a.peminjaman = peminjamanMap[a.id] || [];
        return a;
      });
    } else {
      return jsonOut_({ ok: false, error: 'Unknown action: ' + action });
    }
    return jsonOut_({ ok: true, data: data });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    assertAuthorized_(body.token);
    var action = body.action;
    var result;
    if (action === 'archive') result = archivePerkara_(body);
    else if (action === 'updateArsip') result = updateArsip_(body);
    else if (action === 'addPeminjaman') result = addPeminjaman_(body);
    else if (action === 'returnPeminjaman') result = returnPeminjaman_(body);
    else throw new Error('Unknown action: ' + action);
    return jsonOut_({ ok: true, data: result });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ====== SHEET HELPERS ======

function getSheetAndHeaders_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name + '. Run setupSheets() first.');
  return { sh: sh, headers: HEADERS[name] };
}

function getObjects_(name) {
  var ref = getSheetAndHeaders_(name);
  var lastRow = ref.sh.getLastRow();
  if (lastRow < 2) return [];
  var values = ref.sh.getRange(2, 1, lastRow - 1, ref.headers.length).getValues();
  var idIndex = ref.headers.indexOf('id');
  var result = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var id = row[idIndex];
    if (id === '' || id === null) continue;
    var obj = {};
    for (var i = 0; i < ref.headers.length; i++) {
      obj[ref.headers[i]] = row[i];
    }
    result.push(obj);
  }
  return result;
}

function findRowIndexById_(sh, headers, id) {
  var idCol = headers.indexOf('id') + 1;
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sh.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // +2: header row + 1-based index
  }
  return -1;
}

function appendObject_(name, obj) {
  var ref = getSheetAndHeaders_(name);
  var row = ref.headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  ref.sh.appendRow(row);
}

function updateRowValues_(name, rowIndex, obj) {
  var ref = getSheetAndHeaders_(name);
  var row = ref.headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  ref.sh.getRange(rowIndex, 1, 1, ref.headers.length).setValues([row]);
}

function rowToObject_(sh, headers, rowIndex) {
  var values = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var obj = {};
  headers.forEach(function (h, i) { obj[h] = values[i]; });
  return obj;
}

// ====== ACTIONS ======

function archivePerkara_(body) {
  var id = body.id;
  var perkaraRef = getSheetAndHeaders_(SHEET_PERKARA);
  var rowIndex = findRowIndexById_(perkaraRef.sh, perkaraRef.headers, id);
  if (rowIndex === -1) throw new Error('Perkara not found: ' + id);

  var original = rowToObject_(perkaraRef.sh, perkaraRef.headers, rowIndex);

  var archived = Object.assign({}, original, {
    kodeKlasifikasi: body.kodeKlasifikasi || '',
    tahunSelesai: Number(body.tahunSelesai) || '',
    tingkatPerkembangan: body.tingkatPerkembangan || '',
    jumlahBerkas: body.jumlahBerkas || '',
    lokasiSimpan: body.lokasiSimpan || '',
    keterangan: body.keterangan || '',
    status: 'Terarsip'
  });

  appendObject_(SHEET_ARSIP, archived);
  perkaraRef.sh.deleteRow(rowIndex);
  return archived;
}

function updateArsip_(body) {
  var ref = getSheetAndHeaders_(SHEET_ARSIP);
  var rowIndex = findRowIndexById_(ref.sh, ref.headers, body.id);
  if (rowIndex === -1) throw new Error('Arsip not found: ' + body.id);

  var current = rowToObject_(ref.sh, ref.headers, rowIndex);
  var editableFields = ['kodeKlasifikasi', 'tahunSelesai', 'tingkatPerkembangan', 'jumlahBerkas', 'lokasiSimpan', 'keterangan'];
  editableFields.forEach(function (key) {
    if (body[key] !== undefined) {
      current[key] = key === 'tahunSelesai' ? (Number(body[key]) || '') : body[key];
    }
  });

  updateRowValues_(SHEET_ARSIP, rowIndex, current);
  return current;
}

function addPeminjaman_(body) {
  var id = 'PJM-' + new Date().getTime();
  var entry = {
    id: id,
    arsipId: body.arsipId,
    peminjam: body.peminjam || '',
    tanggalPinjam: body.tanggalPinjam || '',
    tanggalKembali: '',
    keterangan: body.keterangan || ''
  };
  appendObject_(SHEET_PEMINJAMAN, entry);

  var arsipRef = getSheetAndHeaders_(SHEET_ARSIP);
  var arsipRow = findRowIndexById_(arsipRef.sh, arsipRef.headers, body.arsipId);
  if (arsipRow !== -1) {
    var statusCol = arsipRef.headers.indexOf('status') + 1;
    arsipRef.sh.getRange(arsipRow, statusCol).setValue('Dipinjam');
  }
  return entry;
}

function returnPeminjaman_(body) {
  var ref = getSheetAndHeaders_(SHEET_PEMINJAMAN);
  var rowIndex = findRowIndexById_(ref.sh, ref.headers, body.peminjamanId);
  if (rowIndex === -1) throw new Error('Peminjaman not found: ' + body.peminjamanId);

  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var col = ref.headers.indexOf('tanggalKembali') + 1;
  ref.sh.getRange(rowIndex, col).setValue(todayStr);

  // If no other open (un-returned) borrow exists for this archive, mark it available again.
  var allPeminjaman = getObjects_(SHEET_PEMINJAMAN);
  var stillOpen = allPeminjaman.some(function (p) {
    return String(p.arsipId) === String(body.arsipId) && String(p.id) !== String(body.peminjamanId) && !p.tanggalKembali;
  });
  if (!stillOpen) {
    var arsipRef = getSheetAndHeaders_(SHEET_ARSIP);
    var arsipRow = findRowIndexById_(arsipRef.sh, arsipRef.headers, body.arsipId);
    if (arsipRow !== -1) {
      var statusCol = arsipRef.headers.indexOf('status') + 1;
      arsipRef.sh.getRange(arsipRow, statusCol).setValue('Terarsip');
    }
  }
  return { id: body.peminjamanId, tanggalKembali: todayStr };
}
