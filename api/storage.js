// api/storage.js
// Vercel Serverless Function - proxies Google Sheets Web App to bypass browser CORS
// Google Sheets Web App stores the entire app state in Google Drive as seeko_wc26_state.json

const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || "https://script.google.com/macros/s/AKfycbwZ1L49dH1DWXfek-BNz9uABHFjcsjm5DDkdAalJCjMG6tuUvuhFM_oqIRYIaSzq34U/exec";

// Helper to read raw body from request stream
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Read current state from Google Sheets Web App with retry
      const response = await fetchWithRetry(`${GOOGLE_SHEETS_URL}?action=read`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Google Sheets GET error:', response.status, text);
        return res.status(response.status).json({ error: 'Storage read failed: ' + response.status });
      }
      const data = await response.json();
      return res.status(200).json(data);

    } else if (req.method === 'POST') {
      // Write new state to Google Sheets Web App
      // Read raw body (works regardless of body parser availability)
      let body;
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else {
        const raw = await readBody(req);
        body = JSON.parse(raw);
      }

      // Write to Google Sheets Web App with retry
      const response = await fetchWithRetry(`${GOOGLE_SHEETS_URL}?action=write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Google Sheets POST error:', response.status, text);
        return res.status(response.status).json({ error: 'Storage write failed: ' + response.status });
      }
      const data = await response.json();
      return res.status(200).json({ success: true, data });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Storage handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
