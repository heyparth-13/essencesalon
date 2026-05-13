const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all services
router.get('/', async (req, res) => {
  try {
    const result = await query("SELECT * FROM services ORDER BY id ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
