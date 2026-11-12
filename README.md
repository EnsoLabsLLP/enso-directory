# Enso practitioner directory

The public directory where people find a practitioner and request a session, plus an admin panel for managing listings.

- **Public site** (`/`): concern tiles, filters, practitioner profiles with photos and intro videos, booking and "Help me choose" forms.
- **Requests**: every form submission becomes a new row in the **Requests** tab of your Google Sheet.
- **Admin panel** (`/admin`): sign in to add, edit, hide or delete practitioners, upload profile photos and intro videos, and see recent requests.
- **Listings** live in the **Practitioners** tab of the same Google Sheet, so you can also edit them there directly.

Built with Next.js 15, hosted on Vercel. Photos and videos are stored in Vercel Blob.

---

## Deploy to Vercel

You need: a Vercel account, a GitHub account, and the Google account that owns your Drive.

> Vercel's free Hobby plan is for non-commercial use. A business site like this one belongs on a Pro plan; check Vercel's current plans before going live.

### 1. Put the code on GitHub

1. Create a new **private** repository on GitHub (for example `enso-directory`).
2. Upload this folder's contents to it. On github.com you can drag the files into the "uploading an existing file" page. Don't upload `node_modules`, `.next` or any `.env` file.

### 2. Create the Google Sheet and a service account

The site talks to your sheet through a Google "service account", a robot user that only has access to the sheets you share with it.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project called **Enso Directory**.
2. Open **APIs & Services → Library**, search for **Google Sheets API** and click **Enable**.
3. Open **IAM & Admin → Service Accounts → Create service account**. Name it `enso-sheets`. Skip the optional role and access steps and click **Done**.
4. Click the new service account, open the **Keys** tab, then **Add key → Create new key → JSON**. A `.json` file downloads. Keep it private: it works like a password.
5. In Google Drive, create a new Google Sheet called **Enso Bookings**.
6. Click **Share**, paste the service account's email (the `client_email` value in the JSON file, ending in `iam.gserviceaccount.com`), set it to **Editor**, untick "Notify people", and share.
7. Copy the sheet's ID from its URL: `docs.google.com/spreadsheets/d/`**`THIS-LONG-PART`**`/edit`.

### 3. Import the project into Vercel

1. In Vercel, click **Add New → Project**, pick the GitHub repository and click **Import**. Leave the framework as Next.js.
2. Before deploying, open **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `ADMIN_EMAIL` | The email you'll sign in with |
| `ADMIN_PASSWORD` | A long password (12+ characters) |
| `SESSION_SECRET` | Any random text, 32+ characters. A password manager can generate one |
| `GOOGLE_SHEET_ID` | The ID from step 2.7 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON file |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON file. Copy everything between the quotes, from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----\n`. The `\n` characters are fine. |

3. Click **Deploy**.

### 4. Connect storage for photos and videos

1. In the project, open **Storage → Create → Blob**, name it `enso-media`, and connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN` for you.
2. Open **Deployments**, click the three dots on the latest one and choose **Redeploy** so the site picks up the new setting.

### 5. Set up the sheet

1. Go to `https://your-site.vercel.app/admin` and sign in.
2. Click **Set up sheet**. This creates the **Practitioners** and **Requests** tabs with headings and loads the 10 starter listings from the C1 cohort.
3. Open the site and send yourself a test booking. It should appear in the Requests tab within a few seconds.

### 6. Use your own domain (optional)

In **Settings → Domains**, add a domain such as `book.ensoai.in`. Vercel shows the DNS record to add at your domain provider (usually a CNAME pointing to Vercel).

---

## Using the admin panel

- **Add practitioner**: fill in the form and click **Save**. Required: name, title and a short summary.
- **Photos**: upload a square headshot (JPG, PNG or WebP, up to 10 MB), or paste a link to one.
- **Intro videos**: upload an MP4, MOV or WebM up to 300 MB, or paste a YouTube, Google Drive or Vimeo link. Long or large videos are better on YouTube as **Unlisted**. Google Drive videos must be shared as "Anyone with the link".
- **Badges** show in green. "Creative therapies" is added automatically for art, drama, play, music, movement or expressive arts.
- **Hide** takes someone off the site without deleting them. **Delete** removes their row from the sheet.
- **Position in the list** controls the order on the site (1 shows first).

Changes show on the site straight away. Edits made directly in the Google Sheet show within about a minute.

## The Requests tab

Each request adds one row:

| Column | What's in it |
| --- | --- |
| Received (IST) | Date and time, Indian Standard Time |
| Type | `Booking` (for a specific practitioner) or `Help me choose` |
| Practitioner | Who they asked for (blank for Help me choose) |
| Name, Phone / WhatsApp, Email | How to reach them. Email is optional |
| Preferred time | Mornings, Afternoons, Evenings, Weekends or Any time |
| Wants help with, Language, Budget | From the Help me choose form |
| Message | What they'd like to talk about, if they shared it |
| Status | Starts as `New`. Change it in the sheet as you follow up, for example `Contacted`, `Confirmed` |
| Request ID | The reference number the client sees |

Requests contain personal and health-related information. Keep the sheet shared only with the people who need it, and download it as Excel from **File → Download → Microsoft Excel** whenever you need a copy.

---

## Run it on your computer (optional)

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without the Google settings, the site runs in practice mode and saves listings and requests to a local `.data` folder. Sign in to `/admin` with `admin@enso.local` / `enso-admin` (these only work on your computer, never on Vercel). To test against your real sheet, copy `.env.example` to `.env.local` and fill it in.

## Troubleshooting

- **"The app can't open the Google Sheet"**: share the sheet with the service account email as an Editor (step 2.6).
- **"The Google Sheet wasn't found"**: check `GOOGLE_SHEET_ID` is only the ID, not the whole URL.
- **"Couldn't reach the Google Sheet"**: check the Google Sheets API is enabled (step 2.2) and `GOOGLE_PRIVATE_KEY` was copied in full. Redeploy after changing any variable.
- **Uploads fail on the live site**: connect the Blob store and redeploy (step 4).
- **Can't sign in**: check `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `SESSION_SECRET` (32+ characters), then redeploy.

## What's where

```
app/page.js                 Public directory page
public/directory.js         Filters, profiles, video player and request forms
app/globals.css             Site styles (white and navy, green badges)
app/admin/                  Admin pages (login, dashboard, add/edit)
components/                 Admin forms, media uploader, icons
app/api/requests            Saves requests to the sheet
app/api/admin/              Admin actions (signed-in only)
app/api/upload              Upload tokens for Vercel Blob (signed-in only)
lib/catalog.js              Concerns, approaches (with plain-language explanations), times, fee ranges
lib/seed.js                 The 10 starter listings
lib/sheets.js               Google Sheets connection
middleware.js               Keeps /admin behind the login
```

Icons are from [Lucide](https://lucide.dev) (ISC licence), built into the site.
