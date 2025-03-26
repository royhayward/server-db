const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Create scripture
app.post('/api/scriptures', (req, res) => {
  const scripture = req.body;
  const sql = `
    INSERT INTO scriptures (
      week, year, reference, text, imageUrl,
      historicalContext, gospelTeaching, personalTestimony
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    scripture.week,
    scripture.year,
    scripture.reference,
    scripture.text,
    scripture.imageUrl,
    scripture.historicalContext,
    scripture.gospelTeaching,
    scripture.personalTestimony
  ], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, ...scripture });
  });
});

// Get scripture by week and year
app.get('/api/scriptures/:year/:week', (req, res) => {
  const { year, week } = req.params;
  const sql = 'SELECT * FROM scriptures WHERE year = ? AND week = ?';
  
  db.get(sql, [year, week], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Add this endpoint to get current week's scripture
app.get('/api/scriptures/current', (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
  const year = now.getFullYear();

  const sql = 'SELECT * FROM scriptures WHERE year = ? AND week = ?';
  
  db.get(sql, [year, week], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!row) {
      // If no scripture for current week/year, get the latest one
      const fallbackSql = 'SELECT * FROM scriptures ORDER BY year DESC, week DESC LIMIT 1';
      db.get(fallbackSql, [], (fallbackErr, fallbackRow) => {
        if (fallbackErr) {
          res.status(400).json({ error: fallbackErr.message });
          return;
        }
        res.json(fallbackRow);
});
      return;
    }
    res.json(row);
  });
});

// Add this after your routes
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
});
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});