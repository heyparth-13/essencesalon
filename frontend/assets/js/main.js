const API = '/api';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Add js-enabled class for animations
    document.body.classList.add('js-enabled');
    
    // Initialize Reveal Observer
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.05 });
    
    document.querySelectorAll('.reveal').forEach(r => obs.observe(r));
    window.revealObserver = obs; // Make global for dynamic content

    // Set min date for booking (Asia/Kolkata Timezone)
    const dateInput = document.getElementById('f_date');
    if (dateInput) {
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
        dateInput.min = todayStr;
    }

    // Load Dynamic Content
    loadServices();
    loadTeam();
    loadTestimonials();
    
    // Scroll handling for Nav
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Update copyright year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // Form Validation Logic
    setupFormValidation();
});

// --- Validation Functions ---
function setupFormValidation() {
    const phoneInput = document.getElementById('f_phone');
    const emailInput = document.getElementById('f_email');
    const nameInput = document.getElementById('f_name');
    const serviceInput = document.getElementById('f_service');
    const timeInput = document.getElementById('f_time');
    const dateInput = document.getElementById('f_date');
    const submitBtn = document.getElementById('submitBtn');
    
    const phoneError = document.getElementById('phoneError');
    const emailError = document.getElementById('emailError');
    const timeError = document.getElementById('timeError');

    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateForm() {
        let isValid = true;

        if (!nameInput?.value.trim() || !serviceInput?.value) {
            isValid = false;
        }

        if (phoneInput && phoneInput.value) {
            if (!phoneRegex.test(phoneInput.value)) {
                phoneInput.style.borderColor = '#ff6b6b';
                if (phoneError) phoneError.style.display = 'block';
                isValid = false;
            } else {
                phoneInput.style.borderColor = '#4caf50';
                if (phoneError) phoneError.style.display = 'none';
            }
        } else {
            if (phoneInput) phoneInput.style.borderColor = 'var(--border)';
            if (phoneError) phoneError.style.display = 'none';
            isValid = false;
        }

        if (emailInput && emailInput.value) {
            if (!emailRegex.test(emailInput.value)) {
                emailInput.style.borderColor = '#ff6b6b';
                if (emailError) emailError.style.display = 'block';
                isValid = false;
            } else {
                emailInput.style.borderColor = '#4caf50';
                if (emailError) emailError.style.display = 'none';
            }
        } else {
            if (emailInput) emailInput.style.borderColor = 'var(--border)';
            if (emailError) emailError.style.display = 'none';
        }

        if (timeInput && timeInput.value) {
            const [hours, mins] = timeInput.value.split(':').map(Number);
            if (hours < 10 || hours > 20 || (hours === 20 && mins > 0) || (mins !== 0 && mins !== 30)) {
                timeInput.style.borderColor = '#ff6b6b';
                if (timeError) timeError.style.display = 'block';
                isValid = false;
            } else {
                timeInput.style.borderColor = '#4caf50';
                if (timeError) timeError.style.display = 'none';
            }
        } else {
            if (timeInput) timeInput.style.borderColor = 'var(--border)';
            if (timeError) timeError.style.display = 'none';
            isValid = false;
        }

        if (dateInput && dateInput.value) {
            dateInput.style.borderColor = '#4caf50';
        } else if (dateInput) {
            dateInput.style.borderColor = 'var(--border)';
        }

        if (nameInput && nameInput.value.trim()) nameInput.style.borderColor = '#4caf50';
        if (serviceInput && serviceInput.value) serviceInput.style.borderColor = '#4caf50';

        if (submitBtn) {
            submitBtn.disabled = !isValid;
            submitBtn.style.opacity = isValid ? '1' : '0.5';
            submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
        }
    }

    if (phoneInput) phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
        validateForm();
    });
    if (emailInput) emailInput.addEventListener('input', validateForm);
    if (nameInput) nameInput.addEventListener('input', validateForm);
    if (serviceInput) serviceInput.addEventListener('change', validateForm);
    if (timeInput) timeInput.addEventListener('change', validateForm);
    if (dateInput) dateInput.addEventListener('change', validateForm);
}


