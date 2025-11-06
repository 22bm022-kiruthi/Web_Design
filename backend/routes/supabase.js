const express = require('express');
const router = express.Router();

// Simple server-side proxy for Supabase PostgREST table operations.
// Expects SUPABASE_URL and SUPABASE_SERVICE_KEY in environment (service_role for inserts).

const getSupabaseHeaders = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['apikey'] = key;
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return { url, headers };
};

// GET /api/supabase/fetch?table=raman_data&limit=10&filter=Sample name.eq.Polystyrene (PS)
router.get('/fetch', async (req, res) => {
  console.log('=== Supabase fetch request received ===');
  console.log('Query params:', req.query);
  try {
    const table = req.query.table || 'raman_data';
    const limitParam = req.query.limit;
    
    const { url, headers } = getSupabaseHeaders();
    console.log('Supabase URL:', url);
    if (!url) return res.status(500).json({ error: 'SUPABASE_URL not configured on server' });

    // Build fetch URL with proper PostgREST query syntax
    let fetchUrl = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}?`;
    
    // Add limit
    if (limitParam) {
      fetchUrl += `limit=${encodeURIComponent(limitParam)}&`;
    }
    
    // Add filter if provided - PostgREST expects: columnname=eq.value
    // Frontend sends: "Sample name.eq.Test Polystyrene Full"
    // We need to convert to: Sample%20name=eq.Test%20Polystyrene%20Full
    const filter = req.query.filter;
    if (filter) {
      console.log('Original filter:', filter);
      // Parse "Column name.operator.Value" format
      const match = filter.match(/^(.+?)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/);
      if (match) {
        let [, columnName, operator, value] = match;
        // For PostgREST: Column Name becomes Column%20Name, spaces in value become %20
        const encodedCol = encodeURIComponent(columnName.trim());
        const encodedVal = encodeURIComponent(value.trim());
        const filterParam = `${encodedCol}=${operator}.${encodedVal}`;
        fetchUrl += `${filterParam}&`;
        console.log('PostgREST filter applied:', filterParam);
      } else {
        console.warn('Filter format not recognized, skipping:', filter);
      }
    }
    
    fetchUrl = fetchUrl.replace(/&$/, ''); // Remove trailing &
    
    console.log('Fetching from:', fetchUrl);
    console.log('Headers:', { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined });
    
    const resp = await fetch(fetchUrl, { headers });
    console.log('Response status:', resp.status);
    const contentType = resp.headers.get('content-type') || '';
    if (!resp.ok) {
      const text = await resp.text();
      console.log('Error response:', text);
      return res.status(resp.status).json({ status: resp.status, body: text });
    }
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      console.log('Data received, length:', data.length);
      return res.json({ data });
    }
    const text = await resp.text();
    return res.send(text);
  } catch (err) {
    console.error('Supabase fetch error', err);
    res.status(500).json({ error: 'Supabase fetch failed', details: String(err) });
  }
});

// POST /api/supabase/insert with body { table: 'raman_data', rows: [...] }
router.post('/insert', express.json(), async (req, res) => {
  try {
    const { table, rows } = req.body;
    if (!table || !rows) return res.status(400).json({ error: 'table and rows are required' });
    const { url, headers } = getSupabaseHeaders();
    if (!url) return res.status(500).json({ error: 'SUPABASE_URL not configured on server' });

    const fetchUrl = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}`;
    const resp = await fetch(fetchUrl, { method: 'POST', headers, body: JSON.stringify(rows) });
    const text = await resp.text();
    if (!resp.ok) return res.status(resp.status).send(text);
    return res.send(text);
  } catch (err) {
    console.error('Supabase insert error', err);
    res.status(500).json({ error: 'Supabase insert failed', details: String(err) });
  }
});

module.exports = router;
