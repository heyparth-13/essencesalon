const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase, db } = require('./config/db');

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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Essence2026';

app.use('/api/admin', (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'];
  if (providedPassword === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized. Invalid or missing password.' });
  }
});

app.use('/api/admin/bookings', bookingRoutes); // Re-using booking router for admin paths

app.get('/api/admin/stats', (req, res) => {
  db.serialize(() => {
    const stats = {};
    db.get("SELECT COUNT(*) as total FROM bookings", (e, r) => { stats.total = r ? r.total : 0; });
    db.get("SELECT COUNT(*) as pending FROM bookings WHERE status='pending'", (e, r) => { stats.pending = r ? r.pending : 0; });
    db.get("SELECT COUNT(*) as confirmed FROM bookings WHERE status='confirmed'", (e, r) => { stats.confirmed = r ? r.confirmed : 0; });
    db.get("SELECT COUNT(*) as completed FROM bookings WHERE status='completed'", (e, r) => {
      stats.completed = r ? r.completed : 0;
      res.json({ success: true, data: stats });
    });
  });
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
