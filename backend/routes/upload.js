const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');
const File = require('../models/File');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    let parsedData = [];

    if (originalname.endsWith('.csv')) {
      const csvString = buffer.toString('utf-8');
      parsedData = parse(csvString, { columns: true, skip_empty_lines: true });
    } else if (originalname.endsWith('.xls') || originalname.endsWith('.xlsx')) {
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
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const fileDoc = new File({
      filename: originalname,
      content: buffer.toString('base64'),
      parsedData,
    });
    await fileDoc.save();

    res.json({ message: 'File uploaded and parsed', fileId: fileDoc._id, parsedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
