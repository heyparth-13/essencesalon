const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool;
let db;
const isPostgres = !!process.env.DATABASE_URL;
const isVercel = !!process.env.VERCEL;

let fallbackData = { staff: [], services: [], testimonials: [] };
try {
  fallbackData = require('./fallback_data.json');
  console.log('📦 Fallback data loaded successfully via require');
} catch (e) {
  console.error('❌ Failed to load fallback data:', e.message);
}

if (isPostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('📡 Using PostgreSQL Database');
} else if (!isVercel) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, '../essence_salon.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) console.error('❌ SQLite connection error:', err.message);
      else console.log(`📁 Using SQLite Database at: ${dbPath}`);
    });
  } catch (e) {
    console.error('❌ SQLite loading error:', e.message);
  }
}

const query = async (text, params = []) => {
  const isSelect = text.trim().toUpperCase().startsWith('SELECT');

  try {
    let result;
    if (isPostgres) {
      result = await pool.query(text, params);
    } else if (db) {
      let sqliteText = text.replace(/\$\d+/g, '?');
      const hasReturning = sqliteText.toUpperCase().includes('RETURNING');
      if (hasReturning) sqliteText = sqliteText.split(/RETURNING/i)[0].trim();

      result = await new Promise((resolve, reject) => {
        const method = isSelect ? 'all' : 'run';
        db[method](sqliteText, params, function (err, rows) {
          if (err) reject(err);
          else {
            const r = { rows: rows || [], lastID: this?.lastID, changes: this?.changes };
            if (hasReturning) r.rows = [{ id: this.lastID }];
            resolve(r);
          }
        });
      });
    } else {
      throw new Error('Database not available');
    }

    // If SELECT returned 0 rows for key tables, use JSON fallback
    if (isSelect && result && result.rows && result.rows.length === 0) {
      const lc = text.toLowerCase();
      if (lc.includes('from staff') && !lc.includes('count')) {
        console.log('⚠️ Empty staff from DB, using JSON fallback');
        return { rows: fallbackData.staff || [] };
      }
      if (lc.includes('from services') && !lc.includes('count')) {
        console.log('⚠️ Empty services from DB, using JSON fallback');
        return { rows: fallbackData.services || [] };
      }
      if (lc.includes('from testimonials') && !lc.includes('count')) {
        console.log('⚠️ Empty testimonials from DB, using JSON fallback');
        return { rows: fallbackData.testimonials || [] };
      }
    }

    return result;
  } catch (err) {
    if (isSelect) {
      console.log('🔄 Query failed, using JSON fallback for:', text);
      if (text.toLowerCase().includes('staff')) return { rows: fallbackData.staff || [] };
      if (text.toLowerCase().includes('service')) return { rows: fallbackData.services || [] };
      if (text.toLowerCase().includes('testimonial')) return { rows: fallbackData.testimonials || [] };
    }
    throw err;
  }
};

