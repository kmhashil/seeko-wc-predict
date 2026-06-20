# Seeko WC Predict (World Cup 2026 Prediction Pool)

A responsive web application designed for a WhatsApp group prediction pool. It enables members of the group to submit predictions, view the leaderboard, and allows admins to review submissions and log the final results.

## Shared Data Persistence (Shim)

This project has been modified to run as a fully static web page that requires no server-side database. It persists its shared state (submissions, confirmation status, and results) using a zero-config key-value storage service (`keyvalue.immanuel.co`) under the unique identifier `seekopredictwc_hashil_7fda7e`.
* The client-side database calls serialize the state into hex to pass safely via HTTP requests.
* Anyone loading the page (both users and admin) will interact with this shared global state.

## Running Locally

Since the project is a single, self-contained HTML page, you can run it locally by:
1. Opening `index.html` in your web browser.
2. Or serving it with any simple local HTTP server (e.g., running `python3 -m http.server` in this directory).

## 🚀 Reliable Storage & Backup Architecture

To prevent future data loss and ensure maximum resilience, the application now includes:
1. **JSONBlob State Proxy (`api/storage.js`):** Stores predictions, results, and photos in a fast JSON storage service.
2. **Weekly Keep-Alive Cron (`api/keepalive.js` & `vercel.json`):** JSONBlob has a default 30-day expiry for inactive blobs. A Vercel Cron Job automatically pings the storage every Sunday to reset the inactivity timer so data is never deleted.
3. **Local Storage Fallback Mirror (Frontend):** Every time predictions are fetched or updated, a copy of the state is mirrored to the user's browser `localStorage`. If the JSONBlob service is ever down, the app automatically switches to the local backup and shows a warning banner to the admin.
4. **Google Sheets Backup (Automation):** Every prediction submitted, approved, or rejected is automatically sent to your personal Google Sheet in real-time.

---

## 📊 Google Sheets Setup Guide (Recommended)

To mirror all prediction submissions to a Google Sheet automatically:

1. **Create a Google Sheet**: Create a new empty Google Sheet in Google Drive.
2. **Open Apps Script**: Go to **Extensions** > **Apps Script** in the sheet menu.
3. **Copy Code**: Copy the code from the [sheets-webhook.gs](file:///Users/hashil/Seeko%20Prediction/sheets-webhook.gs) file in this project and paste it into the script editor (replacing any existing code).
4. **Deploy**:
   * Click **Deploy** > **New deployment**.
   * Click the gear icon next to "Select type" and select **Web app**.
   * Set **Execute as** to **"Me (your-email@gmail.com)"**.
   * Set **Who has access** to **"Anyone"** (this allows the website to send submissions without requiring logging in).
   * Click **Deploy**.
5. **Authorize Permissions**: Click "Authorize access", select your Google account, click "Advanced" -> "Go to Untitled project (unsafe)" (Google's warning is normal here since it's your own script), and grant the permissions.
6. **Save Web App URL**: Copy the generated **Web App URL** from the deployment modal.
7. **Configure in App**:
   * Open [index.html](file:///Users/hashil/Seeko%20Prediction/index.html) and locate line 282: `const GOOGLE_SHEETS_URL = "";`
   * Paste your copied Web App URL between the quotes:
     `const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/.../exec";`
8. **Push to GitHub**: Save the file, commit the changes, and push. Vercel will rebuild the site, and all submissions will begin syncing to Google Sheets instantly!

---

## 🔧 Maintenance & Admin Panel Updates

* **Phone Validation**: The app enforces strictly 10-digit WhatsApp numbers to maintain database format integrity.
* **Admin Autorefresh**: The admin panel now forces a database reload every time it is opened, and auto-refreshes every 30 seconds to show new incoming predictions without requiring page reloads. A manual **🔄 Refresh** button has also been added.

