const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');
// Removed MongoDB File model — switching to Supabase-first upload flow

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('POST /api/upload received');
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded (expected form field "file")' });
    }
    const { originalname, buffer } = req.file;
    console.log('Uploading file:', originalname, 'size:', buffer ? buffer.length : 0);
    if (buffer && buffer.length > 0) {
      const head = buffer.slice(0, Math.min(64, buffer.length)).toString('hex');
      console.log('Buffer head (hex, 64 bytes):', head);
    }
  let parsedData = [];
  let supabaseInsertResult = null; // will hold info about any Supabase insertion attempt

    if (originalname.toLowerCase().endsWith('.csv')) {
      const csvString = buffer.toString('utf-8');
      parsedData = parse(csvString, { columns: true, skip_empty_lines: true });
    } else if (originalname.toLowerCase().endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      parsedData = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const rowObj = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value;
          rowObj[header] = cell.value;
        });
        parsedData.push(rowObj);
      });
    } else if (originalname.toLowerCase().endsWith('.xls')) {
      // .xls (BIFF) is not supported by ExcelJS (which handles .xlsx). Return a helpful error.
      console.warn('Received .xls file which is not supported by server: ', originalname);
      return res.status(400).json({ error: '.xls files are not supported. Please upload .csv or .xlsx' });
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Optional: insert parsed rows into Supabase when service key and URL are provided
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && supabaseServiceKey && Array.isArray(parsedData) && parsedData.length) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const batchSize = 100;
          supabaseInsertResult = { inserted: 0, errors: [] };
          for (let i = 0; i < parsedData.length; i += batchSize) {
            const batch = parsedData.slice(i, i + batchSize);
            // Insert batch into the 'raman_data' table — adjust table name if needed
            // Note: caller must ensure column names match table columns or map them before inserting
            // eslint-disable-next-line no-await-in-loop
            const { data: inserted, error: insertErr } = await supabase.from('raman_data').insert(batch);
            if (insertErr) {
              console.error('Supabase insert error:', insertErr);
              supabaseInsertResult.errors.push(String(insertErr));
            } else {
              supabaseInsertResult.inserted += (inserted && inserted.length) ? inserted.length : 0;
            }
          }
        } catch (sErr) {
          console.error('Supabase insert exception:', sErr);
          supabaseInsertResult = { inserted: 0, errors: [String(sErr)] };
        }
      }
    } catch (noThrow) {
      // non-fatal: ensure Supabase insertion failures don't block upload flow
      console.warn('Supabase insertion step failed unexpectedly:', noThrow && noThrow.stack ? noThrow.stack : noThrow);
    }

    // (Supabase insertion handled earlier; no-op here)

    // Supabase-first flow: optionally upload the raw file to Supabase Storage (if configured)
    let storageUpload = null;
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
      if (supabaseUrl && supabaseKey && storageBucket) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const storagePath = `uploads/${Date.now()}-${originalname}`;
          // upload expects a File/Buffer — buffer works
          const { data: uploadData, error: uploadErr } = await supabase.storage.from(storageBucket).upload(storagePath, buffer, { contentType: 'application/octet-stream' });
          if (uploadErr) {
            console.error('Supabase storage upload error:', uploadErr);
            storageUpload = { error: String(uploadErr) };
          } else {
            storageUpload = { path: storagePath, storageData: uploadData };
          }
        } catch (sErr) {
          console.error('Supabase storage exception:', sErr);
          storageUpload = { exception: String(sErr) };
        }
      }
    } catch (e) {
      console.warn('Storage upload step failed unexpectedly:', e && e.stack ? e.stack : e);
    }

    // Default fallback: save parsed data to local uploads folder so dev can inspect it
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { /* ignore */ }
      const localId = `local-${Date.now()}`;
      const filePath = path.join(uploadsDir, `${localId}.json`);
      fs.writeFileSync(filePath, JSON.stringify({ filename: originalname, parsedData, supabase: supabaseInsertResult, storage: storageUpload }, null, 2), 'utf-8');
      console.warn('Saved uploaded file metadata to local path:', filePath);
      return res.json({ message: 'File uploaded and parsed', fileId: localId, parsedData, supabase: supabaseInsertResult, storage: storageUpload });
    } catch (fsErr) {
      console.error('Failed to write local fallback file:', fsErr);
      return res.status(500).json({ error: 'Failed to save uploaded file', details: String(fsErr) });
    }
  } catch (err) {
    // Log full stack for debugging
    console.error('Upload handler error:', err && err.stack ? err.stack : err);
    // Return error message and (for dev) stack so the client can show a useful message
    const message = err && err.message ? err.message : 'File upload failed';
    const stack = err && err.stack ? err.stack : undefined;
    res.status(500).json({ error: message, stack });
  }
});

// List uploaded files (most recent first)
router.get('/', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { /* ignore */ }
    const files = [];
    const activeFilePath = path.join(uploadsDir, 'active.json');
    let activeId = null;
    try {
      if (fs.existsSync(activeFilePath)) {
        const a = JSON.parse(fs.readFileSync(activeFilePath, 'utf-8'));
        activeId = a && a.activeId;
      }
    } catch (e) { /* ignore */ }

    const dirEntries = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.json') && f.startsWith('local-'));
    dirEntries.sort((a, b) => fs.statSync(path.join(uploadsDir, b)).mtimeMs - fs.statSync(path.join(uploadsDir, a)).mtimeMs);
    for (const fname of dirEntries) {
      try {
        const full = path.join(uploadsDir, fname);
        const txt = fs.readFileSync(full, 'utf-8');
        const parsed = JSON.parse(txt);
        files.push({ _id: path.basename(fname, '.json'), filename: parsed.filename || fname, uploadDate: fs.statSync(full).mtime.toISOString(), active: activeId === path.basename(fname, '.json') });
      } catch (e) {
        // skip malformed
      }
    }
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get a single file by id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    const txt = fs.readFileSync(filePath, 'utf-8');
    const file = JSON.parse(txt);
    res.json({ file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Activate a file (set active=true and deactivate others)
router.post('/:id/activate', async (req, res) => {
  try {
    const id = req.params.id;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { /* ignore */ }
    const filePath = path.join(uploadsDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    const activeFilePath = path.join(uploadsDir, 'active.json');
    fs.writeFileSync(activeFilePath, JSON.stringify({ activeId: id }, null, 2), 'utf-8');
    const txt = fs.readFileSync(filePath, 'utf-8');
    const file = JSON.parse(txt);
    res.json({ message: 'Activated', file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate file' });
  }
});

module.exports = router;
