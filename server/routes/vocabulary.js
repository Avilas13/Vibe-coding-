const express = require('express');
const router = express.Router();
const vocabularyData = require('../data/vocabulary');

const VALID_LEVELS = ['B1', 'B2', 'C1', 'C2'];

// GET /api/vocabulary/all  — return every level
router.get('/all', (req, res) => {
  res.json(vocabularyData);
});

// GET /api/vocabulary/practice/random?level=B2
router.get('/practice/random', (req, res) => {
  const raw = (req.query.level || '').toUpperCase();
  const levels = VALID_LEVELS.includes(raw) ? [raw] : VALID_LEVELS;
  const pool = levels.flatMap((l) => vocabularyData[l] || []);
  if (!pool.length) return res.status(404).json({ error: 'No words found.' });
  res.json(pool[Math.floor(Math.random() * pool.length)]);
});

// GET /api/vocabulary/:level  — return one level (B1 / B2 / C1 / C2)
router.get('/:level', (req, res) => {
  const level = req.params.level.toUpperCase();
  if (!VALID_LEVELS.includes(level)) {
    return res.status(400).json({ error: `Invalid level. Use one of: ${VALID_LEVELS.join(', ')}` });
  }
  res.json({ level, words: vocabularyData[level] });
});

module.exports = router;
