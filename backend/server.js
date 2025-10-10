const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();


const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;


// CORS: Allow main Netlify site, all Netlify deploy previews, and localhost for dev
const allowedOrigins = [
  'https://spectraldataanalysis.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+--spectraldataanalysis\.netlify\.app$/.test(origin) ||
      origin.endsWith('.netlify.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is not set!');
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});