const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// --- Staff Endpoints ---

router.get('/staff', async (req, res) => {
  try {
    const result = await query("SELECT * FROM attendance_staff WHERE status='active' ORDER BY name ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/staff', async (req, res) => {
  try {
    const { name, role, daily_salary, photo_url } = req.body;
    await query("INSERT INTO attendance_staff (name, role, daily_salary, photo_url) VALUES ($1, $2, $3, $4)", [name, role, daily_salary, photo_url]);
    res.json({ success: true, message: 'Staff member added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/staff/:id', async (req, res) => {
  try {
    const { name, role, daily_salary, photo_url } = req.body;
    await query("UPDATE attendance_staff SET name=$1, role=$2, daily_salary=$3, photo_url=$4 WHERE id=$5", [name, role, daily_salary, photo_url, req.params.id]);
    res.json({ success: true, message: 'Staff member updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    await query("UPDATE attendance_staff SET status='inactive' WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Attendance Logic ---

const calculateDeduction = (checkInTime, dailySalary) => {
  if (!checkInTime) return 0;
  
  // Format is "HH:MM"
  const [hours, minutes] = checkInTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  const threshold1030 = 10 * 60 + 30;
  const threshold1130 = 11 * 60 + 30;
  const threshold1400 = 14 * 60;
  
  if (totalMinutes <= threshold1030) return 0;
  if (totalMinutes <= threshold1130) return 100;
  if (totalMinutes <= threshold1400) return 200;
  return Math.round(dailySalary * 0.5); // 50% deduction
};

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const staff = await query("SELECT * FROM attendance_staff WHERE status='active'");
    const records = await query("SELECT * FROM attendance_records WHERE date=$1", [today]);
    
    const data = staff.rows.map(s => {
      const record = records.rows.find(r => r.staff_id === s.id);
      return {
        ...s,
        attendance: record || null
      };
    });
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/checkin', async (req, res) => {
  try {
    const { staff_id, check_in } = req.body; // check_in like "10:45"
    const today = new Date().toISOString().split('T')[0];
    
    const staffResult = await query("SELECT daily_salary FROM attendance_staff WHERE id=$1", [staff_id]);
    if (staffResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Staff not found' });
    
    const dailySalary = staffResult.rows[0].daily_salary;
    const deduction = calculateDeduction(check_in, dailySalary);
    const finalSalary = dailySalary - deduction;
    
    // Check if record already exists
    const existing = await query("SELECT id FROM attendance_records WHERE staff_id=$1 AND date=$2", [staff_id, today]);
    
    if (existing.rows.length > 0) {
      await query("UPDATE attendance_records SET check_in=$1, deduction=$2, final_salary=$3 WHERE id=$4", [check_in, deduction, final_salary, existing.rows[0].id]);
    } else {
      await query("INSERT INTO attendance_records (staff_id, date, check_in, base_salary, deduction, final_salary) VALUES ($1, $2, $3, $4, $5, $6)", 
        [staff_id, today, check_in, dailySalary, deduction, final_salary]);
    }
    
    res.json({ success: true, message: 'Check-in recorded' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const { staff_id, check_out } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await query("UPDATE attendance_records SET check_out=$1 WHERE staff_id=$2 AND date=$3", [check_out, staff_id, today]);
    res.json({ success: true, message: 'Check-out recorded' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Reports & Summary ---

router.get('/history', async (req, res) => {
  try {
    const { month, staff_id } = req.query; // month like "2024-05"
    let q = "SELECT r.*, s.name as staff_name FROM attendance_records r JOIN attendance_staff s ON r.staff_id = s.id";
    const params = [];
    
    if (month || staff_id) {
      q += " WHERE";
      if (month) {
        q += " r.date LIKE $" + (params.length + 1);
        params.push(month + '%');
      }
      if (staff_id) {
        if (month) q += " AND";
        q += " r.staff_id = $" + (params.length + 1);
        params.push(staff_id);
      }
    }
    
    q += " ORDER BY r.date DESC";
    const result = await query(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/summary/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const staff = await query("SELECT id, name, daily_salary FROM attendance_staff WHERE status='active'");
    const records = await query("SELECT staff_id, final_salary, deduction FROM attendance_records WHERE date LIKE $1", [month + '%']);
    const adjustments = await query("SELECT staff_id, amount FROM salary_adjustments WHERE month=$1", [month]);
    
    const summary = staff.rows.map(s => {
      const staffRecords = records.rows.filter(r => r.staff_id === s.id);
      const staffAdjustments = adjustments.rows.filter(a => a.staff_id === s.id);
      
      const totalEarned = staffRecords.reduce((sum, r) => sum + r.final_salary, 0);
      const totalDeductions = staffRecords.reduce((sum, r) => sum + r.deduction, 0);
      const adjustmentAmount = staffAdjustments.reduce((sum, a) => sum + a.amount, 0);
      
      return {
        id: s.id,
        name: s.name,
        days_present: staffRecords.length,
        total_salary: totalEarned + adjustmentAmount,
        total_deductions: totalDeductions,
        adjustment: adjustmentAmount
      };
    });
    
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/adjust', async (req, res) => {
  try {
    const { staff_id, month, amount, reason } = req.body;
    await query("INSERT INTO salary_adjustments (staff_id, month, amount, reason) VALUES ($1, $2, $3, $4)", [staff_id, month, amount, reason]);
    res.json({ success: true, message: 'Adjustment added' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
