const API = '/api';
let authToken = sessionStorage.getItem('essence_admin_token') || '';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        document.getElementById('loginOverlay').style.display = 'none';
        loadAll();
    }
});

function attemptLogin() {
    const pwd = document.getElementById('adminPassword').value;
    if (!pwd) return;
    
    // Test the password by fetching stats
    fetch(`${API}/admin/stats`, { headers: { 'x-admin-password': pwd } })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                authToken = pwd;
                sessionStorage.setItem('essence_admin_token', pwd);
                document.getElementById('loginOverlay').style.display = 'none';
                document.getElementById('loginError').style.display = 'none';
                loadAll();
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        })
        .catch(() => {
            document.getElementById('loginError').style.display = 'block';
        });
}

// Wrapper for fetch to include auth headers
async function authFetch(url, options = {}) {
    options.headers = { ...options.headers, 'x-admin-password': authToken };
    const res = await fetch(url, options);
    if (res.status === 401) {
        sessionStorage.removeItem('essence_admin_token');
        document.getElementById('loginOverlay').style.display = 'flex';
        throw new Error('Unauthorized');
    }
    return res;
}

function loadAll() {
    loadStats();
    loadBookings();
}

// --- Core Functions ---

async function loadStats() {
    try {
        const r = await authFetch(`${API}/admin/stats`);
        const { data } = await r.json();
        
        document.getElementById('sTotal').textContent = data.total ?? 0;
        document.getElementById('sPending').textContent = data.pending ?? 0;
        document.getElementById('sConfirmed').textContent = data.confirmed ?? 0;
        document.getElementById('sCompleted').textContent = data.completed ?? 0;
    } catch(e) { 
        console.error('Stats loading failed:', e); 
    }
}

async function loadBookings() {
    const tbody = document.getElementById('bookingsBody');
    if (!tbody) return;

    try {
        const r = await authFetch(`${API}/admin/bookings/list`);
        const { data } = await r.json();
        
        if (!data || !data.length) { 
            tbody.innerHTML = '<tr><td colspan="9" class="empty">No bookings yet.</td></tr>'; 
            return; 
        }

        tbody.innerHTML = data.map(b => `
            <tr id="row-${b.id}">
                <td style="color:#aaa">#${b.id}</td>
                <td><strong>${b.full_name}</strong>${b.email ? `<br><small style="color:#aaa">${b.email}</small>` : ''}</td>
                <td><a href="tel:${b.phone}" style="color:var(--green)">${b.phone}</a></td>
                <td>${b.service}</td>
                <td style="color:var(--mid)">${b.staff_pref || '—'}</td>
                <td style="font-size:0.78rem">${b.date_pref || '—'}<br><small style="color:#aaa">${b.time_slot || ''}</small></td>
                <td>
                    <select class="status-sel" onchange="updateStatus(${b.id}, this.value, '${encodeURIComponent(b.phone)}', '${encodeURIComponent(b.full_name)}', '${encodeURIComponent(b.service)}', '${encodeURIComponent(b.date_pref || '')}', '${encodeURIComponent(b.time_slot || '')}')">
                        ${['pending','confirmed','completed','cancelled'].map(s => `<option value="${s}"${b.status===s?' selected':''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td style="font-size:0.75rem;color:#aaa">${new Date(b.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td style="white-space:nowrap">
                    <button class="wa-btn" onclick="sendWA('${encodeURIComponent(b.phone)}', '${encodeURIComponent(b.full_name)}', '${encodeURIComponent(b.service)}', '${encodeURIComponent(b.date_pref || '')}', '${encodeURIComponent(b.time_slot || '')}')" title="Send WhatsApp">💬</button>
                    <button class="del-btn" onclick="deleteBooking(${b.id})" title="Delete">🗑</button>
                </td>
            </tr>`).join('');
    } catch(e) {
        console.error('Bookings loading failed:', e);
        tbody.innerHTML = `<tr><td colspan="9" class="empty">⚠ Server not running or error fetching data.</td></tr>`;
    }
}

async function updateStatus(id, status, phoneEnc, nameEnc, serviceEnc, dateEnc, timeEnc) {
    try {
        await authFetch(`${API}/admin/bookings/${id}`, { 
            method:'PATCH', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({status}) 
        });
        loadStats();

        if (status === 'confirmed' && phoneEnc) {
            if (confirm('Booking confirmed! Do you want to send a WhatsApp confirmation message to the client?')) {
                sendWA(phoneEnc, nameEnc, serviceEnc, dateEnc, timeEnc);
            }
        }
    } catch (e) {
        console.error('Status update failed:', e);
        alert('Failed to update status.');
    }
}

function sendWA(phoneEnc, nameEnc, serviceEnc, dateEnc, timeEnc) {
    const phone = decodeURIComponent(phoneEnc);
    const name = decodeURIComponent(nameEnc);
    const service = decodeURIComponent(serviceEnc);
    const date = decodeURIComponent(dateEnc);
    const time = decodeURIComponent(timeEnc);
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    
    let text = `Hello ${name},\n\nYour booking for *${service}* at *Essence Salon* has been confirmed! ✅\n`;
    if (date) text += `\n📅 Date: ${date}`;
    if (time) text += `\n⏰ Time: ${time}`;
    text += `\n\nWe look forward to seeing you. Thank you!`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
}

async function deleteBooking(id) {
    if (!confirm('Delete this booking permanently?')) return;
    try {
        await authFetch(`${API}/admin/bookings/${id}`, { method:'DELETE' });
        document.getElementById(`row-${id}`)?.remove();
        loadStats();
    } catch (e) {
        console.error('Delete failed:', e);
        alert('Failed to delete booking.');
    }
}
