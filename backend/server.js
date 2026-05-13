require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase, query } = require('./config/db');

// Import Routes
const staffRoutes = require('./routes/staff');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const testimonialRoutes = require('./routes/testimonials');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Initialize Database ──────────────────────────────────────
initializeDatabase();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/testimonials', testimonialRoutes);

// ── Admin Specific Endpoints ────────────────────────────────
// Authentication Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '7259';

app.use('/api/admin', (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'];
  if (providedPassword === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized. Invalid or missing password.' });
  }
});

app.use('/api/admin/bookings', bookingRoutes); // Re-using booking router for admin paths

app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = {};
    const total = await query("SELECT COUNT(*) as total FROM bookings");
    const pending = await query("SELECT COUNT(*) as pending FROM bookings WHERE status='pending'");
    const confirmed = await query("SELECT COUNT(*) as confirmed FROM bookings WHERE status='confirmed'");
    const completed = await query("SELECT COUNT(*) as completed FROM bookings WHERE status='completed'");

    stats.total = total.rows[0].total || 0;
    stats.pending = pending.rows[0].pending || 0;
    stats.confirmed = confirmed.rows[0].confirmed || 0;
    stats.completed = completed.rows[0].completed || 0;

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── SPA Routing ─────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.url.startsWith('/api') || req.url.includes('.')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start Server ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🌿 Essence Salon & Spa API running at http://localhost:${PORT}`);
    console.log(`📋 Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`🌐 Website:     http://localhost:${PORT}\n`);
  });
}

module.exports = app;
