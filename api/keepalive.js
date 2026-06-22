// api/keepalive.js
// Vercel Serverless Function - triggered by Vercel Cron to keep Google Sheets state warm

const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || "https://script.google.com/macros/s/AKfycbwZ1L49dH1DWXfek-BNz9uABHFjcsjm5DDkdAalJCjMG6tuUvuhFM_oqIRYIaSzq34U/exec";

// Fetch helper with retries and exponential backoff
async function fetchWithRetry(url, options = {}, retries = 4, delay = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      const text = await response.clone().text().catch(() => "");
      console.warn(`Google Sheets fetch attempt ${i + 1} failed: status=${response.status} body=${text}. Retrying...`);
    } catch (err) {
      console.warn(`Google Sheets fetch attempt ${i + 1} failed with error: ${err.message}. Retrying...`);
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  return fetch(url, options);
}

export default async function handler(req, res) {
  try {
    console.log('Keep-alive triggered. Fetching current state...');
    const response = await fetchWithRetry(`${GOOGLE_SHEETS_URL}?action=read`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`GET failed: ${response.status}`);
    }
    const data = await response.json();

    console.log('State fetched. Writing back to keep Google Drive file warm...');
    const putResponse = await fetchWithRetry(`${GOOGLE_SHEETS_URL}?action=write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(data)
    });
    if (!putResponse.ok) {
      throw new Error(`POST failed: ${putResponse.status}`);
    }

    return res.status(200).json({ success: true, message: 'Google Sheets keep-alive successful.' });
  } catch (error) {
    console.error('Keepalive handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
