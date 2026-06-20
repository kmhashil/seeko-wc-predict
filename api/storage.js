// api/storage.js
// Vercel Serverless Function - proxies JSONBlob to bypass browser CORS
// JSONBlob stores the entire app state as one JSON object

const BLOB_ID = "019ee533-a0ad-770c-96c8-c8938decef40";
const BLOB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`;

// Helper to read raw body from request stream
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
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
      // Read current state from JSONBlob
      const response = await fetch(BLOB_URL, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('JSONBlob GET error:', response.status, text);
        return res.status(response.status).json({ error: 'Storage read failed: ' + response.status });
      }
      const data = await response.json();
      return res.status(200).json(data);

    } else if (req.method === 'POST') {
      // Write new state to JSONBlob
      // Read raw body (works regardless of body parser availability)
      let body;
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else {
        const raw = await readBody(req);
        body = JSON.parse(raw);
      }

      const response = await fetch(BLOB_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('JSONBlob PUT error:', response.status, text);
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
