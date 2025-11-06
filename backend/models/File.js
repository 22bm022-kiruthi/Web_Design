const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  content: { type: String, required: true }, // base64
  parsedData: { type: Array, default: [] },
  active: { type: Boolean, default: false },
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', FileSchema);