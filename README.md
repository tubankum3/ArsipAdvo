# Manajemen Arsip — GitHub Pages + Google Sheets

A static web app (deployable on GitHub Pages) for managing completed-case
archives and their borrowing history, using a Google Sheet as the database.
This is a re-implementation of the reference `Arsip.tsx` component — same
two tables, same archive / edit / view / print / borrow / return workflow —
built without a React build step so it can be hosted directly on GitHub
Pages.

## How it works

```
[ index.html + app.js ]  --fetch-->  [ Google Apps Script Web App ]  <-->  [ Google Sheet ]
   hosted on GitHub Pages              your "backend", free to host          your "database"
```

GitHub Pages only serves static files — it can't run server code or talk
to Google Sheets directly. So the Google Sheet is wrapped in a small Google
Apps Script "Web App" (`apps-script/Code.gs`) that exposes a JSON API. The
static front-end calls that API with `fetch()`.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | Page shell, loads Tailwind (via CDN) and the two scripts below |
| `config.js` | The **only** file you edit after deployment — holds your API URL |
| `app.js` | All front-end logic: tables, search, pagination, modals, API calls |
| `apps-script/Code.gs` | Backend: turns the Sheet into a JSON API |

## Setup

### 1. Create the Google Sheet + backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new, blank spreadsheet. Name it something like "Arsip Perkara — Database".
2. In the sheet, open **Extensions > Apps Script**.
3. Delete any starter code in the editor, then paste in the full contents of `apps-script/Code.gs`.
4. Save the project (give it a name if prompted).
5. In the function dropdown at the top of the toolbar, select **setupSheets**, then click **Run**.
   - The first run will ask you to authorize the script (it's your own script acting on your own sheet) — approve it.
   - This creates three tabs — `PerkaraSelesai`, `ArsipPerkaraSelesai`, `Peminjaman` — with the correct column headers, and seeds `PerkaraSelesai` with 10 sample cases so you have something to test with.
6. Check the spreadsheet — you should now see the three tabs with data.

### 2. Deploy the backend as a Web App

1. In the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, authorize again if asked, and copy the **Web App URL** it gives you (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

> **Important:** if you ever edit `Code.gs` later, saving alone does not update the live API. Go to **Deploy > Manage deployments**, click the pencil icon, and choose **New version** — otherwise your changes won't take effect.

### 3. Point the front-end at your backend

Open `config.js` and paste your Web App URL:

```js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
  API_TOKEN: ''
};
```

Leave `API_TOKEN` as `''` unless you've set up the optional token described below.

### 4. Test it locally

Easiest: from this folder, run a local static server and open it in your browser:

```bash
npx serve .
```

Then visit the printed `localhost` URL. You should see the "Daftar Perkara Selesai" table populated with the 10 sample cases. Try archiving one, viewing its detail, recording a borrow, and returning it — check the Google Sheet to confirm the rows update live.

### 5. Publish on GitHub Pages

1. Create a new GitHub repository and push this folder's contents (`index.html`, `config.js`, `app.js`, `apps-script/`) to it.
2. In the repo, go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Save. GitHub will give you a URL like `https://your-username.github.io/your-repo-name/` within a minute or two.

That's it — the live site talks straight to your Google Sheet.

## Data model

Each sheet's header row doubles as the API's field names — don't rename or
reorder the columns `setupSheets()` creates.

**PerkaraSelesai** (cases ready to be archived)
`id, nomorPerkara, jenisPerkara, tahunMasuk, pengadilan, wilayah, pihakP, pihakT`

**ArsipPerkaraSelesai** (archived cases)
All of the above, plus:
`kodeKlasifikasi, tahunSelesai, tingkatPerkembangan, jumlahBerkas, lokasiSimpan, keterangan, status`

**Peminjaman** (borrowing log, linked to an archive by `arsipId`)
`id, arsipId, peminjam, tanggalPinjam, tanggalKembali, keterangan`

To add cases to archive, just add rows to `PerkaraSelesai` directly in the
sheet (or build an intake form later) — the app will pick them up on the
next page load.

## Feature mapping

| Original component | This app |
|---|---|
| `Arsip` list state | `PerkaraSelesai` / `ArsipPerkaraSelesai` sheets |
| "Record ke Arsip" modal | Archive form modal → `archive` action |
| Edit archive modal | Same form, prefilled → `updateArsip` action |
| Detail view + print | Detail modal, `window.print()` scoped to the modal |
| Borrowing mechanism | `Peminjaman` sheet, `addPeminjaman` / `returnPeminjaman` actions |
| Client-side pagination/search | Same, done in `app.js` over the fetched rows |

## Security note (please read)

This architecture has no real login system. Anyone who has your Web App
URL can read and write the sheet — and because GitHub Pages serves plain
static files, that URL is visible to anyone who views the page source of
your live site, even if you never publish it anywhere. There's an optional
lightweight deterrent built in:

1. In the Apps Script editor, go to **Project Settings > Script Properties** and add a property named `API_TOKEN` with a value you choose (a random string).
2. Put the same value in `config.js` as `API_TOKEN`.

Requests without a matching token will now be rejected. This stops casual
or accidental access, but it is **not** real security — the token is still
visible in your site's JavaScript to anyone who looks. If this archive
holds genuinely sensitive case data, treat this as a prototype and talk to
your IT/security team about a properly authenticated backend (e.g.,
restricting the Web App to your Google Workspace domain, or putting a real
auth layer in front of it) before using it in production.

## Troubleshooting

- **"Aplikasi belum terhubung..." banner** — you haven't pasted a real URL into `config.js` yet.
- **Fetch fails / CORS error in the console** — most often this means you edited `Code.gs` but didn't create a new deployment version (see step 2). Re-deploy and try again.
- **"Sheet not found" error** — run `setupSheets` from the Apps Script editor first.
- **Data doesn't look right after an edit** — double check the sheet's header row still exactly matches the columns listed above; the API maps columns by header name.