// --- Core Functions ---

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    const icons = { 'Hair Services': '✂', 'Men\'s Grooming': '🪒', 'Skin & Facial': '💆', 'Body Treatments': '🌿', 'Nail Care': '💅', 'Bridal Services': '👰' };

    try {
        const res = await fetch(`${API}/services`);
        const { data } = await res.json();
        
        if (!data || data.length === 0) throw new Error('No services found');

        // Deduplicate services by name to prevent double-rendering
        const seenNames = new Set();
        const uniqueServices = data.filter(s => {
            if (seenNames.has(s.name)) return false;
            seenNames.add(s.name);
            return true;
        });

        const categories = {};
        uniqueServices.forEach(s => {
            if (!categories[s.category]) categories[s.category] = [];
            categories[s.category].push(s);
        });

        grid.innerHTML = Object.keys(categories).map(cat => `
            <div class="svc-card reveal">
                <span class="svc-emoji">${icons[cat] || '✨'}</span>
                <h3 class="svc-name">${cat}</h3>
                <ul class="svc-list">
                    ${categories[cat].map(s => `
                        <li>
                            <span class="svc-item-name">${s.name}</span>
                            <span class="svc-item-price">₹${s.price_from}+</span>
                        </li>
                    `).join('')}
                </ul>
            </div>`).join('');
            
        document.querySelectorAll('#servicesGrid .reveal').forEach(r => window.revealObserver.observe(r));
    } catch (err) {
        console.error('Service loading failed:', err);
        grid.innerHTML = '<div style="text-align:center;grid-column:1/-1;padding:3rem;color:var(--accent)">Unable to load services at this time.</div>';
    }
}

async function loadTeam() {
    const container = document.getElementById('teamContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API}/staff`);
        const { data } = await res.json();
        
        // Deduplicate staff by name to prevent double-rendering
        const seen = new Set();
        const uniqueData = data.filter(s => {
            if (seen.has(s.name)) return false;
            seen.add(s.name);
            return true;
        });
        
        const isHead = (s) => String(s.is_head) === '1' || s.is_head === true || String(s.is_head).toLowerCase() === 'true';
        const heads = uniqueData.filter(isHead);
        const others = uniqueData.filter(s => !isHead(s));
        
        let html = '';
        
        if (heads.length) {
            html += `<div class="team-grid">
                ${heads.map(s => `
                <div class="member-card reveal">
                    <div class="member-img">
                        <img src="images/founder_${s.name.toLowerCase().split(' ')[0]}.jpg" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1a1a1a&color=B8963E&size=500'" 
                             alt="${s.name}">
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">${s.name}</h3>
                        <span class="member-role">${s.role}</span>
                        <p class="member-desc">${s.specialty || 'Director & Master Stylist'}</p>
                        <div style="margin-top:1rem;display:flex;gap:1rem;color:var(--accent);font-size:1.2rem;min-height:24px;">
                            ${s.phone ? `<a href="tel:${s.phone}" style="color:var(--accent);text-decoration:none;" title="Call">📱</a> <a href="https://wa.me/91${s.phone}" style="color:var(--accent);text-decoration:none;" title="WhatsApp" target="_blank">💬</a>` : ''}
                        </div>
                    </div>
                </div>`).join('')}
            </div>`;
        }
        
        if (others.length) {
            html += `<div class="team-grid" style="grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;margin-top:4rem">
                ${others.map(s => `
                <div class="member-card reveal" style="background:var(--bg2);border:1px solid var(--border);padding:2rem;text-align:center;display:flex;flex-direction:column;align-items:center;">
                    <div style="width:100px;height:100px;border-radius:50%;overflow:hidden;margin-bottom:1.5rem;border:2px solid var(--accent)">
                        <img src="images/staff_${s.name.toLowerCase().split(' ')[0]}.jpg" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1a1a1a&color=B8963E&size=500'" 
                             alt="${s.name}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <h4 class="member-name" style="font-size:1.3rem;margin-bottom:0.3rem">${s.name}</h4>
                    <span class="member-role" style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text2)">${s.role}</span>
                    <div style="margin-top:1rem;font-size:0.9rem;color:var(--text2)">${s.specialty || ''}</div>
                    <div style="margin-top:0.5rem;font-size:0.85rem;color:var(--text3)">${s.experience || 'Experienced Specialist'}</div>
                    <div style="margin-top:1rem;display:flex;gap:1rem;color:var(--accent);font-size:1.2rem;min-height:24px;">
                        ${s.phone ? `<a href="tel:${s.phone}" style="color:var(--accent);text-decoration:none;" title="Call">📱</a> <a href="https://wa.me/91${s.phone}" style="color:var(--accent);text-decoration:none;" title="WhatsApp" target="_blank">💬</a>` : ''}
                    </div>
                </div>`).join('')}
            </div>`;
        }
        
        container.innerHTML = html;
        document.querySelectorAll('#teamContainer .reveal').forEach(r => window.revealObserver.observe(r));
    } catch (err) {
        console.error('Team loading failed:', err);
    }
}

