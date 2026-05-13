const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const query = (text, params) => pool.query(text, params);

const initializeDatabase = async () => {
  try {
    // Bookings table
    await query(`CREATE TABLE IF NOT EXISTS bookings (
      id          SERIAL PRIMARY KEY,
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
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      role       TEXT NOT NULL,
      experience TEXT NOT NULL,
      specialty  TEXT,
      phone      TEXT,
      is_head    INTEGER DEFAULT 0
    )`);

    // Services table
    await query(`CREATE TABLE IF NOT EXISTS services (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      price_from  INTEGER,
      price_upto  INTEGER,
      category    TEXT,
      gender      TEXT DEFAULT 'unisex'
    )`);

    // Testimonials table
    await query(`CREATE TABLE IF NOT EXISTS testimonials (
      id        SERIAL PRIMARY KEY,
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
    const staffCount = await query("SELECT COUNT(*) FROM staff");
    if (parseInt(staffCount.rows[0].count) === 0) {
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
    const serviceCount = await query("SELECT COUNT(*) FROM services");
    if (parseInt(serviceCount.rows[0].count) === 0) {
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
