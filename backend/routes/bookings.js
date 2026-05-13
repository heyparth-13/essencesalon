const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// --- Public Client Routes ---

// POST new booking
router.post('/', async (req, res) => {
  const { full_name, phone, email, service, staff_pref, date_pref, time_slot, message } = req.body;

  if (!full_name || !phone || !service) {
    return res.status(400).json({ success: false, error: 'Name, phone and service are required.' });
  }

  const sql = `INSERT INTO bookings (full_name, phone, email, service, staff_pref, date_pref, time_slot, message)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
  try {
    const result = await query(sql, [full_name, phone, email, service, staff_pref, date_pref, time_slot, message]);
    res.json({
      success: true,
      message: `Thank you ${full_name}! Your booking request has been received.`,
      booking_id: result.rows[0].id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Admin Routes ---

// GET all bookings
router.get('/list', async (req, res) => {
  try {
    const result = await query("SELECT * FROM bookings ORDER BY created_at DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status
router.patch('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await query("UPDATE bookings SET status=$1 WHERE id=$2", [status, req.params.id]);
    res.json({ success: true, message: `Booking #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await query("DELETE FROM bookings WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: `Booking #${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
