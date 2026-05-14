const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

let pool;
let db;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('📡 Using PostgreSQL Database');
} else {
  // Use /tmp for SQLite on Vercel as it's the only writable directory
  const dbPath = process.env.VERCEL 
    ? path.join('/tmp', 'essence_salon.db') 
    : path.join(__dirname, '../essence_salon.db');
    
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ SQLite connection error:', err.message);
    else console.log(`📁 Using SQLite Database at: ${dbPath}`);
  });
}

const query = async (text, params = []) => {
  try {
    if (isPostgres) {
      return await pool.query(text, params);
    } else {
      if (!db) throw new Error('Database not initialized');
      
      let sqliteText = text.replace(/\$\d+/g, '?');
      const hasReturning = sqliteText.toUpperCase().includes('RETURNING');
      if (hasReturning) {
        sqliteText = sqliteText.split(/RETURNING/i)[0].trim();
      }

      return new Promise((resolve, reject) => {
        const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
        const method = isSelect ? 'all' : 'run';
        
        db[method](sqliteText, params, function(err, rows) {
          if (err) reject(err);
          else {
            const result = { rows: rows || [], lastID: this?.lastID, changes: this?.changes };
            if (hasReturning) result.rows = [{ id: this.lastID }];
            resolve(result);
          }
        });
      });
    }
  } catch (err) {
    console.error('❌ Database Query Error:', err.message);
    
    // Fallback for SELECT queries in serverless environments
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      try {
        const fallback = require('./fallback_data.json');
        if (text.toLowerCase().includes('staff')) return { rows: fallback.staff };
        if (text.toLowerCase().includes('services')) return { rows: fallback.services };
        if (text.toLowerCase().includes('testimonials')) return { rows: fallback.testimonials };
      } catch (fErr) {
        console.error('❌ Fallback Error:', fErr.message);
      }
    }
    throw err;
  }
};

let isInitializing = false;
const initializeDatabase = async () => {
  if (isInitializing) return;
  isInitializing = true;
  
  try {
    const autoIncrement = isPostgres ? 'SERIAL' : 'INTEGER';
    const primaryKey = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

    // Bookings table
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

    // Staff table
    await query(`CREATE TABLE IF NOT EXISTS staff (
      id         ${primaryKey},
      name       TEXT NOT NULL,
      role       TEXT NOT NULL,
      experience TEXT NOT NULL,
      specialty  TEXT,
      phone      TEXT,
      is_head    INTEGER DEFAULT 0
    )`);

    // Services table
    await query(`CREATE TABLE IF NOT EXISTS services (
      id          ${primaryKey},
      name        TEXT NOT NULL,
      description TEXT,
      price_from  INTEGER,
      price_upto  INTEGER,
      category    TEXT,
      gender      TEXT DEFAULT 'unisex'
    )`);

    // Testimonials table
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
    // Seed Staff
    const staffCount = await query("SELECT COUNT(*) as count FROM staff");
    const count = isPostgres ? parseInt(staffCount.rows[0].count) : staffCount.rows[0].count;
    
    if (count === 0) {
      const staff = [
        ['Vipul Valand', 'Co-Founder & Head Stylist', '20+ Years', 'Master Hair Styling, Advanced Colour, Men & Women Cuts', '9909706587', 1],
        ['Bhavesh Sharma', 'Co-Founder & Beauty Director', '22+ Years', 'Bridal Makeovers, Skin Treatments, Unisex Styling, Spa Therapies', '9909706587', 1],
        ['Mahesh Valand', "Men's Specialist", '15+ Years', "Men's Haircut, Beard Grooming, Shave, Hair Spa", null, 0],
        ['Dharti', "Women's Specialist", '5+ Years', "Ladies Haircut, Facial, Waxing, Bridal Prep, Mehandi", null, 0],
        ['Ankit Sharma', "Men's Specialist", '8+ Years', "Men's Cut, Beard Art, Colour, Hair Treatments", null, 0]
      ];
      for (const s of staff) {
        await query(`INSERT INTO staff (name, role, experience, specialty, phone, is_head) VALUES ($1,$2,$3,$4,$5,$6)`, s);
      }
      console.log('✅ Staff data seeded');
    }

    // Seed Services
    const serviceCount = await query("SELECT COUNT(*) as count FROM services");
    const sCount = isPostgres ? parseInt(serviceCount.rows[0].count) : serviceCount.rows[0].count;

    if (sCount === 0) {
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
      for (const s of services) {
        await query(`INSERT INTO services (name, description, price_from, price_upto, category, gender) VALUES ($1,$2,$3,$4,$5,$6)`, s);
      }
      console.log('✅ Services data seeded');
    }
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
  }
};

module.exports = { pool, query, initializeDatabase };
