// api/keepalive.js
// Vercel Serverless Function - triggered by Vercel Cron to keep JSONBlob active

const BLOB_ID = "019ee533-a0ad-770c-96c8-c8938decef40";
const BLOB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`;

export default async function handler(req, res) {
  try {
    console.log('Keep-alive triggered. Fetching current state...');
    const response = await fetch(BLOB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`GET failed: ${response.status}`);
    }
    const data = await response.json();

    console.log('State fetched. Writing back to reset TTL...');
    const putResponse = await fetch(BLOB_URL, {
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
