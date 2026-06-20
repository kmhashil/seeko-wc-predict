// api/keepalive.js
// Vercel Serverless Function - triggered by Vercel Cron to keep JSONBlob active

const BLOB_ID = "019ee533-a0ad-770c-96c8-c8938decef40";
const BLOB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`;

// Fetch helper with retries and exponential backoff
async function fetchWithRetry(url, options = {}, retries = 4, delay = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      const text = await response.clone().text().catch(() => "");
      console.warn(`JSONBlob fetch attempt ${i + 1} failed: status=${response.status} body=${text}. Retrying...`);
    } catch (err) {
      console.warn(`JSONBlob fetch attempt ${i + 1} failed with error: ${err.message}. Retrying...`);
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
    const response = await fetchWithRetry(BLOB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`GET failed: ${response.status}`);
    }
    const data = await response.json();

    console.log('State fetched. Writing back to reset TTL...');
    const putResponse = await fetchWithRetry(BLOB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!putResponse.ok) {
      throw new Error(`PUT failed: ${putResponse.status}`);
    }

    return res.status(200).json({ success: true, message: 'JSONBlob keep-alive successful, TTL reset.' });
  } catch (error) {
    console.error('Keepalive handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