async function loadTestimonials() {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;
    
    try {
        const res = await fetch(`${API}/testimonials`);
        const { data } = await res.json();
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3)">No reviews yet. Be the first to share your experience!</div>';
            return;
        }

        // Deduplicate testimonials by client name
        const seen = new Set();
        const uniqueData = data.filter(t => {
            if (seen.has(t.client)) return false;
            seen.add(t.client);
            return true;
        });

        const gridHtml = `
            <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;padding:0 5vw">
                ${uniqueData.map(t => `
                <div class="reveal" style="background:var(--bg2);padding:2.5rem;border:1px solid var(--border)">
                    <div style="color:var(--accent);font-size:1.5rem;margin-bottom:1rem">${'★'.repeat(t.rating || 5)}</div>
                    <p style="color:var(--text2);font-style:italic;line-height:1.7;margin-bottom:1.5rem">"${t.review}"</p>
                    <h4 style="font-family:var(--font-display);font-size:1.1rem">- ${t.client}</h4>
                    ${t.service ? `<small style="color:var(--accent);text-transform:uppercase;letter-spacing:0.1em;font-size:0.7rem">${t.service}</small>` : ''}
                </div>`).join('')}
            </div>`;
        
        container.outerHTML = gridHtml;
        document.querySelectorAll('#testimonials .reveal').forEach(r => window.revealObserver.observe(r));
    } catch (err) {
        console.error('Testimonials loading failed:', err);
        if (container) container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3)">Unable to load reviews at this time.</div>';
    }
}

async function submitBooking() {
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('formMsg');
    
    const formData = {
        full_name: document.getElementById('f_name').value.trim(),
        phone: document.getElementById('f_phone').value.trim(),
        email: (document.getElementById('f_email')?.value.trim() || ''),
        service: document.getElementById('f_service').value,
        staff_pref: (document.getElementById('f_staff')?.value || 'Any Available Stylist'),
        date_pref: document.getElementById('f_date').value,
        time_slot: (document.getElementById('f_time')?.value || ''),
        message: (document.getElementById('f_msg')?.value.trim() || '')
    };
    
    if (!formData.full_name || !formData.phone || !formData.service) {
        msg.innerHTML = '<span style="color:#ff6b6b">⚠ Please fill in all required fields.</span>';
        return;
    }
    
    btn.disabled = true; 
    btn.textContent = 'Processing...';

    try {
        const res = await fetch(`${API}/bookings`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(formData) 
        });
        const result = await res.json();
        
        const waText = `New Inquiry from Website:\n\nName: ${formData.full_name}\nPhone: ${formData.phone}\nService: ${formData.service}\nDate: ${formData.date_pref || 'Not specified'}`;
        const waUrl = `https://wa.me/919909706587?text=${encodeURIComponent(waText)}`;
        
        window.open(waUrl, '_blank');
        msg.innerHTML = `<span style="color:var(--accent)">✅ Redirecting to WhatsApp...</span>`;
        
        ['f_name', 'f_phone', 'f_email', 'f_date', 'f_time', 'f_msg'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
    } catch (e) {
        console.error('Booking failed:', e);
        msg.innerHTML = '<span style="color:#ff6b6b">⚠ Something went wrong. Please try again.</span>';
    } finally {
        btn.disabled = false; 
        btn.textContent = 'Confirm Reservation';
        setTimeout(() => { if(msg) msg.innerHTML = ''; }, 5000);
    }
}