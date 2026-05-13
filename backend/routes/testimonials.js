const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET approved testimonials
router.get('/', async (req, res) => {
  try {
    const result = await query("SELECT * FROM testimonials WHERE approved=1 ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