let isInitializing = false;
const initializeDatabase = async () => {
  if (isInitializing || (isVercel && !isPostgres)) return;
  isInitializing = true;

  try {
    const primaryKey = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

    await query(`CREATE TABLE IF NOT EXISTS bookings (
      id          ${primaryKey},
      full_name   TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT,
      service     TEXT NOT NULL,
      staff_pref  TEXT DEFAULT 'No Preference',
      date_pref   TEXT,
      time_slot   TEXT,
      message     TEXT,
      status      TEXT DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS staff (
      id         ${primaryKey},
      name       TEXT NOT NULL,
      role       TEXT NOT NULL,
      experience TEXT NOT NULL,
      specialty  TEXT,
      phone      TEXT,
      is_head    INTEGER DEFAULT 0
    )`);

    await query(`CREATE TABLE IF NOT EXISTS services (
      id          ${primaryKey},
      name        TEXT NOT NULL,
      description TEXT,
      price_from  INTEGER,
      price_upto  INTEGER,
      category    TEXT,
      gender      TEXT DEFAULT 'unisex'
    )`);

    await query(`CREATE TABLE IF NOT EXISTS testimonials (
      id        ${primaryKey},
      client    TEXT NOT NULL,
      review    TEXT NOT NULL,
      rating    INTEGER DEFAULT 5,
      service   TEXT,
      approved  INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Database tables initialized');
    await seedData();
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
  }
};

const seedData = async () => {
  try {
    // --- Staff ---
    const staffCount = await query("SELECT COUNT(*) as count FROM staff");
    const count = isPostgres ? parseInt(staffCount.rows[0].count) : staffCount.rows[0].count;

    const staff = [
      ['Vipul Valand', 'Co-Founder & Head Stylist', '20+ Years', 'Master Hair Styling, Advanced Colour, Men & Women Cuts', '9909706587', 1],
      ['Bhavesh Sharma', 'Co-Founder & Beauty Director', '22+ Years', 'Bridal Makeovers, Skin Treatments, Unisex Styling, Spa Therapies', '9909706587', 1],
      ['Mahesh Valand', "Men's Specialist", '15+ Years', "Men's Haircut, Beard Grooming, Shave, Hair Spa", null, 0],
      ['Dharti', "Women's Specialist", '5+ Years', "Ladies Haircut, Facial, Waxing, Bridal Prep, Mehandi", null, 0],
      ['Ankit Sharma', "Men's Specialist", '8+ Years', "Men's Cut, Beard Art, Colour, Hair Treatments", null, 0]
    ];

    if (count !== staff.length) {
      console.log('🔄 Re-seeding staff (count mismatch)...');
      await query("DELETE FROM staff");
      for (const s of staff) {
        await query(`INSERT INTO staff (name, role, experience, specialty, phone, is_head) VALUES ($1,$2,$3,$4,$5,$6)`, s);
      }
      console.log('✅ Staff data seeded');
    }

    // --- Services ---
    const serviceCount = await query("SELECT COUNT(*) as count FROM services");
    const sCount = isPostgres ? parseInt(serviceCount.rows[0].count) : serviceCount.rows[0].count;

    const services = [
      ['Haircut & Styling', 'Precision cuts and styling.', 500, 1200, 'Hair', 'unisex'],
      ['Hair Color & Highlights', 'Advanced color techniques.', 2500, null, 'Hair', 'unisex'],
      ['Beard & Shave', 'Classic grooming for men.', 300, null, 'Men', 'men'],
      ['Hair Spa & Keratin', 'Deep conditioning treatments.', 500, 1000, 'Hair', 'unisex'],
      ['Facial & Skin Care', 'Brightening and anti-aging.', 1000, 4000, 'Skin', 'unisex'],
      ['Waxing & Threading', 'Precision body grooming.', 700, 2000, 'Body', 'women'],
      ['Nail Studio', 'Manicure and nail art.', 300, 1000, 'Nails', 'unisex'],
      ['Bridal Packages', 'Complete bridal beauty.', 10000, 20000, 'Bridal', 'women']
    ];

    if (sCount !== services.length) {
      console.log('🔄 Re-seeding services (count mismatch)...');
      await query("DELETE FROM services");
      for (const s of services) {
        await query(`INSERT INTO services (name, description, price_from, price_upto, category, gender) VALUES ($1,$2,$3,$4,$5,$6)`, s);
      }
      console.log('✅ Services data seeded');
    }

    // --- Testimonials ---
    const testCount = await query("SELECT COUNT(*) as count FROM testimonials");
    const tCount = isPostgres ? parseInt(testCount.rows[0].count) : testCount.rows[0].count;

    const testimonials = [
      ['Aarav Mehta', 'Best salon experience in Thaltej. Vipul is a master of his craft!', 5, 'Haircut', 1],
      ['Priya Shah', 'Loved the bridal package. Bhavesh and the team are absolutely amazing.', 5, 'Bridal', 1],
      ['Rohan Patel', 'Clean, professional and incredibly skilled. My go-to salon in Ahmedabad.', 5, 'Hair Spa', 1],
      ['Nisha Joshi', 'The facial treatment was heavenly. My skin glowed for weeks!', 5, 'Facial', 1],
      ['Karan Desai', 'Mahesh did an amazing beard art. Worth every rupee!', 5, 'Beard Grooming', 1],
      ['Simran Kaur', 'Dharti is so talented! My hair looks stunning after the keratin treatment.', 5, 'Hair Spa & Keratin', 1]
    ];

    if (tCount !== testimonials.length) {
      console.log('🔄 Seeding testimonials (count mismatch)...');
      await query("DELETE FROM testimonials");
      for (const t of testimonials) {
        await query(`INSERT INTO testimonials (client, review, rating, service, approved) VALUES ($1,$2,$3,$4,$5)`, t);
      }
      console.log('✅ Testimonials data seeded');
    }
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
  }
};

module.exports = { pool, query, initializeDatabase };
