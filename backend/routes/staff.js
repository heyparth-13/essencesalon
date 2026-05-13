const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all staff
router.get('/', async (req, res) => {
  try {
    const result = await query("SELECT * FROM staff ORDER BY is_head DESC, id ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
