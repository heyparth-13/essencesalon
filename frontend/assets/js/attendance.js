const API_BASE = '/api/attendance';
const ADMIN_PIN = '7259';

let currentStaffData = [];
let currentMonth = new Date().toISOString().slice(0, 7);

// --- Auth Management ---
const checkAuth = () => {
  const isAuthed = localStorage.getItem('essence_attendance_auth');
  if (!isAuthed) {
    document.getElementById('login-overlay').style.display = 'flex';
  } else {
    document.getElementById('login-overlay').style.display = 'none';
    initApp();
  }
};

const handleLogin = () => {
  const pinInput = document.getElementById('pin-input').value;
  if (pinInput === ADMIN_PIN) {
    localStorage.setItem('essence_attendance_auth', 'true');
    document.getElementById('login-overlay').style.display = 'none';
    showNotification('Welcome back, Admin!', 'success');
    initApp();
  } else {
    showNotification('Invalid PIN', 'error');
    document.getElementById('pin-input').value = '';
  }
};

// --- App Initialization ---
const initApp = () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadDashboard();
};

const updateClock = () => {
  const now = new Date();
  document.getElementById('clock-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('clock-date').textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Module Navigation ---
const showModule = (moduleId) => {
  document.querySelectorAll('.module-section').forEach(s => s.style.display = 'none');
  document.getElementById(moduleId).style.display = 'block';
  
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`[onclick="showModule('${moduleId}')"]`).classList.add('active');

  if (moduleId === 'attendance-module') loadTodayAttendance();
  if (moduleId === 'staff-module') loadStaffList();
  if (moduleId === 'payroll-module') loadPayroll();
  if (moduleId === 'history-module') loadHistory();
};

// --- Data Fetching & UI ---

const loadDashboard = async () => {
  try {
    const res = await fetch(`${API_BASE}/today`);
    const { data } = await res.json();
    currentStaffData = data;
    
    const present = data.filter(s => s.attendance).length;
    const late = data.filter(s => s.attendance && s.attendance.deduction > 0).length;
    
    document.getElementById('total-staff-stat').textContent = data.length;
    document.getElementById('present-stat').textContent = present;
    document.getElementById('late-stat').textContent = late;
    
    renderAttendanceChart(present, data.length - present, late);
  } catch (err) {
    console.error(err);
  }
};

const loadTodayAttendance = async () => {
  const grid = document.getElementById('attendance-grid');
  grid.innerHTML = '<div class="loader">Loading...</div>';
  
  try {
    const res = await fetch(`${API_BASE}/today`);
    const { data } = await res.json();
    
    grid.innerHTML = data.map(s => `
      <div class="staff-card">
        <span class="staff-status ${s.attendance ? 'status-present' : 'status-absent'}">
          ${s.attendance ? 'Present' : 'Not In'}
        </span>
        <img src="${s.photo_url || 'https://via.placeholder.com/200'}" class="staff-img">
        <div class="staff-info">
          <h3>${s.name}</h3>
          <p class="text-muted">${s.role}</p>
          <div style="margin-top: 1rem; display: flex; gap: 10px;">
            ${!s.attendance 
              ? `<button class="btn btn-primary btn-sm" onclick="markAttendance(${s.id}, 'checkin')">Check In</button>`
              : !s.attendance.check_out 
                ? `<button class="btn btn-outline btn-sm" onclick="markAttendance(${s.id}, 'checkout')">Check Out</button>`
                : `<span class="gold-text">Shift Completed</span>`
            }
          </div>
          ${s.attendance ? `
            <div style="margin-top: 10px; font-size: 0.9rem;">
              <div>Check-in: ${s.attendance.check_in}</div>
              ${s.attendance.deduction > 0 ? `<div style="color: #f87171">Deduction: ₹${s.attendance.deduction}</div>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = 'Error loading data';
  }
};

const markAttendance = async (staffId, type) => {
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  try {
    const res = await fetch(`${API_BASE}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staffId, [type === 'checkin' ? 'check_in' : 'check_out']: timeStr })
    });
    
    if (res.ok) {
      showNotification(`${type === 'checkin' ? 'Checked In' : 'Checked Out'} at ${timeStr}`, 'success');
      loadTodayAttendance();
      loadDashboard();
    }
  } catch (err) {
    showNotification('Action failed', 'error');
  }
};

const loadStaffList = async () => {
  const tbody = document.getElementById('staff-table-body');
  try {
    const res = await fetch(`${API_BASE}/staff`);
    const { data } = await res.json();
    tbody.innerHTML = data.map(s => `
      <tr>
        <td><img src="${s.photo_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
        <td>${s.name}</td>
        <td>${s.role}</td>
        <td>₹${s.daily_salary}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editStaff(${s.id})">Edit</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {}
};

const loadPayroll = async () => {
  const tbody = document.getElementById('payroll-table-body');
  try {
    const res = await fetch(`${API_BASE}/summary/${currentMonth}`);
    const { data } = await res.json();
    tbody.innerHTML = data.map(s => `
      <tr>
        <td>${s.name}</td>
        <td>${s.days_present}</td>
        <td>₹${s.total_deductions}</td>
        <td>₹${s.adjustment}</td>
        <td class="gold-text">₹${s.total_salary}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="addAdjustment(${s.id})">Adjust</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {}
};

const loadHistory = async () => {
  const tbody = document.getElementById('history-table-body');
  try {
    const res = await fetch(`${API_BASE}/history?month=${currentMonth}`);
    const { data } = await res.json();
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.staff_name}</td>
        <td>${r.check_in}</td>
        <td>${r.check_out || '-'}</td>
        <td style="color: ${r.deduction > 0 ? '#f87171' : '#4ade80'}">₹${r.deduction}</td>
        <td>₹${r.final_salary}</td>
      </tr>
    `).join('');
  } catch (err) {}
};

// --- Helpers ---

const showNotification = (msg, type) => {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.style.borderLeftColor = type === 'success' ? '#d4af37' : '#f87171';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
};

const renderAttendanceChart = (present, absent, late) => {
  const ctx = document.getElementById('attendanceChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();
  
  window.myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [{
        data: [present - late, absent, late],
        backgroundColor: ['#d4af37', '#333', '#f87171'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
    }
  });
};

const exportToExcel = () => {
  const table = document.querySelector('.module-section[style*="display: block"] table');
  if (!table) return;
  const wb = XLSX.utils.table_to_book(table);
  XLSX.writeFile(wb, `Essence_Salon_${currentMonth}.xlsx`);
};

const exportToPDF = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Essence Salon Report", 10, 10);
  const table = document.querySelector('.module-section[style*="display: block"] table');
  doc.autoTable({ html: table });
  doc.save(`Essence_Salon_${currentMonth}.pdf`);
};

// Start
checkAuth();
