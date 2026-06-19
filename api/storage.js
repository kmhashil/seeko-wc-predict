// api/storage.js
// Vercel Serverless Function to proxy keyvalue.immanuel.co and bypass browser CORS

export default async function handler(req, res) {
  // CORS Headers for API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { key, action, val } = req.query;
  const APP_KEY = "seekopredictwc_hashil_7fda7e";

  if (action === 'get') {
    try {
      const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${APP_KEY}/${key}`);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from storage" });
      }
      
      const hexValue = await response.json();
      if (!hexValue) {
        return res.status(200).json({ value: null });
      }

      // Decode hex to string
      const bytes = new Uint8Array(hexValue.match(/.{1,2}/g).map(c => parseInt(c, 16)));
      const value = new TextDecoder().decode(bytes);

      return res.status(200).json({ value: value });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (action === 'set') {
    try {
      // The val parameter passed here is already hex encoded from the client
      const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${APP_KEY}/${key}/${val}`, {
        method: 'POST'
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to update storage" });
      }
      const text = await response.text();
      return res.status(200).json({ success: text === 'true' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }
}
