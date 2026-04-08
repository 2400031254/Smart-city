const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// ── API Helper ──────────────────────────────────
const API = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://smartcity-2-production.up.railway.app/api';

function getToken() { return localStorage.getItem('authToken'); }
function setToken(t) { localStorage.setItem('authToken', t); }
function clearToken() { localStorage.removeItem('authToken'); }

async function api(method, endpoint, body) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    const token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body)  opts.body = JSON.stringify(body);
    const res = await fetch(API + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

const storage = {
    local: {
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        get: (key, defaultValue = null) => {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        },
        remove: (key) => localStorage.removeItem(key)
    },
    session: {
        set: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
        get: (key, defaultValue = null) => {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        },
        remove: (key) => sessionStorage.removeItem(key)
    }
};

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function saveFormDraft(formId, data) {
    storage.session.set(`draft_${formId}`, data);
}

function loadFormDraft(formId) {
    return storage.session.get(`draft_${formId}`);
}

function clearFormDraft(formId) {
    storage.session.remove(`draft_${formId}`);
}

function checkAuth() {
    const user = storage.local.get('currentUser');
    if (user) {
        authScreen.style.display = 'none';
        document.getElementById('authPortal').style.display = 'none';
        document.getElementById('userAuthPanel').style.display = 'none';
        document.getElementById('adminAuthPanel').style.display = 'none';
        appScreen.classList.remove('hidden');
        userName.textContent = user.name;
        userRole.textContent = user.role || 'user';
        userRole.className = `user-role ${user.role || 'user'}`;
        
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => link.style.display = user.role === 'admin' ? 'block' : 'none');
        const userOnlyLinks = document.querySelectorAll('.user-only');
        userOnlyLinks.forEach(link => link.style.display = user.role === 'user' ? 'block' : 'none');
        
        const allLinks = document.querySelectorAll('.nav-link');
        if (user.role === 'admin') {
            allLinks.forEach(link => {
                const page = link.getAttribute('data-page');
                if (page !== 'dashboard' && page !== 'admin') {
                    link.parentElement.style.display = 'none';
                }
            });
            updateNotificationBadge();
        } else {
            allLinks.forEach(link => link.parentElement.style.display = 'block');
        }
        
        const sessionStart = storage.session.get('sessionStart');
        if (!sessionStart) {
            storage.session.set('sessionStart', new Date().toISOString());
        }
        
        if (user.role === 'admin') {
            navigateTo('admin');
            setTimeout(() => {
                initAdminTabs();
            }, 200);
        } else {
            const savedPage = storage.local.get('currentPage', 'dashboard');
            navigateTo(savedPage === 'admin' ? 'dashboard' : savedPage);
        }
        setTimeout(() => { _renderBell(); _renderPanel(); }, 400);
    } else {
        document.getElementById('authPortal').style.display = 'flex';
        document.getElementById('userAuthPanel').style.display = 'none';
        document.getElementById('adminAuthPanel').style.display = 'none';
        authScreen.style.display = 'flex';
        appScreen.classList.add('hidden');
    }
}

checkAuth();

if (!storage.local.get('users')) {
    storage.local.set('users', [
        { name: 'nikhil', phone: '0000000000', password: 'nikhil2006', role: 'admin', registeredAt: new Date().toISOString() }
    ]);
}

if (!storage.local.get('touristPlaces')) {
    storage.local.set('touristPlaces', [
        {
            id: 1,
            name: 'Kanaka Durga Temple',
            image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
            description: 'Located on Indrakeeladri Hill, dedicated to Goddess Durga. One of the most important temples in Andhra Pradesh. Very crowded during Dasara festival.',
            address: 'Indrakeeladri, Vijayawada, Andhra Pradesh 520001',
            icon: '🛕'
        },
        {
            id: 2,
            name: 'Prakasam Barrage',
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            description: 'Built across the Krishna River. Beautiful view, especially at night. Popular for evening walks.',
            address: 'Prakasam Barrage, Vijayawada, Andhra Pradesh 520003',
            icon: '🌊'
        },
        {
            id: 3,
            name: 'Bhavani Island',
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
            description: 'One of the largest river islands in India. Water sports and boating available. Good picnic spot.',
            address: 'Bhavani Island, Krishna River, Vijayawada, Andhra Pradesh',
            icon: '🏞️'
        },
        {
            id: 4,
            name: 'Undavalli Caves',
            image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
            description: 'Ancient rock-cut caves (4th–5th century). Famous for the large reclining Vishnu statue. Great historical place.',
            address: 'Undavalli, Guntur, Andhra Pradesh 522501',
            icon: '🗿'
        },
        {
            id: 5,
            name: 'Gandhi Hill',
            image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
            description: 'One of the first Gandhi memorials in India. Has a library and planetarium. Nice city view.',
            address: 'Gandhi Hill, Vijayawada, Andhra Pradesh 520003',
            icon: '🌄'
        },
        {
            id: 6,
            name: 'Mangalagiri Panakala Narasimha Swamy Temple',
            image: 'https://images.unsplash.com/photo-1580713338346-e3d5d8e5e8e5?w=800',
            description: 'Located near Vijayawada. Famous for offering Panakam (jaggery drink) to the deity.',
            address: 'Mangalagiri, Guntur, Andhra Pradesh 522503',
            icon: '🛕'
        },
        {
            id: 7,
            name: 'Rajiv Gandhi Park',
            image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
            description: 'Well-maintained park. Musical fountain and mini zoo. Good for families.',
            address: 'Rajiv Gandhi Park, Vijayawada, Andhra Pradesh 520010',
            icon: '🏞️'
        }
    ]);
}

// Portal navigation
window.showAuthPanel = function(type) {
    document.getElementById('authPortal').style.display = 'none';
    if (type === 'user') {
        document.getElementById('userAuthPanel').style.display = 'flex';
        document.getElementById('adminAuthPanel').style.display = 'none';
    } else {
        document.getElementById('adminAuthPanel').style.display = 'flex';
        document.getElementById('userAuthPanel').style.display = 'none';
        generateAdminCaptcha();
    }
};

window.showPortal = function() {
    document.getElementById('authPortal').style.display = 'flex';
    document.getElementById('userAuthPanel').style.display = 'none';
    document.getElementById('adminAuthPanel').style.display = 'none';
};

// Spawn floating particles
(function spawnParticles() {
    const container = document.getElementById('authParticles');
    if (!container) return;
    const colors = ['#ffd700','#ff8c00','#ff4500','#ff69b4','#00ffcc','#ffffff','#ffec8b'];
    function createParticle() {
        const p = document.createElement('div');
        p.className = 'auth-particle';
        const size = Math.random() * 6 + 2;
        p.style.cssText = `
            width:${size}px; height:${size}px;
            left:${Math.random()*100}%;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            animation-duration:${Math.random()*10+8}s;
            animation-delay:${Math.random()*5}s;
            box-shadow:0 0 ${size*2}px currentColor;
        `;
        container.appendChild(p);
        setTimeout(() => p.remove(), 18000);
    }
    for (let i = 0; i < 20; i++) setTimeout(createParticle, i * 300);
    setInterval(createParticle, 800);

    // Update portal user count
    const countEl = document.getElementById('portalUserCount');
    if (countEl) {
        const users = storage.local.get('users', []);
        countEl.textContent = (users.length || 0) + '+';
    }
})();

const registerRoleInput = document.getElementById('registerRole');

const savedTheme = storage.local.get('theme', 'dark');
html.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

function navigateTo(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetLink) targetLink.classList.add('active');

    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });
    
    storage.local.set('currentPage', pageId);
    storage.session.set('lastVisited', { page: pageId, time: new Date().toISOString() });
    
    if (pageId === 'report') {
        setTimeout(() => {
            const selectedLocation = storage.session.get('selectedLocation');
            if (selectedLocation) {
                const locationField = document.getElementById('location');
                if (locationField) {
                    locationField.value = selectedLocation.address;
                    locationField.classList.add('success');
                    const errorSpan = locationField.parentElement.querySelector('.error-message');
                    if (errorSpan) errorSpan.textContent = '';
                }
                storage.session.remove('selectedLocation');
            }
        }, 50);
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        navigateTo(pageId);
    });
});

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

logoutBtn.addEventListener('click', () => {
    clearToken();
    storage.local.remove('currentUser');
    sessionStorage.clear();
    checkAuth();
});

const authValidators = {
    loginName: (v) => !v ? 'Name is required' : '',
    loginPassword: (v) => !v ? 'Password is required' : '',
    captchaInput: (v) => !v ? 'CAPTCHA is required' : '',
    regName: (v) => !v ? 'Name is required' : v.length < 2 ? 'Name too short' : '',
    regPhone: (v) => {
        if (!v) return 'Phone number is required';
        if (!/^[0-9]{10}$/.test(v)) return 'Phone number must be exactly 10 digits';
        return '';
    },
    regPassword: (v) => !v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : ''
};

let currentCaptcha = '';

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = captcha;
    const captchaElement = document.getElementById('captchaCode');
    if (captchaElement) {
        captchaElement.textContent = captcha;
    }
}

// Bind refresh button and generate on load
document.getElementById('refreshCaptcha')?.addEventListener('click', generateCaptcha);
document.addEventListener('DOMContentLoaded', () => { generateCaptcha(); });
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(generateCaptcha, 100);
}

// Admin captcha
let currentAdminCaptcha = '';
function generateAdminCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
    currentAdminCaptcha = c;
    const el = document.getElementById('adminCaptchaCode');
    if (el) el.textContent = c;
}
document.getElementById('adminRefreshCaptcha')?.addEventListener('click', generateAdminCaptcha);

// Admin login form
const adminLoginFormElement = document.getElementById('adminLoginFormElement');
if (adminLoginFormElement) {
    adminLoginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('adminLoginName').value.trim();
        const password = document.getElementById('adminLoginPassword').value;
        const captchaInput = document.getElementById('adminCaptchaInput').value.toUpperCase();
        const nameField = document.getElementById('adminLoginName');
        const captchaField = document.getElementById('adminCaptchaInput');

        if (!name) { nameField.classList.add('error'); nameField.parentElement.querySelector('.error-message').textContent = 'Username required'; return; }
        if (!password) { document.getElementById('adminLoginPassword').classList.add('error'); document.getElementById('adminLoginPassword').parentElement.querySelector('.error-message').textContent = 'Password required'; return; }
        if (captchaInput !== currentAdminCaptcha) {
            captchaField.classList.add('error');
            captchaField.parentElement.querySelector('.error-message').textContent = 'Invalid CAPTCHA';
            generateAdminCaptcha();
            return;
        }
        try {
            const data = await api('POST', '/login', { name, password, role: 'admin' });
            setToken(data.token);
            storage.local.set('currentUser', data.user);
            adminLoginFormElement.reset();
            generateAdminCaptcha();
            setTimeout(() => showSparkleWelcome('admin'), 500);
            checkAuth();
            setTimeout(() => { _renderBell(); _renderPanel(); }, 300);
        } catch (err) {
            nameField.classList.add('error');
            nameField.parentElement.querySelector('.error-message').textContent = err.message || 'Invalid credentials';
            generateAdminCaptcha();
        }
    });
}


function validateAuthField(field) {
    const error = authValidators[field.id] ? authValidators[field.id](field.value) : '';
    const errorSpan = field.parentElement.querySelector('.error-message');
    
    if (error) {
        field.classList.add('error');
        field.classList.remove('success');
        errorSpan.textContent = error;
        return false;
    }
    field.classList.remove('error');
    field.classList.add('success');
    errorSpan.textContent = '';
    return true;
}

[loginFormElement, registerFormElement].forEach(form => {
    form.querySelectorAll('input:not([type="hidden"]), select').forEach(field => {
        field.addEventListener('blur', () => validateAuthField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('error')) validateAuthField(field);
        });
    });
});

loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;
    loginFormElement.querySelectorAll('input:not([type="hidden"])').forEach(field => {
        if (!validateAuthField(field)) isValid = false;
    });
    if (!isValid) return;

    const name = document.getElementById('loginName').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    const captchaInput = document.getElementById('captchaInput').value.toUpperCase();

    if (captchaInput !== currentCaptcha) {
        const captchaField = document.getElementById('captchaInput');
        captchaField.classList.add('error');
        captchaField.parentElement.querySelector('.error-message').textContent = 'Invalid CAPTCHA';
        generateCaptcha();
        return;
    }

    try {
        const data = await api('POST', '/login', { name, password, role });
        setToken(data.token);
        storage.local.set('currentUser', data.user);
        storage.local.set('lastLogin', new Date().toISOString());
        loginFormElement.reset();
        loginFormElement.querySelectorAll('input').forEach(f => f.classList.remove('success', 'error'));
        generateCaptcha();
        setTimeout(() => showSparkleWelcome(data.user.role), 500);
        checkAuth();
        setTimeout(() => { _renderBell(); _renderPanel(); }, 300);
    } catch (err) {
        const nameField = document.getElementById('loginName');
        nameField.classList.add('error');
        nameField.parentElement.querySelector('.error-message').textContent = err.message || 'Invalid credentials';
        generateCaptcha();
    }
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;
    registerFormElement.querySelectorAll('input').forEach(field => {
        if (!validateAuthField(field)) isValid = false;
    });
    if (!isValid) return;

    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('registerRole').value;

    try {
        await api('POST', '/register', { name, phone, password, role });
        // Auto login after register
        const data = await api('POST', '/login', { name, password, role });
        setToken(data.token);
        storage.local.set('currentUser', data.user);
        registerFormElement.reset();
        registerFormElement.querySelectorAll('input').forEach(f => f.classList.remove('success', 'error'));
        checkAuth();
    } catch (err) {
        const nameField = document.getElementById('regName');
        nameField.classList.add('error');
        nameField.parentElement.querySelector('.error-message').textContent = err.message || 'Registration failed';
    }
});

const form = document.getElementById('reportForm');
const successMessage = document.getElementById('successMessage');

const validators = {
    name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
    },
    phone: (value) => {
        if (!value) return 'Phone number is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Phone must be exactly 10 digits';
        return '';
    },
    category: (value) => {
        if (!value) return 'Please select a category';
        return '';
    },
    location: (value) => {
        if (!value.trim()) return 'Location is required';
        return '';
    },
    description: (value) => {
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 10) return 'Description must be at least 10 characters';
        return '';
    }
};

function validateField(field) {
    const value = field.value;
    const name = field.name;
    const errorSpan = field.parentElement.querySelector('.error-message');
    
    const error = validators[name] ? validators[name](value) : '';
    
    if (error) {
        field.classList.add('error');
        field.classList.remove('success');
        errorSpan.textContent = error;
        return false;
    } else if (field.hasAttribute('required') || value) {
        field.classList.remove('error');
        field.classList.add('success');
        errorSpan.textContent = '';
        return true;
    }
    return true;
}

form.querySelectorAll('input, select, textarea').forEach(field => {
    if (field.type === 'file') return;
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
            validateField(field);
        }
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value
        };
        saveFormDraft('reportForm', formData);
    });
});

const draft = loadFormDraft('reportForm');
if (draft) {
    document.getElementById('name').value = draft.name || '';
    document.getElementById('phone').value = draft.phone || '';
    document.getElementById('category').value = draft.category || '';
    document.getElementById('location').value = draft.location || '';
    document.getElementById('description').value = draft.description || '';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;
    form.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.type === 'file') return;
        const stepContent = field.closest('.report-step-content');
        if (stepContent && !stepContent.classList.contains('active')) return;
        if (!validateField(field)) isValid = false;
    });
    if (!isValid) return;

    const currentUser = storage.local.get('currentUser');
    const issueData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        photo: window._issuePhotoData || null
    };

    try {
        const data = await api('POST', '/issues', issueData);
        window._issuePhotoData = null;

        // Also keep in localStorage for offline display
        const issue = { ...issueData, id: data.id, userName: currentUser?.name,
            status: 'pending', priority: 'medium',
            date: new Date().toLocaleDateString(), createdAt: new Date().toISOString() };
        const issues = storage.local.get('issues', []);
        issues.push(issue);
        storage.local.set('issues', issues);

        updateNotificationBadge();
        notifyIssueSubmitted(issueData.category, issueData.location);
        clearFormDraft('reportForm');

        const refId = 'SC' + String(data.id).padStart(8, '0');
        document.getElementById('refId').textContent = refId;
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
        successMessage.classList.add('report-success');
        _loadReportMiniStats();
    } catch (err) {
        alert('Failed to submit: ' + err.message);
    }
});

form.addEventListener('reset', () => {
    form.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.type === 'file') return;
        field.classList.remove('success', 'error');
        const errorSpan = field.parentElement.querySelector('.error-message');
        if (errorSpan) errorSpan.textContent = '';
    });
});

updateStats();
initializeAPIs();
startLiveClock();
renderAlerts();

function startLiveClock() {
    const liveTime = document.getElementById('liveTime');
    const activeUsers = document.getElementById('activeUsers');
    const touristCount = document.getElementById('touristCount');
    
    setInterval(() => {
        const now = new Date();
        liveTime.textContent = now.toLocaleTimeString();
    }, 1000);
    
    const updateActiveUsers = () => {
        const users = storage.local.get('users', []);
        activeUsers.textContent = users.length.toLocaleString();
        
        const places = storage.local.get('touristPlaces', []);
        if (touristCount) touristCount.textContent = places.length;
    };
    
    updateActiveUsers();
    setInterval(updateActiveUsers, 5000);
}

async function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
    try {
        const apiAlerts = await api('GET', '/alerts');
        storage.local.set('alerts', apiAlerts.map(a => ({ ...a, time: a.time })));
    } catch(e) {}
    const alerts = storage.local.get('alerts', [
        { id: 1, type: 'warning', message: 'Heavy traffic on Main St', time: Date.now() - 300000 },
        { id: 2, type: 'info', message: 'Street cleaning scheduled', time: Date.now() - 3600000 },
        { id: 3, type: 'success', message: 'Power restored in Zone 3', time: Date.now() - 7200000 }
    ]);
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<p>No alerts</p>';
        return;
    }
    
    const icons = { warning: '⚠️', info: 'ℹ️', success: '✅' };
    
    alertsList.innerHTML = alerts.slice(0, 3).map(alert => {
        const timeAgo = getTimeAgo(alert.time);
        return `
            <div class="alert-item ${alert.type}">
                <span>${icons[alert.type]} ${alert.message}</span>
                <small>${timeAgo}</small>
            </div>
        `;
    }).join('');
}

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function renderAdminAlerts() {
    const adminAlertsList = document.getElementById('adminAlertsList');
    const alerts = storage.local.get('alerts', [
        { id: 1, type: 'warning', message: 'Heavy traffic on Main St', time: Date.now() - 300000 },
        { id: 2, type: 'info', message: 'Street cleaning scheduled', time: Date.now() - 3600000 },
        { id: 3, type: 'success', message: 'Power restored in Zone 3', time: Date.now() - 7200000 }
    ]);
    
    if (alerts.length === 0) {
        adminAlertsList.innerHTML = '<p>No alerts added yet.</p>';
        return;
    }
    
    const icons = { warning: '⚠️', info: 'ℹ️', success: '✅' };
    
    adminAlertsList.innerHTML = alerts.map(alert => {
        const timeAgo = getTimeAgo(alert.time);
        return `
            <div class="emergency-card">
                <div class="emergency-info">
                    <h4>${icons[alert.type]} ${alert.message}</h4>
                    <p>${timeAgo}</p>
                </div>
                <div class="emergency-actions">
                    <button class="btn-icon" onclick="editAlert(${alert.id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deleteAlert(${alert.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

window.openAlertModal = function() {
    document.getElementById('alertId').value = '';
    document.getElementById('alertType').value = 'warning';
    document.getElementById('alertMessage').value = '';
    document.getElementById('alertModal').classList.remove('hidden');
};

window.editAlert = function(id) {
    const alerts = storage.local.get('alerts', []);
    const alert = alerts.find(a => a.id === id);
    
    if (alert) {
        document.getElementById('alertId').value = alert.id;
        document.getElementById('alertType').value = alert.type;
        document.getElementById('alertMessage').value = alert.message;
        document.getElementById('alertModal').classList.remove('hidden');
    }
};

window.deleteAlert = function(id) {
    if (confirm('Are you sure you want to delete this alert?')) {
        let alerts = storage.local.get('alerts', []);
        alerts = alerts.filter(a => a.id !== id);
        storage.local.set('alerts', alerts);
        renderAdminAlerts();
        renderAlerts();
    }
};

function renderParkingManagement() {
    const parkingData = storage.local.get('parkingSpots', { total: 500, available: 234 });
    document.getElementById('parkingSpots').value = parkingData.available;
    document.getElementById('currentParking').textContent = `Current: ${parkingData.available} / ${parkingData.total} spots available`;
}

window.updateParkingSpots = function() {
    const spots = parseInt(document.getElementById('parkingSpots').value);
    
    if (isNaN(spots) || spots < 0) {
        alert('Please enter a valid number');
        return;
    }
    
    const parkingData = storage.local.get('parkingSpots', { total: 500, available: 234 });
    parkingData.available = spots;
    storage.local.set('parkingSpots', parkingData);
    
    renderParkingManagement();
    updateParking();
    alert('Parking spots updated successfully!');
};

function renderTouristPlaces() {
    const touristPlacesList = document.getElementById('touristPlacesList');
    const places = storage.local.get('touristPlaces', []);

    const countEl = document.getElementById('placesCount');
    if (countEl) countEl.textContent = places.length;

    if (places.length === 0) {
        touristPlacesList.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;"><div style="font-size:3rem;margin-bottom:1rem;">🏛️</div><h3 style="color:var(--text-primary);">No places yet</h3><p style="color:var(--text-secondary);">Admin can add tourist places from the Admin panel.</p></div>';
        return;
    }

    const categoryLabels = { pothole:'Road', streetlight:'Light', traffic:'Traffic', waste:'Waste', water:'Water', other:'Other',
        temple:'Temple', park:'Park', river:'River', monument:'Monument', island:'Island', cave:'Cave', hill:'Hill' };

    touristPlacesList.innerHTML = places.map(place => {
        const badge = place.icon === '🛕' ? 'Temple' : place.icon === '🌊' ? 'Waterfront' : place.icon === '🏞️' ? 'Nature' : place.icon === '🗿' ? 'Heritage' : place.icon === '🌄' ? 'Viewpoint' : 'Landmark';
        return `
        <div class="tourist-card" data-place-name="${sanitizeHTML(place.name.toLowerCase())}" data-place-desc="${sanitizeHTML(place.description.toLowerCase())}" data-place-addr="${sanitizeHTML(place.address.toLowerCase())}" onclick="showPlaceDetails(${place.id})">
            <div class="tourist-card-img-wrap">
                <img src="${sanitizeHTML(place.image)}" alt="${sanitizeHTML(place.name)}" onerror="this.src='https://via.placeholder.com/600x300?text=${encodeURIComponent(place.name)}'">
                <div class="tourist-card-overlay"></div>
                <span class="tourist-card-badge">${badge}</span>
                <span class="tourist-card-icon">${place.icon || '🏛️'}</span>
            </div>
            <div class="tourist-card-body">
                <div class="tourist-card-title">${sanitizeHTML(place.name)}</div>
                <div class="tourist-card-desc">${sanitizeHTML(place.description)}</div>
                <div class="tourist-card-address"><span>📍</span><span>${sanitizeHTML(place.address)}</span></div>
            </div>
            <div class="tourist-card-footer">
                <button class="tourist-card-btn primary" onclick="event.stopPropagation(); showPlaceDetails(${place.id})">🔍 Explore</button>
                <button class="tourist-card-btn secondary" onclick="event.stopPropagation(); window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}','_blank')">🗺️ Directions</button>
            </div>
        </div>`;
    }).join('');
}

window.setPlacesView = function(view) {
    const grid = document.getElementById('touristPlacesList');
    const btnGrid = document.getElementById('viewGrid');
    const btnList = document.getElementById('viewList');
    if (!grid) return;
    if (view === 'list') {
        grid.classList.add('list-view');
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    } else {
        grid.classList.remove('list-view');
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
    }
};

window.searchPlaces = function(searchText) {
    const cards = document.querySelectorAll('.tourist-card');
    const search = searchText.toLowerCase().trim();

    if (!search) {
        cards.forEach(card => { card.style.display = ''; });
        const noResult = document.getElementById('noSearchResult');
        if (noResult) noResult.remove();
        return;
    }

    let found = 0;
    cards.forEach(card => {
        const matches =
            (card.getAttribute('data-place-name') || '').includes(search) ||
            (card.getAttribute('data-place-desc') || '').includes(search) ||
            (card.getAttribute('data-place-addr') || '').includes(search);
        card.style.display = matches ? '' : 'none';
        if (matches) found++;
    });

    const existing = document.getElementById('noSearchResult');
    if (existing) existing.remove();
    if (found === 0) {
        const noResult = document.createElement('div');
        noResult.id = 'noSearchResult';
        noResult.style.cssText = 'grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);';
        noResult.innerHTML = `<div style="font-size:3rem;">🔍</div><h3>No places found for "${sanitizeHTML(searchText)}"</h3>`;
        document.getElementById('touristPlacesList').appendChild(noResult);
    }
};

window.showSuggestions = function(searchText) {
    const box = document.getElementById('placesSuggestions');
    const places = storage.local.get('touristPlaces', []);
    const search = searchText.toLowerCase().trim();

    if (!search) { box.style.display = 'none'; return; }

    const matches = places.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.address.toLowerCase().includes(search)
    );

    if (matches.length === 0) { box.style.display = 'none'; return; }

    box.innerHTML = matches.map(p => `
        <div onclick="selectSuggestion('${sanitizeHTML(p.name)}')"
            style="display:flex; align-items:center; gap:14px; padding:12px 18px; cursor:pointer; transition:background 0.2s; border-bottom:1px solid var(--border); background: var(--bg-card);"
            onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='var(--bg-card)'">
            <span style="font-size:2rem; min-width:40px; text-align:center;">${p.icon}</span>
            <div style="flex:1;">
                <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem; margin-bottom:2px;">${highlightMatch(p.name, search)}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary);">📍 ${p.address}</div>
            </div>
            <span style="font-size:0.75rem; color:#6366f1; font-weight:600; background:#e0e7ff; padding:3px 8px; border-radius:20px;">View</span>
        </div>
    `).join('');

    box.style.display = 'block';
};

window.hideSuggestions = function() {
    const box = document.getElementById('placesSuggestions');
    if (box) box.style.display = 'none';
};

window.selectSuggestion = function(name) {
    const input = document.getElementById('searchPlaces');
    input.value = name;
    searchPlaces(name);
    hideSuggestions();
};

function highlightMatch(text, search) {
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark style="background:#e0e7ff; color:#6366f1; border-radius:3px; padding:0 2px;">$1</mark>');
};

window.showPlaceDetails = function(id) {
    const places = storage.local.get('touristPlaces', []);
    const place = places.find(p => p.id === id);
    
    if (place) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>${place.icon} ${place.name}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div style="position: relative;">
                    <img id="placeDetailImage" src="${place.image}" alt="${place.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 1.5rem;">
                    <button onclick="document.getElementById('uploadPlaceImage${id}').click()" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">📷 Change Image</button>
                    <input type="file" id="uploadPlaceImage${id}" accept="image/*" style="display: none;" onchange="updatePlaceImage(${id}, this)">
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--accent);">About</h3>
                    <p style="line-height: 1.8; color: var(--text-secondary);">${place.description}</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--accent);">📍 Location</h3>
                    <p style="color: var(--text-secondary);">${place.address}</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--accent);">🗺️ Map</h3>
                    <iframe 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(place.address)}&output=embed" 
                        width="100%" 
                        height="300" 
                        style="border:0; border-radius: 12px;" 
                        loading="lazy">
                    </iframe>
                </div>
                <button class="btn-primary" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}', '_blank')" style="width: 100%;">
                    📍 Get Directions from Your Location
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
};

window.updatePlaceImage = function(id, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            let places = storage.local.get('touristPlaces', []);
            const index = places.findIndex(p => p.id === id);
            if (index !== -1) {
                places[index].image = imageData;
                storage.local.set('touristPlaces', places);
                document.getElementById('placeDetailImage').src = imageData;
                renderTouristPlaces();
                renderAdminTouristPlaces();
                alert('✅ Image updated successfully!');
            }
        };
        reader.readAsDataURL(file);
    }
};

window.showRouteMap = function(address) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
};

function renderAdminTouristPlaces() {
    const adminTouristList = document.getElementById('adminTouristList');
    const places = storage.local.get('touristPlaces', []);
    
    if (places.length === 0) {
        adminTouristList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No tourist places added yet. Click "Add Tourist Place" to get started.</p>';
        return;
    }
    
    adminTouristList.innerHTML = places.map(place => `
        <div class="admin-list-item">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <img src="${place.image}" alt="${place.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
                <div>
                    <h4>${place.icon || '🏛️'} ${place.name}</h4>
                    <p>${place.description}</p>
                    <small style="opacity: 0.7;">📍 ${place.address}</small>
                </div>
            </div>
            <div class="admin-actions">
                <button class="btn-icon" onclick="editTourist(${place.id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteTourist(${place.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.openTouristModal = function() {
    document.getElementById('touristId').value = '';
    document.getElementById('touristName').value = '';
    document.getElementById('touristImage').value = '';
    document.getElementById('touristImageFile').value = '';
    document.getElementById('touristDescription').value = '';
    document.getElementById('touristAddress').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('touristModal').classList.remove('hidden');
};

window.editTourist = function(id) {
    const places = storage.local.get('touristPlaces', []);
    const place = places.find(p => p.id === id);
    
    if (place) {
        document.getElementById('touristId').value = place.id;
        document.getElementById('touristName').value = place.name;
        document.getElementById('touristImage').value = place.image || '';
        document.getElementById('touristImageFile').value = '';
        document.getElementById('touristDescription').value = place.description;
        document.getElementById('touristAddress').value = place.address;
        if (place.image) {
            document.getElementById('previewImg').src = place.image;
            document.getElementById('imagePreview').style.display = 'block';
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }
        document.getElementById('touristModal').classList.remove('hidden');
    }
};

window.deleteTourist = function(id) {
    if (confirm('Are you sure you want to delete this tourist place?')) {
        let places = storage.local.get('touristPlaces', []);
        places = places.filter(p => p.id !== id);
        storage.local.set('touristPlaces', places);
        renderAdminTouristPlaces();
        renderTouristPlaces();
    }
};

const touristModal = document.getElementById('touristModal');
const touristForm = document.getElementById('touristForm');
const closeTouristModal = document.getElementById('closeTouristModal');
const cancelTourist = document.getElementById('cancelTourist');
const touristImageFile = document.getElementById('touristImageFile');

// Handle image file upload
if (touristImageFile) {
    touristImageFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageData = event.target.result;
                document.getElementById('touristImage').value = imageData;
                document.getElementById('previewImg').src = imageData;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

closeTouristModal.addEventListener('click', () => touristModal.classList.add('hidden'));
cancelTourist.addEventListener('click', () => touristModal.classList.add('hidden'));
touristModal.addEventListener('click', (e) => {
    if (e.target === touristModal) touristModal.classList.add('hidden');
});

touristForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('touristId').value;
    const name = document.getElementById('touristName').value.trim();
    const image = document.getElementById('touristImage').value.trim();
    const description = document.getElementById('touristDescription').value.trim();
    const address = document.getElementById('touristAddress').value.trim();
    
    if (!name || !image || !description || !address) {
        alert('Please fill all required fields including image URL');
        return;
    }
    
    let places = storage.local.get('touristPlaces', []);
    
    if (id) {
        const index = places.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            places[index].name = name;
            places[index].image = image;
            places[index].description = description;
            places[index].address = address;
        }
    } else {
        places.push({ id: Date.now(), name, image, description, address, icon: '🏛️' });
        notifyPlaceAdded(name);
    }
    
    storage.local.set('touristPlaces', places);
    touristModal.classList.add('hidden');
    renderAdminTouristPlaces();
    renderTouristPlaces();
});

window.deleteAlert = function(id) {
    if (confirm('Are you sure you want to delete this alert?')) {
        let alerts = storage.local.get('alerts', []);
        alerts = alerts.filter(a => a.id !== id);
        storage.local.set('alerts', alerts);
        renderAdminAlerts();
        renderAlerts();
    }
};

const alertModal = document.getElementById('alertModal');
const alertForm = document.getElementById('alertForm');
const closeAlertModal = document.getElementById('closeAlertModal');
const cancelAlert = document.getElementById('cancelAlert');

closeAlertModal.addEventListener('click', () => alertModal.classList.add('hidden'));
cancelAlert.addEventListener('click', () => alertModal.classList.add('hidden'));
alertModal.addEventListener('click', (e) => {
    if (e.target === alertModal) alertModal.classList.add('hidden');
});

alertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('alertId').value;
    const type = document.getElementById('alertType').value;
    const message = document.getElementById('alertMessage').value.trim();
    
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    let alerts = storage.local.get('alerts', []);
    
    if (id) {
        const index = alerts.findIndex(a => a.id === parseInt(id));
        if (index !== -1) {
            alerts[index].type = type;
            alerts[index].message = message;
        }
    } else {
        alerts.unshift({ id: Date.now(), type, message, time: Date.now() });
    }
    
    storage.local.set('alerts', alerts);
    alertModal.classList.add('hidden');
    renderAdminAlerts();
    renderAlerts();
    if (!id) notifyNewAlert(message, type);
});

async function renderIssues() {
    const issuesList = document.getElementById('issuesList');
    const emptyState = document.getElementById('emptyState');
    const user = storage.local.get('currentUser');
    if (!user) { issuesList.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    try {
        const apiIssues = await api('GET', '/issues');
        const all = storage.local.get('issues', []);
        apiIssues.forEach(i => {
            const merged = { ...i, userName: i.user_name, date: new Date(i.created_at).toLocaleDateString(), createdAt: i.created_at, solutionViewed: !!i.solution_viewed, resolvedViewed: !!i.resolved_viewed };
            const idx = all.findIndex(x => x.id === i.id);
            if (idx === -1) all.push(merged); else all[idx] = merged;
        });
        storage.local.set('issues', all);
    } catch(e) {}
    const issues = storage.local.get('issues', []);

    storage.session.set('issuesViewedAt', new Date().toISOString());
    let userIssues = issues.filter(i => i.userName === user.name || i.name === user.name || i.user_name === user.name);

    userIssues.forEach(issue => {
        if (issue.solution) issue.solutionViewed = true;
        if (issue.status === 'resolved') issue.resolvedViewed = true;
    });
    storage.local.set('issues', issues);
    updateNotificationBadge();

    // stats bar
    const statsBar = document.getElementById('issuesStatsBar');
    if (statsBar) {
        const pending   = userIssues.filter(i => i.status === 'pending').length;
        const resolved  = userIssues.filter(i => i.status === 'resolved').length;
        const completed = userIssues.filter(i => i.status === 'completed').length;
        statsBar.innerHTML = `
            <div class="istat"><span class="istat-num">${userIssues.length}</span><span class="istat-lbl">Total</span></div>
            <div class="istat pending"><span class="istat-num">${pending}</span><span class="istat-lbl">⏳ Pending</span></div>
            <div class="istat resolved"><span class="istat-num">${resolved}</span><span class="istat-lbl">✅ Resolved</span></div>
            <div class="istat completed"><span class="istat-num">${completed}</span><span class="istat-lbl">🏆 Completed</span></div>
        `;
    }

    if (userIssues.length === 0) { issuesList.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    const steps = ['Submitted', 'In Review', 'Resolved', 'Completed'];
    const stepIndex = { pending: 1, resolved: 2, completed: 3 };

    issuesList.innerHTML = userIssues.map(issue => {
        const step = stepIndex[issue.status] || 0;
        const progressBar = steps.map((s, i) => `<div class="prog-step ${i <= step ? 'done' : ''}"><div class="prog-dot"></div><span>${s}</span></div>`).join('<div class="prog-line"></div>');
        return `
        <div class="issue-card">
            <div class="issue-header">
                <div class="issue-title"><span>${getCategoryIcon(issue.category)}</span><span>${sanitizeHTML(issue.category.charAt(0).toUpperCase() + issue.category.slice(1))}</span></div>
                <span class="issue-status ${issue.status}">${sanitizeHTML(issue.status.charAt(0).toUpperCase() + issue.status.slice(1))}</span>
            </div>
            <div class="issue-progress">${progressBar}</div>
            <div class="issue-body">
                <p><strong>Location:</strong> ${sanitizeHTML(issue.location)}</p>
                <p><strong>Description:</strong> ${sanitizeHTML(issue.description)}</p>
                ${issue.photo ? `<img src="${issue.photo}" style="max-width:200px;max-height:140px;border-radius:8px;margin-top:0.5rem;">` : ''}
                ${issue.solution ? `<div class="solution-box"><strong>✅ Admin Solution:</strong> ${sanitizeHTML(issue.solution)}</div>` : ''}
                ${issue.rating ? `<p><strong>Your Rating:</strong> ${'⭐'.repeat(issue.rating)}</p>` : ''}
                <p><strong>Reported:</strong> ${sanitizeHTML(issue.date)}</p>
            </div>
            <div class="issue-actions">
                ${issue.status === 'pending' ? `<button class="btn-edit" onclick="editIssue(${issue.id})">Edit</button>` : ''}
                ${(issue.status === 'resolved' || issue.status === 'completed') && !issue.rating ? `
                    <button class="btn-primary" onclick="rateIssue(${issue.id})">Rate Solution</button>
                    <button class="btn-secondary" onclick="skipRating(${issue.id})">Skip</button>
                ` : ''}
                <button class="btn-delete" onclick="showConfirm('Delete Issue?','This will permanently remove your issue.',()=>deleteIssue(${issue.id}))">Delete</button>
            </div>
        </div>`;
    }).join('');
}

function getCategoryIcon(category) {
    const icons = {
        pothole: '🕳️',
        streetlight: '💡',
        traffic: '🚦',
        waste: '🗑️',
        water: '🚧',
        other: '📌'
    };
    return icons[category] || '📌';
}

window.editIssue = function(id) {
    const issues = storage.local.get('issues', []);
    const issue = issues.find(i => i.id === id);
    
    if (issue) {
        document.getElementById('editId').value = issue.id;
        document.getElementById('editCategory').value = issue.category;
        document.getElementById('editLocation').value = issue.location;
        document.getElementById('editDescription').value = issue.description;
        document.getElementById('editModal').classList.remove('hidden');
    }
};

window.deleteIssue = function(id) {
    if (confirm('Are you sure you want to delete this issue?')) {
        let issues = storage.local.get('issues', []);
        issues = issues.filter(i => i.id !== id);
        storage.local.set('issues', issues);
        renderIssues();
        updateNotificationBadge();
    }
};

window.rateIssue = function(id) {
    document.getElementById('ratingIssueId').value = id;
    document.getElementById('ratingModal').classList.remove('hidden');
    
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    let selectedRating = 0;
    
    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    
    stars.forEach(star => {
        star.classList.remove('active');
        
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.add('active');
            }
            
            ratingText.textContent = ratingLabels[selectedRating];
        });
        
        star.addEventListener('mouseenter', function() {
            const hoverRating = parseInt(this.dataset.rating);
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < hoverRating; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    document.getElementById('starRating').addEventListener('mouseleave', function() {
        stars.forEach(s => s.classList.remove('active'));
        for (let i = 0; i < selectedRating; i++) {
            stars[i].classList.add('active');
        }
    });
    
    document.getElementById('submitRating').onclick = function() {
        if (selectedRating > 0) {
            let issues = storage.local.get('issues', []);
            const index = issues.findIndex(i => i.id === parseInt(id));
            if (index !== -1) {
                issues[index].rating = selectedRating;
                storage.local.set('issues', issues);
                document.getElementById('ratingModal').classList.add('hidden');
                renderIssues();
                alert('Thank you for your rating!');
            }
        } else {
            alert('Please select a rating');
        }
    };
};

const ratingModal = document.getElementById('ratingModal');
const closeRatingModal = document.getElementById('closeRatingModal');
const cancelRating = document.getElementById('cancelRating');

closeRatingModal.addEventListener('click', () => ratingModal.classList.add('hidden'));
cancelRating.addEventListener('click', () => ratingModal.classList.add('hidden'));
ratingModal.addEventListener('click', (e) => {
    if (e.target === ratingModal) ratingModal.classList.add('hidden');
});

window.skipRating = function(id) {
    if (confirm('Are you sure you want to skip rating? You can rate later.')) {
        let issues = storage.local.get('issues', []);
        const index = issues.findIndex(i => i.id === id);
        if (index !== -1) {
            issues[index].ratingSkipped = true;
            storage.local.set('issues', issues);
            renderIssues();
        }
    }
};

function updateNotificationBadge() {
    const user = storage.local.get('currentUser');
    if (!user) return;
    
    const issues = storage.local.get('issues', []);
    
    if (user.role === 'admin') {
        const pendingCount = issues.filter(i => i.status === 'pending').length;
        const badge = document.getElementById('adminNotification');
        
        if (badge) {
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } else {
        const userIssues = issues.filter(i => i.name === user.name);
        const lastViewed = storage.local.get('lastIssuesViewed_' + user.name, 0);
        const newUpdates = userIssues.filter(i => {
            const hasUpdate = (i.solution && !i.solutionViewed) || (i.status === 'resolved' && !i.resolvedViewed);
            return hasUpdate;
        }).length;
        
        const badge = document.getElementById('userNotification');
        if (badge) {
            if (newUpdates > 0) {
                badge.textContent = newUpdates;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');

closeModal.addEventListener('click', () => editModal.classList.add('hidden'));
cancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.add('hidden');
});

const editValidators = {
    editCategory: (v) => !v ? 'Category is required' : '',
    editLocation: (v) => !v.trim() ? 'Location is required' : '',
    editDescription: (v) => !v.trim() ? 'Description is required' : v.trim().length < 10 ? 'Description must be at least 10 characters' : ''
};

function validateEditField(field) {
    const error = editValidators[field.id] ? editValidators[field.id](field.value) : '';
    const errorSpan = field.parentElement.querySelector('.error-message');
    
    if (error) {
        field.classList.add('error');
        field.classList.remove('success');
        errorSpan.textContent = error;
        return false;
    }
    field.classList.remove('error');
    field.classList.add('success');
    errorSpan.textContent = '';
    return true;
}

editForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateEditField(field));
    field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateEditField(field);
    });
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    editForm.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.id !== 'editId' && !validateEditField(field)) isValid = false;
    });
    
    if (isValid) {
        const id = parseInt(document.getElementById('editId').value);
        let issues = storage.local.get('issues', []);
        const index = issues.findIndex(i => i.id === id);
        
        if (index !== -1) {
            issues[index].category = document.getElementById('editCategory').value;
            issues[index].location = document.getElementById('editLocation').value;
            issues[index].description = document.getElementById('editDescription').value;
            issues[index].updatedAt = new Date().toISOString();
            storage.local.set('issues', issues);
            editModal.classList.add('hidden');
            renderIssues();
        }
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const page = link.getAttribute('data-page');
        if (page === 'issues') {
            renderIssues();
            storage.local.set('lastIssuesViewed_' + (storage.local.get('currentUser') || {}).name, Date.now());
        }
        if (page === 'services') {
            updateStorageStats();
            renderUserEmergencyNumbers();
        }
        if (page === 'tourists') {
            renderTouristPlaces();
        }
        if (page === 'admin') {
            setTimeout(() => {
                renderAdminPanel();
                initAdminTabs();
            }, 100);
        }
        if (page === 'citymap') {
            setTimeout(() => loadInteractiveMap(), 100);
        }
        if (page === 'report') {
            setTimeout(() => {
                const selectedLocation = storage.session.get('selectedLocation');
                if (selectedLocation) {
                    const locationField = document.getElementById('location');
                    if (locationField) {
                        locationField.value = selectedLocation.address;
                        locationField.classList.add('success');
                        const errorSpan = locationField.parentElement.querySelector('.error-message');
                        if (errorSpan) errorSpan.textContent = '';
                    }
                    storage.session.remove('selectedLocation');
                }
            }, 100);
        }
    });
});

function renderUserEmergencyNumbers() {
    const userEmergencyList = document.getElementById('userEmergencyList');
    const numbers = storage.local.get('emergencyNumbers', [
        { id: 1, service: 'Nearby Police Station', number: '100', address: 'Police Station, Vijayawada, Andhra Pradesh', mapLink: '' },
        { id: 2, service: 'Nearby Hospital', number: '108', address: 'Government General Hospital, Vijayawada, Andhra Pradesh', mapLink: '' },
        { id: 3, service: 'Nearby Fire Station', number: '101', address: 'Fire Station, Vijayawada, Andhra Pradesh', mapLink: '' }
    ]);
    
    if (numbers.length === 0) {
        userEmergencyList.innerHTML = '<p>No emergency numbers available.</p>';
        return;
    }
    
    userEmergencyList.innerHTML = numbers.map(num => `
        <div class="emergency-card user-emergency" style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="emergency-info">
                    <h4>${num.service}</h4>
                    <p style="font-size: 1.2rem; font-weight: 600; color: var(--accent);">${num.number}</p>
                    ${num.address ? `<small style="color: var(--text-secondary);">📍 ${num.address}</small>` : ''}
                </div>
                <a href="tel:${num.number}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); border: none; transition: all 0.3s ease; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'">📞 Call</a>
            </div>
            ${num.address ? `
                <div style="width: 100%;">
                    <iframe 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(num.address)}&output=embed" 
                        width="100%" 
                        height="250" 
                        style="border:0; border-radius: 8px;" 
                        loading="lazy">
                    </iframe>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function renderAdminPanel() {
    try {
        const apiIssues = await api('GET', '/issues');
        const all = storage.local.get('issues', []);
        apiIssues.forEach(i => {
            const merged = { ...i, userName: i.user_name, date: new Date(i.created_at).toLocaleDateString(), createdAt: i.created_at };
            const idx = all.findIndex(x => x.id === i.id);
            if (idx === -1) all.push(merged); else all[idx] = merged;
        });
        storage.local.set('issues', all);
    } catch(e) {}
    const allIssues = storage.local.get('issues', []);
    const users = storage.local.get('users', []);
    const places = storage.local.get('touristPlaces', []);

    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalIssues').textContent = allIssues.length;
    document.getElementById('pendingIssues').textContent = allIssues.filter(i => i.status === 'pending').length;
    const totalPlacesEl = document.getElementById('totalPlaces');
    if (totalPlacesEl) totalPlacesEl.textContent = places.length;

    renderAdminUsers();
    renderRegularUsers();
    renderAdminTouristPlaces();
    renderBusList();
    renderAdminAlerts();
    renderParkingManagement();
    renderEmergencyNumbers();

    // apply filters
    const statusF   = (document.getElementById('filterStatus')   || {}).value || '';
    const categoryF = (document.getElementById('filterCategory') || {}).value || '';
    const priorityF = (document.getElementById('filterPriority') || {}).value || '';
    const searchF   = ((document.getElementById('searchIssues')  || {}).value || '').toLowerCase();

    let issues = allIssues.filter(i => {
        if (statusF   && i.status   !== statusF)   return false;
        if (categoryF && i.category !== categoryF) return false;
        if (priorityF && (i.priority || 'medium') !== priorityF) return false;
        if (searchF && ![
            i.name, i.location, i.description, i.category
        ].join(' ').toLowerCase().includes(searchF)) return false;
        return true;
    });

    const priorityBadge = p => ({ high: '<span class="priority-badge high">🔴 High</span>', medium: '<span class="priority-badge medium">🟡 Medium</span>', low: '<span class="priority-badge low">🟢 Low</span>' })[p || 'medium'] || '';

    const adminIssuesList = document.getElementById('adminIssuesList');
    if (issues.length === 0) {
        adminIssuesList.innerHTML = '<p style="text-align:center;padding:2rem;color:#94a3b8;">No issues match the filters.</p>';
        return;
    }
    adminIssuesList.innerHTML = issues.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <div class="issue-title">
                    <span>${getCategoryIcon(issue.category)}</span>
                    <span>${sanitizeHTML(issue.category.charAt(0).toUpperCase() + issue.category.slice(1))}</span>
                    ${priorityBadge(issue.priority)}
                </div>
                <span class="issue-status ${issue.status}">${sanitizeHTML(issue.status.charAt(0).toUpperCase() + issue.status.slice(1))}</span>
            </div>
            <div class="issue-body">
                <p><strong>Reported by:</strong> ${sanitizeHTML(issue.name)} (${sanitizeHTML(issue.phone)})</p>
                <p><strong>Location:</strong> ${sanitizeHTML(issue.location)}</p>
                <p><strong>Description:</strong> ${sanitizeHTML(issue.description)}</p>
                ${issue.photo ? `<img src="${issue.photo}" style="max-width:200px;max-height:140px;border-radius:8px;margin-top:0.5rem;">` : ''}
                ${issue.solution ? `<div class="solution-box"><strong>🔧 Solution:</strong> ${sanitizeHTML(issue.solution)}</div>` : ''}
                ${issue.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(issue.rating)}</p>` : ''}
                <p><strong>Date:</strong> ${sanitizeHTML(issue.date)}</p>
            </div>
            <div class="issue-actions">
                <button class="btn-primary" onclick="openSolutionModal(${issue.id})">${issue.solution ? 'Edit Solution' : 'Add Solution'}</button>
                ${issue.status === 'pending' ? `<button class="btn-resolve" onclick="resolveIssue(${issue.id})">Mark Resolved</button>` : ''}
                ${issue.status === 'resolved' ? `<button class="btn-primary" onclick="completeIssue(${issue.id})">Mark Completed</button>` : ''}
                <button class="btn-delete" onclick="showConfirm('Delete this issue?', 'This cannot be undone.', () => adminDeleteIssue(${issue.id}))">Delete</button>
            </div>
        </div>
    `).join('');
}

window.resolveIssue = async function(id) {
    try { await api('PUT', '/issues/' + id, { status: 'resolved' }); } catch(e) {}
    let issues = storage.local.get('issues', []);
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) { issues[index].status = 'resolved'; issues[index].resolvedViewed = false; storage.local.set('issues', issues); notifyIssueUpdated('resolved', issues[index].category); }
    renderAdminPanel(); renderIssues(); updateNotificationBadge();
};

window.addSolution = function(id) {
    const solution = prompt('Enter solution for this issue:');
    if (solution && solution.trim()) {
        let issues = storage.local.get('issues', []);
        const index = issues.findIndex(i => i.id === id);
        if (index !== -1) {
            issues[index].solution = solution.trim();
            issues[index].solutionViewed = false;
            storage.local.set('issues', issues);
            renderAdminPanel();
            renderIssues();
            updateNotificationBadge();
            notifyIssueUpdated('in-progress', issues[index].category);
        }
    }
};

window.completeIssue = async function(id) {
    try { await api('PUT', '/issues/' + id, { status: 'completed' }); } catch(e) {}
    let issues = storage.local.get('issues', []);
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) { issues[index].status = 'completed'; storage.local.set('issues', issues); }
    renderAdminPanel();
};

window.adminDeleteIssue = async function(id) {
    try { await api('DELETE', '/issues/' + id); } catch(e) {}
    let issues = storage.local.get('issues', []);
    issues = issues.filter(i => i.id !== id);
    storage.local.set('issues', issues);
    renderAdminPanel();
};

function renderEmergencyNumbers() {
    const emergencyList = document.getElementById('emergencyList');
    const numbers = storage.local.get('emergencyNumbers', [
        { id: 1, service: 'Nearby Police Station', number: '100', address: 'Police Station, Vijayawada, Andhra Pradesh', mapLink: '' },
        { id: 2, service: 'Nearby Hospital', number: '108', address: 'Government General Hospital, Vijayawada, Andhra Pradesh', mapLink: '' },
        { id: 3, service: 'Nearby Fire Station', number: '101', address: 'Fire Station, Vijayawada, Andhra Pradesh', mapLink: '' }
    ]);
    
    if (numbers.length === 0) {
        emergencyList.innerHTML = '<p>No emergency numbers added yet.</p>';
        return;
    }
    
    emergencyList.innerHTML = numbers.map(num => `
        <div class="emergency-card" style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="emergency-info">
                    <h4>${num.service}</h4>
                    <p style="font-size: 1.2rem; font-weight: 600; color: var(--accent);">${num.number}</p>
                    ${num.address ? `<small style="color: var(--text-secondary);">📍 ${num.address}</small>` : ''}
                </div>
                <div class="emergency-actions">
                    <button class="btn-icon" onclick="editEmergency(${num.id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deleteEmergency(${num.id})" title="Delete">🗑️</button>
                </div>
            </div>
            ${num.address ? `
                <div style="width: 100%;">
                    <iframe 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(num.address)}&output=embed" 
                        width="100%" 
                        height="250" 
                        style="border:0; border-radius: 8px;" 
                        loading="lazy">
                    </iframe>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.openEmergencyModal = function() {
    document.getElementById('emergencyId').value = '';
    document.getElementById('emergencyService').value = '';
    document.getElementById('emergencyNumber').value = '';
    document.getElementById('emergencyAddress').value = '';
    document.getElementById('emergencyMap').value = '';
    document.getElementById('emergencyModal').classList.remove('hidden');
};

window.editEmergency = function(id) {
    const numbers = storage.local.get('emergencyNumbers', []);
    const num = numbers.find(n => n.id === id);
    
    if (num) {
        document.getElementById('emergencyId').value = num.id;
        document.getElementById('emergencyService').value = num.service;
        document.getElementById('emergencyNumber').value = num.number;
        document.getElementById('emergencyAddress').value = num.address || '';
        document.getElementById('emergencyMap').value = num.mapLink || '';
        document.getElementById('emergencyModal').classList.remove('hidden');
    }
};

window.deleteEmergency = function(id) {
    if (confirm('Are you sure you want to delete this emergency number?')) {
        let numbers = storage.local.get('emergencyNumbers', []);
        numbers = numbers.filter(n => n.id !== id);
        storage.local.set('emergencyNumbers', numbers);
        renderEmergencyNumbers();
    }
};

const emergencyModal = document.getElementById('emergencyModal');
const emergencyForm = document.getElementById('emergencyForm');
const closeEmergencyModal = document.getElementById('closeEmergencyModal');
const cancelEmergency = document.getElementById('cancelEmergency');

closeEmergencyModal.addEventListener('click', () => emergencyModal.classList.add('hidden'));
cancelEmergency.addEventListener('click', () => emergencyModal.classList.add('hidden'));
emergencyModal.addEventListener('click', (e) => {
    if (e.target === emergencyModal) emergencyModal.classList.add('hidden');
});

emergencyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('emergencyId').value;
    const service = document.getElementById('emergencyService').value.trim();
    const number = document.getElementById('emergencyNumber').value.trim();
    const address = document.getElementById('emergencyAddress').value.trim();
    const mapLink = document.getElementById('emergencyMap').value.trim();
    
    if (!service || !number) {
        alert('Please fill required fields');
        return;
    }
    
    let numbers = storage.local.get('emergencyNumbers', []);
    
    if (id) {
        const index = numbers.findIndex(n => n.id === parseInt(id));
        if (index !== -1) {
            numbers[index].service = service;
            numbers[index].number = number;
            numbers[index].address = address;
            numbers[index].mapLink = mapLink;
        }
    } else {
        numbers.push({
            id: Date.now(),
            service,
            number,
            address,
            mapLink
        });
    }
    
    storage.local.set('emergencyNumbers', numbers);
    emergencyModal.classList.add('hidden');
    renderEmergencyNumbers();
    if (!id) notifyEmergencyAdded(service, number);
});

function renderAdminUsers() {
    const adminUsersList = document.getElementById('adminUsersList');
    const users = storage.local.get('users', []);
    const admins = users.filter(u => u.role === 'admin');
    
    adminUsersList.innerHTML = admins.map(admin => `
        <div class="emergency-card">
            <div class="emergency-info">
                <h4>${admin.name}</h4>
                <p>${admin.phone}</p>
            </div>
            <div class="emergency-actions">
                <button class="btn-icon" onclick="editAdminUser('${admin.name}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteAdmin('${admin.name}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.openAdminModal = function() {
    document.getElementById('adminName').value = '';
    document.getElementById('adminPhone').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminModal').classList.remove('hidden');
};

window.editAdminUser = function(name) {
    const users = storage.local.get('users', []);
    const user = users.find(u => u.name === name && u.role === 'admin');
    
    if (user) {
        document.getElementById('adminName').value = user.name;
        document.getElementById('adminName').readOnly = true;
        document.getElementById('adminPhone').value = user.phone;
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').placeholder = 'Leave blank to keep current';
        document.getElementById('adminModal').classList.remove('hidden');
    }
};

window.deleteAdmin = function(name) {
    if (name === 'srisanth') {
        alert('Cannot delete the main admin account!');
        return;
    }
    
    if (confirm('Are you sure you want to delete this admin?')) {
        let users = storage.local.get('users', []);
        users = users.filter(u => u.name !== name);
        storage.local.set('users', users);
        renderAdminUsers();
    }
};

const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
const closeAdminModal = document.getElementById('closeAdminModal');
const cancelAdmin = document.getElementById('cancelAdmin');

closeAdminModal.addEventListener('click', () => adminModal.classList.add('hidden'));
cancelAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.add('hidden');
});

adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('adminName').value.trim();
    const phone = document.getElementById('adminPhone').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!name) {
        alert('Please enter name');
        return;
    }
    
    if (phone && !/^[0-9]{10}$/.test(phone)) {
        alert('Phone must be 10 digits if provided');
        return;
    }
    
    let users = storage.local.get('users', []);
    const existingIndex = users.findIndex(u => u.name === name);
    
    if (existingIndex !== -1) {
        if (phone) users[existingIndex].phone = phone;
        if (password) {
            users[existingIndex].password = password;
        }
    } else {
        if (!password) {
            alert('Password is required for new admin');
            return;
        }
        users.push({
            name,
            phone: phone || '',
            password,
            role: 'admin',
            registeredAt: new Date().toISOString()
        });
    }
    
    storage.local.set('users', users);
    document.getElementById('adminName').readOnly = false;
    document.getElementById('adminPassword').placeholder = '';
    adminModal.classList.add('hidden');
    renderAdminUsers();
    alert('Admin user saved successfully!');
});

function renderRegularUsers() {
    const regularUsersList = document.getElementById('regularUsersList');
    const users = storage.local.get('users', []);
    const regularUsers = users.filter(u => u.role === 'user');
    
    if (regularUsers.length === 0) {
        regularUsersList.innerHTML = '<p>No regular users found.</p>';
        return;
    }
    
    regularUsersList.innerHTML = regularUsers.map(user => `
        <div class="emergency-card">
            <div class="emergency-info">
                <h4>${user.name}</h4>
                <p>${user.phone}</p>
                <small>Registered: ${new Date(user.registeredAt).toLocaleDateString()}</small>
            </div>
            <div class="emergency-actions">
                <button class="btn-icon" onclick="editUser('${user.name}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteUser('${user.name}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.editUser = function(name) {
    const users = storage.local.get('users', []);
    const user = users.find(u => u.name === name);
    
    if (user) {
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserPhone').value = user.phone;
        document.getElementById('editUserPassword').value = '';
        document.getElementById('userEditModal').classList.remove('hidden');
    }
};

window.deleteUser = function(name) {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
        let users = storage.local.get('users', []);
        users = users.filter(u => u.name !== name);
        storage.local.set('users', users);
        renderRegularUsers();
    }
};

function renderBusList() {
    const busList = document.getElementById('busList');
    const buses = storage.local.get('buses', []);
    
    if (buses.length === 0) {
        busList.innerHTML = '<p>No bus routes added yet.</p>';
        return;
    }
    
    busList.innerHTML = buses.map(bus => `
        <div class="emergency-card">
            <div class="emergency-info">
                <h4>🚌 Bus ${bus.number}</h4>
                <p>${bus.route}</p>
                <small>${bus.time}</small>
            </div>
            <div class="emergency-actions">
                <button class="btn-icon" onclick="editBus(${bus.id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteBus(${bus.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.openBusModal = function() {
    document.getElementById('busId').value = '';
    document.getElementById('busNumber').value = '';
    document.getElementById('busRoute').value = '';
    document.getElementById('busTime').value = '';
    document.getElementById('busModal').classList.remove('hidden');
};

window.editBus = function(id) {
    const buses = storage.local.get('buses', []);
    const bus = buses.find(b => b.id === id);
    
    if (bus) {
        document.getElementById('busId').value = bus.id;
        document.getElementById('busNumber').value = bus.number;
        document.getElementById('busRoute').value = bus.route;
        document.getElementById('busTime').value = bus.time;
        document.getElementById('busModal').classList.remove('hidden');
    }
};

window.deleteBus = function(id) {
    if (confirm('Are you sure you want to delete this bus route?')) {
        let buses = storage.local.get('buses', []);
        buses = buses.filter(b => b.id !== id);
        storage.local.set('buses', buses);
        renderBusList();
        fetchTransport();
    }
};

const busModal = document.getElementById('busModal');
const busForm = document.getElementById('busForm');
const closeBusModal = document.getElementById('closeBusModal');
const cancelBus = document.getElementById('cancelBus');

closeBusModal.addEventListener('click', () => busModal.classList.add('hidden'));
cancelBus.addEventListener('click', () => busModal.classList.add('hidden'));
busModal.addEventListener('click', (e) => {
    if (e.target === busModal) busModal.classList.add('hidden');
});

busForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('busId').value;
    const number = document.getElementById('busNumber').value.trim();
    const route = document.getElementById('busRoute').value.trim();
    const time = document.getElementById('busTime').value.trim();
    
    if (!number || !route || !time) {
        alert('Please fill all fields');
        return;
    }
    
    let buses = storage.local.get('buses', []);
    
    if (id) {
        const index = buses.findIndex(b => b.id === parseInt(id));
        if (index !== -1) {
            buses[index].number = number;
            buses[index].route = route;
            buses[index].time = time;
        }
    } else {
        buses.push({ id: Date.now(), number, route, time });
    }
    
    storage.local.set('buses', buses);
    busModal.classList.add('hidden');
    renderBusList();
    fetchTransport();
});

const userEditModal = document.getElementById('userEditModal');
const userEditForm = document.getElementById('userEditForm');
const closeUserEditModal = document.getElementById('closeUserEditModal');
const cancelUserEdit = document.getElementById('cancelUserEdit');

closeUserEditModal.addEventListener('click', () => userEditModal.classList.add('hidden'));
cancelUserEdit.addEventListener('click', () => userEditModal.classList.add('hidden'));
userEditModal.addEventListener('click', (e) => {
    if (e.target === userEditModal) userEditModal.classList.add('hidden');
});

userEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('editUserName').value;
    const phone = document.getElementById('editUserPhone').value.trim();
    const password = document.getElementById('editUserPassword').value;
    
    if (!phone) {
        alert('Phone number is required');
        return;
    }
    
    if (!/^[0-9]{10}$/.test(phone)) {
        alert('Phone must be 10 digits');
        return;
    }
    
    let users = storage.local.get('users', []);
    const index = users.findIndex(u => u.name === name);
    
    if (index !== -1) {
        users[index].phone = phone;
        if (password) {
            users[index].password = password;
        }
        storage.local.set('users', users);
        userEditModal.classList.add('hidden');
        renderRegularUsers();
        alert('User updated successfully!');
    }
});

function updateStorageStats() {
    const statsEl = document.getElementById('storageStats');
    const localSize = new Blob([JSON.stringify(localStorage)]).size;
    const sessionSize = new Blob([JSON.stringify(sessionStorage)]).size;
    const issues = storage.local.get('issues', []).length;
    const users = storage.local.get('users', []).length;
    
    statsEl.innerHTML = `
        <strong>Current Usage:</strong><br>
        LocalStorage: ${(localSize / 1024).toFixed(2)} KB | 
        SessionStorage: ${(sessionSize / 1024).toFixed(2)} KB<br>
        <strong>Data:</strong> ${users} users, ${issues} issues reported
    `;
}

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    storage.local.set('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
});

const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorOptions = document.getElementById('colorOptions');
const colorOptionBtns = document.querySelectorAll('.color-option');

colorPickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorOptions.classList.toggle('active');
});

document.addEventListener('click', () => {
    colorOptions.classList.remove('active');
});

colorOptions.addEventListener('click', (e) => {
    e.stopPropagation();
});

const savedColor = storage.local.get('accentColor', '#3b82f6');
html.style.setProperty('--accent', savedColor);
html.style.setProperty('--accent-hover', adjustColor(savedColor, -20));
setAccentRGB(savedColor);

colorOptionBtns.forEach(btn => {
    if (btn.dataset.color === savedColor) {
        btn.classList.add('selected');
    }
    
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        html.style.setProperty('--accent', color);
        html.style.setProperty('--accent-hover', adjustColor(color, -20));
        setAccentRGB(color);
        storage.local.set('accentColor', color);
        
        colorOptionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

function setAccentRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    html.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function updateStats() {
    updateTrafficFlow();
    updateParking();
    
    setInterval(updateTrafficFlow, 10000);
    setInterval(updateParking, 5000);
}

function updateTrafficFlow() {
    const trafficCard = document.querySelector('.traffic');
    const trafficValue = trafficCard.querySelector('.stat-value');
    const trafficLabel = trafficCard.querySelector('.stat-label');
    const trafficProgress = trafficCard.querySelector('.stat-progress-bar');
    const trafficTrend = trafficCard.querySelector('.stat-trend');
    
    const flow = Math.floor(Math.random() * 30) + 65;
    const change = Math.floor(Math.random() * 10) - 3;
    
    trafficValue.textContent = `${flow}%`;
    trafficProgress.style.width = `${flow}%`;
    
    if (flow >= 80) {
        trafficLabel.textContent = 'Optimal';
    } else if (flow >= 60) {
        trafficLabel.textContent = 'Moderate';
    } else {
        trafficLabel.textContent = 'Heavy';
    }
    
    if (change > 0) {
        trafficTrend.textContent = `+${change}%`;
        trafficTrend.className = 'stat-trend up';
    } else if (change < 0) {
        trafficTrend.textContent = `${change}%`;
        trafficTrend.className = 'stat-trend down';
    } else {
        trafficTrend.textContent = '•';
        trafficTrend.className = 'stat-trend neutral';
    }
}

function updateParking() {
    const parkingValue = document.querySelector('.parking .stat-value');
    const parkingTrend = document.querySelector('.parking .stat-trend');
    const parkingProgress = document.querySelector('.parking .stat-progress-bar');
    
    const parkingData = storage.local.get('parkingSpots', { total: 500, available: 234 });
    const available = parkingData.available;
    const percentage = Math.round((available / parkingData.total) * 100);
    
    parkingValue.textContent = available;
    parkingProgress.style.width = `${percentage}%`;
    
    const lastAvailable = storage.session.get('lastParking', available);
    const change = available - lastAvailable;
    
    if (change !== 0) {
        parkingTrend.textContent = change > 0 ? `+${change}` : `${change}`;
        parkingTrend.className = change > 0 ? 'stat-trend up' : 'stat-trend down';
        storage.session.set('lastParking', available);
    }
}

async function fetchAirQuality() {
    const aqiValue = document.getElementById('aqiValue');
    const aqiLabel = document.getElementById('aqiLabel');
    const envAqiValue = document.getElementById('envAqiValue');
    const envAqiLabel = document.getElementById('envAqiLabel');
    
    try {
        const response = await fetch('https://api.openaq.org/v2/latest?limit=1&country=US');
        const data = await response.json();
        
        if (data.results && data.results[0]) {
            const aqi = data.results[0].measurements[0]?.value || 45;
            const quality = aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : 'Unhealthy';
            
            aqiValue.textContent = quality;
            aqiLabel.textContent = `AQI: ${Math.round(aqi)}`;
            envAqiValue.textContent = Math.round(aqi);
            envAqiLabel.textContent = quality;
        }
    } catch (error) {
        aqiValue.textContent = 'Good';
        aqiLabel.textContent = 'AQI: 45';
        envAqiValue.textContent = '45';
        envAqiLabel.textContent = 'Good';
    }
}

async function fetchWeather() {
    const weatherData = document.getElementById('weatherData');
    const tempValue = document.getElementById('tempValue');
    const humidityValue = document.getElementById('humidityValue');
    
    try {
        let lat = 40.7128, lon = -74.0060, locationName = 'New York City';
        
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                lat = position.coords.latitude;
                lon = position.coords.longitude;
                
                const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const geoData = await geoResponse.json();
                locationName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Your Location';
            } catch (geoError) {
                console.log('Using default location');
            }
        }
        
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await response.json();
        
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const windSpeed = Math.round(data.current.wind_speed_10m);
        const feelsLike = Math.round(data.current.apparent_temperature);
        const weatherCode = data.current.weather_code;
        const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
        const minTemp = Math.round(data.daily.temperature_2m_min[0]);
        
        const weatherConditions = {
            0: '☀️ Clear Sky',
            1: '🌤️ Partly Cloudy',
            2: '☁️ Cloudy',
            3: '☁️ Overcast',
            45: '🌫️ Foggy',
            48: '🌫️ Foggy',
            51: '🌧️ Light Drizzle',
            61: '🌧️ Light Rain',
            63: '🌧️ Rain',
            65: '⛈️ Heavy Rain',
            71: '❄️ Light Snow',
            73: '❄️ Snow',
            75: '❄️ Heavy Snow',
            95: '⛈️ Thunderstorm'
        };
        
        const condition = weatherConditions[weatherCode] || '🌤️ Partly Cloudy';
        
        tempValue.textContent = `${temp}°C`;
        humidityValue.textContent = `${humidity}%`;
        checkWeatherNotifications(temp, humidity, windSpeed, weatherCode);
        
        weatherData.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${condition.split(' ')[0]}</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">${temp}°C</div>
                <div style="color: var(--text-secondary); margin-bottom: 1rem;">${condition.split(' ').slice(1).join(' ')}</div>
            </div>
            <p><span>🌡️ Temperature:</span><strong>${temp}°C</strong></p>
            <p><span>🥵 Feels Like:</span><strong>${feelsLike}°C</strong></p>
            <p><span>🔺 High/Low:</span><strong>${maxTemp}°C / ${minTemp}°C</strong></p>
            <p><span>💧 Humidity:</span><strong>${humidity}%</strong></p>
            <p><span>💨 Wind Speed:</span><strong>${windSpeed} km/h</strong></p>
            <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">${locationName} - Live Data</p>
        `;
    } catch (error) {
        weatherData.innerHTML = '<p class="api-error">Unable to fetch weather data</p>';
        tempValue.textContent = '22°C';
        humidityValue.textContent = '65%';
    }
}

async function fetchTransport() {
    const transportList = document.getElementById('transportList');
    try {
        const apiBuses = await api('GET', '/buses');
        storage.local.set('buses', apiBuses);
    } catch(e) {}
    const buses = storage.local.get('buses', []);
    
    if (buses.length === 0) {
        transportList.innerHTML = '<div class="transport-item"><span>No bus routes available</span></div>';
        return;
    }
    
    transportList.innerHTML = buses.map(bus => `
        <div class="transport-item">
            <div>
                <strong>Bus ${bus.number}</strong>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${bus.route}</div>
            </div>
            <span class="badge">${bus.time}</span>
        </div>
    `).join('');
}

function initializeAPIs() {
    fetchAirQuality();
    fetchWeather();
    fetchTransport();
    loadUserLocationMap();
    
    setInterval(fetchAirQuality, 300000);
    setInterval(fetchWeather, 600000);
}

function loadUserLocationMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                const dashboardMap = document.getElementById('liveMap');
                if (dashboardMap) {
                    dashboardMap.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}" width="100%" height="100%" style="border:0; border-radius: 12px;"></iframe>`;
                }
                
                const adminMap = document.getElementById('adminMap');
                if (adminMap) {
                    adminMap.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.02},${lat-0.02},${lon+0.02},${lat+0.02}&layer=mapnik&marker=${lat},${lon}" width="100%" height="450" style="border:0; border-radius: 12px;"></iframe>`;
                }
            },
            () => {
                const dashboardMap = document.getElementById('liveMap');
                if (dashboardMap) {
                    dashboardMap.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02,40.70,-74.00,40.72&layer=mapnik&marker=40.7128,-74.0060" width="100%" height="100%" style="border:0; border-radius: 12px;"></iframe>`;
                }
                
                const adminMap = document.getElementById('adminMap');
                if (adminMap) {
                    adminMap.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-74.04,40.68,-74.00,40.74&layer=mapnik&marker=40.7128,-74.0060" width="100%" height="450" style="border:0; border-radius: 12px;"></iframe>`;
                }
            }
        );
    }
}

updateStats();


// Admin Tabs
function initAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById('tab-' + tabName).classList.add('active');
        });
    });
    
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            const targetTab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
            if (targetTab) targetTab.classList.add('active');
            
            const targetContent = document.getElementById('tab-' + tabName);
            if (targetContent) targetContent.classList.add('active');
        });
    });
}

// Initialize admin tabs when admin panel is rendered
if (document.querySelector('.admin-tab')) {
    initAdminTabs();
}


// Enhanced Interactive City Map
let currentLat = 16.5062;
let currentLon = 80.6480;
let currentZoom = 13;

function loadInteractiveMap() {
    const mapContainer = document.getElementById('interactiveMap');
    if (mapContainer) {
        mapContainer.innerHTML = `<div class="map-loading"><div class="map-loading-spinner"></div><span>Locating you...</span></div>`;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                currentZoom = 15;
                renderMap();
                updateCoordsBar();
            },
            () => { renderMap(); updateCoordsBar(); }
        );
    } else {
        renderMap(); updateCoordsBar();
    }
}

let currentMapLayer = 'standard';

function getMapUrl() {
    const delta = 0.02 / Math.pow(2, currentZoom - 15);
    const bbox = `${currentLon-delta},${currentLat-delta},${currentLon+delta},${currentLat+delta}`;
    const layers = {
        standard: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${currentLat},${currentLon}`,
        satellite: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=hot&marker=${currentLat},${currentLon}`,
        terrain:   `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=cyclemap&marker=${currentLat},${currentLon}`
    };
    return layers[currentMapLayer] || layers.standard;
}

function renderMap() {
    const mapContainer = document.getElementById('interactiveMap');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <iframe id="mapFrame" src="${getMapUrl()}" width="100%" height="100%" style="border:0;"></iframe>
            <div class="map-overlay" id="mapOverlay"></div>
        `;
        document.getElementById('mapOverlay').addEventListener('click', handleMapClick);
    }
    updateCoordsBar();
}

function updateCoordsBar() {
    const bar = document.getElementById('mapCoordsBar');
    if (bar) bar.textContent = `📍 ${currentLat.toFixed(5)}, ${currentLon.toFixed(5)}  |  Zoom: ${currentZoom}`;
}

window.setMapLayer = function(layer) {
    currentMapLayer = layer;
    document.querySelectorAll('#layerStandard,#layerSatellite,#layerTerrain').forEach(b => b.classList.remove('active'));
    const map = { standard: 'layerStandard', satellite: 'layerSatellite', terrain: 'layerTerrain' };
    document.getElementById(map[layer])?.classList.add('active');
    renderMap();
};

window.locateMe = function() {
    const mapContainer = document.getElementById('interactiveMap');
    if (mapContainer) mapContainer.innerHTML = `<div class="map-loading"><div class="map-loading-spinner"></div><span>Locating you...</span></div>`;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => { currentLat = pos.coords.latitude; currentLon = pos.coords.longitude; currentZoom = 16; renderMap(); },
            () => renderMap()
        );
    }
};

window.showTouristPins = function() {
    const panel = document.getElementById('mapSidePanel');
    const list  = document.getElementById('mapPanelList');
    if (!panel || !list) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) { panel.classList.remove('open'); return; }
    const places = storage.local.get('touristPlaces', []);
    if (places.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:2rem;color:#94a3b8;font-size:0.85rem;">No tourist places added yet.</p>';
    } else {
        list.innerHTML = places.map(p => `
            <div class="map-place-item" onclick="searchPlaceOnMap('${sanitizeHTML(p.address || p.name)}')">
                <div class="map-place-img">${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">` : '🏛️'}</div>
                <div class="map-place-info"><strong>${sanitizeHTML(p.name)}</strong><small>${sanitizeHTML(p.address || '')}</small></div>
            </div>`).join('');
    }
    panel.classList.add('open');
};

window.closeMapPanel = function() {
    document.getElementById('mapSidePanel')?.classList.remove('open');
};

window.searchPlaceOnMap = function(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(r => r.json())
        .then(data => {
            if (data && data[0]) {
                currentLat = parseFloat(data[0].lat);
                currentLon = parseFloat(data[0].lon);
                currentZoom = 16;
                renderMap();
                closeMapPanel();
            }
        });
};

function handleMapClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickLat = currentLat;
    const clickLon = currentLon;
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLon}`)
        .then(res => res.json())
        .then(data => {
            const address = data.display_name || `${clickLat.toFixed(6)}, ${clickLon.toFixed(6)}`;
            storage.session.set('selectedLocation', {
                lat: clickLat,
                lon: clickLon,
                address: address
            });
        })
        .catch(() => {
            storage.session.set('selectedLocation', {
                lat: clickLat,
                lon: clickLon,
                address: `${clickLat.toFixed(6)}, ${clickLon.toFixed(6)}`
            });
        });
    
    showIssuePopup(x, y);
}

function showIssuePopup(x, y) {
    const existingPopup = document.querySelector('.map-marker-popup');
    if (existingPopup) existingPopup.remove();
    
    const popup = document.createElement('div');
    popup.className = 'map-marker-popup';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    popup.innerHTML = `
        <h3>📍 Report Issue Here</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Click below to report an issue at this location</p>
        <button class="btn-primary" onclick="reportIssueFromMap()">📝 Report Issue</button>
        <button class="btn-secondary" onclick="this.closest('.map-marker-popup').remove()">Cancel</button>
    `;
    
    document.getElementById('mapOverlay').appendChild(popup);
}

window.reportIssueFromMap = function() {
    document.querySelector('.map-marker-popup')?.remove();
    navigateTo('report');
};

window.searchMapLocation = function() {
    const query = document.getElementById('mapSearchInput').value.trim();
    if (!query) return;
    _saveRecentSearch(query);
    const mapContainer = document.getElementById('interactiveMap');
    if (mapContainer) mapContainer.innerHTML = `<div class="map-loading"><div class="map-loading-spinner"></div><span>Searching for "${sanitizeHTML(query)}"...</span></div>`;
    closeMapSuggestions();
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`)
        .then(r => r.json())
        .then(data => {
            if (data && data[0]) {
                currentLat = parseFloat(data[0].lat);
                currentLon = parseFloat(data[0].lon);
                currentZoom = 15;
                renderMap();
                _showResultCard(data[0].display_name, data[0].type || 'place');
            } else {
                renderMap();
            }
        })
        .catch(() => renderMap());
};

window.zoomIn  = function() { currentZoom = Math.min(currentZoom + 1, 20); renderMap(); };
window.zoomOut = function() { currentZoom = Math.max(currentZoom - 1, 1);  renderMap(); };
window.resetMap = function() { loadInteractiveMap(); };

document.getElementById('mapSearchInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchMapLocation();
    }
});




// Global Search
const globalSearchData = [
    { icon: '🏙️', title: 'Dashboard',       desc: 'Home overview and stats',              page: 'dashboard' },
    { icon: '🏛️', title: 'Famous Places',   desc: 'Tourist destinations in Vijayawada',   page: 'tourists' },
    { icon: '🗺️', title: 'City Map',        desc: 'Interactive map of the city',          page: 'citymap' },
    { icon: '🌱', title: 'Environment',     desc: 'Air quality, weather, humidity',       page: 'environment' },
    { icon: '🏛️', title: 'City Services',   desc: 'Emergency numbers, waste, water',      page: 'services' },
    { icon: '📝', title: 'Report Issue',    desc: 'Report pothole, streetlight, traffic', page: 'report' },
    { icon: '📋', title: 'My Issues',       desc: 'View and manage your reported issues', page: 'issues' },
    { icon: '🚦', title: 'Traffic',         desc: 'Traffic flow and signals',             page: 'report' },
    { icon: '🕳️', title: 'Pothole',         desc: 'Report road potholes',                 page: 'report' },
    { icon: '💡', title: 'Street Light',    desc: 'Report street light issues',           page: 'report' },
    { icon: '🗑️', title: 'Waste Collection',desc: 'Report waste collection issues',       page: 'report' },
    { icon: '📞', title: 'Emergency',       desc: 'Police 100, Ambulance 108, Fire 101',  page: 'services' },
    { icon: '🚌', title: 'Bus Routes',      desc: 'Public transport schedules',           page: 'services' },
    { icon: '🅿️', title: 'Parking',         desc: 'Available parking spots',              page: 'dashboard' },
    { icon: '💨', title: 'Air Quality',     desc: 'AQI and pollution levels',             page: 'environment' },
    { icon: '🌡️', title: 'Weather',         desc: 'Temperature and humidity',             page: 'environment' },
];

window.globalSearchFn = function(query) {
    const box = document.getElementById('globalSearchResults');
    const q = query.toLowerCase().trim();

    if (!q) { box.style.display = 'none'; return; }

    // Static pages
    let results = globalSearchData.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );

    // Tourist places from storage
    const places = storage.local.get('touristPlaces', []);
    const placeResults = places
        .filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
        .map(p => ({ icon: p.icon, title: p.name, desc: p.address, page: 'tourists' }));

    // Issues from storage
    const issues = storage.local.get('issues', []);
    const issueResults = issues
        .filter(i => i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
        .map(i => ({ icon: '📋', title: `Issue: ${i.category}`, desc: i.location, page: 'issues' }));

    const all = [...results, ...placeResults, ...issueResults].slice(0, 8);

    if (all.length === 0) {
        box.innerHTML = `<div style="padding:1.2rem; text-align:center; color:var(--text-secondary); font-size:0.9rem;">🔍 No results for "${sanitizeHTML(query)}"</div>`;
        box.style.display = 'block';
        return;
    }

    box.innerHTML = all.map(item => `
        <div onclick="navigateTo('${item.page}'); closeGlobalSearch(); document.getElementById('globalSearch').value=''; window.scrollTo(0,0);"
            style="display:flex; align-items:center; gap:14px; padding:12px 18px; cursor:pointer; border-bottom:1px solid var(--border); background:var(--bg-card); transition:background 0.15s;"
            onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='var(--bg-card)'">
            <span style="font-size:1.6rem; min-width:36px; text-align:center;">${item.icon}</span>
            <div style="flex:1;">
                <div style="font-weight:700; color:var(--text-primary); font-size:0.92rem;">${highlightMatch(item.title, q)}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">${sanitizeHTML(item.desc)}</div>
            </div>
            <span style="font-size:0.72rem; background:#e0e7ff; color:#6366f1; padding:3px 10px; border-radius:20px; font-weight:600; white-space:nowrap;">Go →</span>
        </div>
    `).join('');

    box.style.display = 'block';
};

window.closeGlobalSearch = function() {
    const box = document.getElementById('globalSearchResults');
    if (box) box.style.display = 'none';
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('#globalSearch') && !e.target.closest('#globalSearchResults')) {
        closeGlobalSearch();
    }
});

// Initialize tourist places when page loads
setTimeout(() => {
    renderTouristPlaces();
}, 500);


// Royal Welcome Screen
function showRoyalWelcome(userName) {
    const welcome = document.createElement('div');
    welcome.className = 'royal-welcome';
    
    welcome.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-crown">👑</div>
            <div class="welcome-text">
                <h1>WELCOME TO</h1>
                <h2>SMART CITY</h2>
            </div>
            <div class="welcome-divider"></div>
            
        </div>
    `;
    
    // Add stars
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        welcome.appendChild(star);
    }
    
    // Add shooting stars
    for (let i = 0; i < 5; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.left = Math.random() * 100 + '%';
        shootingStar.style.top = Math.random() * 50 + '%';
        shootingStar.style.animationDelay = Math.random() * 3 + 's';
        welcome.appendChild(shootingStar);
    }
    
    // Add golden particles
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'golden-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        welcome.appendChild(particle);
    }
    
    document.body.appendChild(welcome);
    
    // Fade out and show dashboard
    setTimeout(() => {
        welcome.classList.add('fade-out');
        setTimeout(() => welcome.remove(), 1000);
    }, 4000);
}


// Sparkle Letter Animation
function showSparkleWelcome(role) {
    const message = role === 'admin' ? 'ADMIN DASHBOARD' : 'USER DASHBOARD';
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    
    message.split('').forEach((char, index) => {
        const letter = document.createElement('span');
        letter.className = 'welcome-letter';
        letter.textContent = char;
        letter.style.animationDelay = `${index * 0.1}s`;
        welcomeDiv.appendChild(letter);
        
        // Add sparkles for each letter
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle-particle';
                const angle = (Math.PI * 2 * i) / 5;
                const distance = 30;
                sparkle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                sparkle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
                sparkle.style.left = letter.offsetLeft + letter.offsetWidth / 2 + 'px';
                sparkle.style.top = letter.offsetTop + letter.offsetHeight / 2 + 'px';
                welcomeDiv.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 1000);
            }
        }, index * 100 + 500);
    });
    
    document.body.appendChild(welcomeDiv);
    
    setTimeout(() => {
        welcomeDiv.classList.add('welcome-message-fade');
        setTimeout(() => welcomeDiv.remove(), 1000);
    }, message.length * 100 + 2000);
}



// ══════════════════════════════════════════
//  NOTIFICATION SYSTEM  (shared role inbox)
// ══════════════════════════════════════════

// Each role has its own inbox in localStorage: notif_inbox_admin / notif_inbox_user
function _inboxKey(role) { return `notif_inbox_${role}`; }

function _getInbox(role) {
    return JSON.parse(localStorage.getItem(_inboxKey(role)) || '[]');
}

function _saveInbox(role, list) {
    localStorage.setItem(_inboxKey(role), JSON.stringify(list));
}

// Write a notification into a target role's inbox (anyone can write to any inbox)
function pushNotification(targetRole, icon, title, message, type) {
    type = type || 'info';
    const entry = {
        id: Date.now() + Math.random(),
        icon, title, message, type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
    };

    if (targetRole === 'all') {
        // write to both inboxes
        ['admin', 'user'].forEach(r => {
            const list = _getInbox(r);
            list.unshift(entry);
            _saveInbox(r, list.slice(0, 50)); // keep max 50
        });
    } else {
        const list = _getInbox(targetRole);
        list.unshift(entry);
        _saveInbox(targetRole, list.slice(0, 50));
    }

    // if current user matches target, update bell live
    const u = storage.local.get('currentUser');
    if (u && (targetRole === 'all' || u.role === targetRole)) {
        _renderBell();
        _renderPanel();
    }
}

// Read current user's inbox
function _myInbox() {
    const u = storage.local.get('currentUser');
    return u ? _getInbox(u.role) : [];
}

function _saveMyInbox(list) {
    const u = storage.local.get('currentUser');
    if (u) _saveInbox(u.role, list);
}

function _renderBell() {
    const unread = _myInbox().filter(n => !n.read).length;
    const count = document.getElementById('notifCount');
    const bell  = document.getElementById('notifBell');
    if (!count || !bell) return;

    if (unread > 0) {
        count.textContent = unread > 99 ? '99+' : unread;
        count.style.display = 'flex';
        bell.classList.add('ring');
    } else {
        count.style.display = 'none';
        bell.classList.remove('ring');
    }
}

function _renderPanel() {
    const listEl = document.getElementById('notifList');
    if (!listEl) return;
    const notifs = _myInbox();
    if (notifs.length === 0) {
        listEl.innerHTML = '<p class="notif-empty">✨ You\'re all caught up!</p>';
        return;
    }
    listEl.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.type}" style="${n.read ? 'opacity:0.55;' : ''}">
            <span class="notif-icon">${n.icon}</span>
            <div class="notif-text">
                <strong>${n.title}</strong>
                <span>${n.message}</span>
                <div class="notif-time">🕐 ${n.time}</div>
            </div>
            ${!n.read ? '<span class="notif-dot"></span>' : ''}
        </div>
    `).join('');
}

function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        // mark all read
        const updated = _myInbox().map(n => ({ ...n, read: true }));
        _saveMyInbox(updated);
        _renderBell();
        _renderPanel();
        setTimeout(() => {
            document.addEventListener('click', _closeOutside, { once: true });
        }, 10);
    }
}

function _closeOutside(e) {
    const wrapper = document.getElementById('notifWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const panel = document.getElementById('notifPanel');
        if (panel) panel.style.display = 'none';
    }
}

function clearAllNotifs() {
    _saveMyInbox([]);
    _renderBell();
    _renderPanel();
}

// ── Weather → everyone ──
function checkWeatherNotifications(temp, humidity, windSpeed, weatherCode) {
    if (temp <= 5)
        pushNotification('all', '🥶', 'Extreme Cold Alert', `Temperature dropped to ${temp}°C. Stay warm!`, 'critical');
    else if (temp <= 15)
        pushNotification('all', '❄️', 'Cold Weather', `Temperature is ${temp}°C. Carry a jacket.`, 'warning');

    if (temp >= 40)
        pushNotification('all', '🔥', 'Extreme Heat Alert', `Temperature is ${temp}°C. Stay hydrated!`, 'critical');
    else if (temp >= 35)
        pushNotification('all', '☀️', 'High Temperature', `Temperature is ${temp}°C. Avoid direct sunlight.`, 'warning');

    if (humidity >= 85)
        pushNotification('all', '💧', 'High Humidity', `Humidity at ${humidity}%. Feels uncomfortable.`, 'warning');

    if (windSpeed >= 60)
        pushNotification('all', '🌪️', 'Strong Wind Alert', `Wind ${windSpeed} km/h. Secure loose objects.`, 'critical');

    if ([65, 75, 95].includes(weatherCode))
        pushNotification('all', '⛈️', 'Severe Weather Alert', 'Heavy rain / thunderstorm / snow in your area.', 'critical');
}

// ── Admin posts alert → user inbox ──
function notifyNewAlert(message, type) {
    const icons    = { warning: '⚠️', info: 'ℹ️', success: '✅' };
    const severity = { warning: 'critical', info: 'info', success: 'info' };
    pushNotification('user', icons[type] || '🔔', 'City Alert', message, severity[type] || 'info');
}

// ── Admin adds emergency → user inbox ──
function notifyEmergencyAdded(service, number) {
    pushNotification('user', '🚨', 'Emergency Number Added', `${service}: ${number} added to Services.`, 'info');
}

// ── User submits issue → admin inbox ──
function notifyIssueSubmitted(category, location) {
    pushNotification('admin', '📝', 'New Issue Reported', `${category} at ${location}`, 'warning');
}

// ── Admin resolves/updates issue → user inbox ──
function notifyIssueUpdated(status, category) {
    const icons = { resolved: '✅', 'in-progress': '🔧', pending: '⏳' };
    const types = { resolved: 'info', 'in-progress': 'warning', pending: 'info' };
    pushNotification('user', icons[status] || '🔔', 'Issue Status Updated',
        `Your "${category}" issue is now ${status.toUpperCase()}`, types[status] || 'info');
}

// ── Admin adds tourist place → user inbox ──
function notifyPlaceAdded(name) {
    pushNotification('user', '🏛️', 'New Place Added', `"${name}" added to Famous Places.`, 'info');
}

// ── Init on page load ──
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { _renderBell(); _renderPanel(); }, 600);
});

// expose globals
window.toggleNotifPanel          = toggleNotifPanel;
window.clearAllNotifs            = clearAllNotifs;
window.pushNotification          = pushNotification;
window.checkWeatherNotifications = checkWeatherNotifications;
window.notifyNewAlert            = notifyNewAlert;
window.notifyEmergencyAdded      = notifyEmergencyAdded;
window.notifyIssueSubmitted      = notifyIssueSubmitted;
window.notifyIssueUpdated        = notifyIssueUpdated;
window.notifyPlaceAdded          = notifyPlaceAdded;

// ── Photo upload preview for report form ──
(function() {
    const photoInput = document.getElementById('issuePhoto');
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                window._issuePhotoData = e.target.result;
                const preview = document.getElementById('issuePhotoPreview');
                const img = document.getElementById('issuePhotoImg');
                if (preview && img) { img.src = e.target.result; preview.style.display = 'block'; }
            };
            reader.readAsDataURL(file);
        });
    }
})();

// ── Solution Modal ──
window.openSolutionModal = function(id) {
    const issues = storage.local.get('issues', []);
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    document.getElementById('solutionIssueId').value = id;
    document.getElementById('solutionText').value = issue.solution || '';
    document.getElementById('solutionPriority').value = issue.priority || 'medium';
    document.getElementById('solutionModal').classList.remove('hidden');
};

document.getElementById('closeSolutionModal').addEventListener('click', () => {
    document.getElementById('solutionModal').classList.add('hidden');
});

document.getElementById('solutionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('solutionIssueId').value);
    const solution = document.getElementById('solutionText').value.trim();
    const priority = document.getElementById('solutionPriority').value;
    if (!solution) return;
    try { await api('PUT', '/issues/' + id, { solution, priority }); } catch(e) {}
    let issues = storage.local.get('issues', []);
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) {
        issues[index].solution = solution;
        issues[index].priority = priority;
        issues[index].solutionViewed = false;
        storage.local.set('issues', issues);
        notifyIssueUpdated('in-progress', issues[index].category);
    }
    renderAdminPanel(); renderIssues(); updateNotificationBadge();
    document.getElementById('solutionModal').classList.add('hidden');
});

// ── Confirm Modal (replaces all confirm/alert/prompt) ──
window.showConfirm = function(title, message, onYes) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('hidden');
    const btn = document.getElementById('confirmYesBtn');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        onYes();
    });
};

// ── CSV Export ──
window.exportIssuesCSV = function() {
    const issues = storage.local.get('issues', []);
    if (!issues.length) { showConfirm('No Data', 'There are no issues to export.', () => {}); return; }
    const headers = ['ID', 'Name', 'Phone', 'Category', 'Location', 'Description', 'Status', 'Priority', 'Date'];
    const rows = issues.map(i => [
        i.id, i.name, i.phone, i.category, i.location,
        `"${(i.description || '').replace(/"/g, '""')}"`,
        i.status, i.priority || 'medium', i.date
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'issues_export.csv'; a.click();
    URL.revokeObjectURL(url);
};

// ── Profile Page ──
window.loadProfile = function() {
    const user = storage.local.get('currentUser');
    if (!user) return;
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileRole').value = user.role || 'user';

    // left card live display
    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        if (user.avatarImg) {
            avatar.innerHTML = `<img src="${user.avatarImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : '👤';
        }
    }
    const dispName = document.getElementById('profileDisplayName');
    if (dispName) dispName.textContent = user.name || 'Your Name';

    const dispPhone = document.getElementById('profileDisplayPhone');
    if (dispPhone) dispPhone.textContent = user.phone || '—';

    const badge = document.getElementById('profileRoleBadge');
    if (badge) {
        badge.textContent = user.role || 'user';
        badge.className = 'profile-role-badge ' + (user.role === 'admin' ? 'admin' : '');
    }

    const joined = document.getElementById('profileJoined');
    if (joined) {
        const users = storage.local.get('users', []);
        const u = users.find(u => u.name === user.name && u.role === user.role);
        joined.textContent = u && u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'Member';
    }

    const issues = storage.local.get('issues', []);
    const userIssues = issues.filter(i => i.userName === user.name || i.name === user.name);
    const statsEl = document.getElementById('profileStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="profile-stat-row">
                <div class="profile-stat"><span>${userIssues.length}</span><small>Total</small></div>
                <div class="profile-stat"><span>${userIssues.filter(i=>i.status==='pending').length}</span><small>Pending</small></div>
                <div class="profile-stat"><span>${userIssues.filter(i=>i.status==='resolved'||i.status==='completed').length}</span><small>Resolved</small></div>
            </div>`;
    }
};

// avatar image upload
(function(){
    const fileInput = document.getElementById('profileAvatarFile');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const user = storage.local.get('currentUser');
                if (!user) return;
                user.avatarImg = e.target.result;
                storage.local.set('currentUser', user);
                const users = storage.local.get('users', []);
                const idx = users.findIndex(u => u.name === user.name && u.role === user.role);
                if (idx !== -1) { users[idx].avatarImg = e.target.result; storage.local.set('users', users); }
                const avatar = document.getElementById('profileAvatar');
                if (avatar) avatar.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            };
            reader.readAsDataURL(file);
        });
    }
})();

window.toggleProfilePw = function() {
    const input = document.getElementById('profilePassword');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
};

window.saveProfile = function() {
    const user = storage.local.get('currentUser');
    if (!user) return;
    const newName  = document.getElementById('profileName').value.trim();
    const newPhone = document.getElementById('profilePhone').value.trim();
    const newPass  = document.getElementById('profilePassword').value.trim();

    if (!newName) { showConfirm('Validation', 'Name cannot be empty.', () => {}); return; }
    if (newPhone && !/^[0-9]{10}$/.test(newPhone)) { showConfirm('Validation', 'Phone must be 10 digits.', () => {}); return; }
    if (newPass && newPass.length < 6) { showConfirm('Validation', 'Password must be at least 6 characters.', () => {}); return; }

    const users = storage.local.get('users', []);
    const idx = users.findIndex(u => u.name === user.name && u.role === user.role);
    if (idx !== -1) {
        users[idx].name  = newName;
        if (newPhone) users[idx].phone = newPhone;
        if (newPass)  users[idx].password = newPass;
        storage.local.set('users', users);
    }
    user.name  = newName;
    if (newPhone) user.phone = newPhone;
    storage.local.set('currentUser', user);
    document.getElementById('userName').textContent = newName;
    document.getElementById('profilePassword').value = '';
    loadProfile();
    showConfirm('✅ Saved', 'Your profile has been updated successfully.', () => {});
};

// hook profile page load
const _navOrig = navigateTo;
window.navigateTo = function(pageId) {
    _navOrig(pageId);
    if (pageId === 'profile') loadProfile();
};

// ── Session Timeout (30 min inactivity) ──
(function() {
    let _timer;
    const TIMEOUT = 30 * 60 * 1000;
    function resetTimer() {
        clearTimeout(_timer);
        _timer = setTimeout(() => {
            const user = storage.local.get('currentUser');
            if (user) {
                storage.local.remove('currentUser');
                sessionStorage.clear();
                checkAuth();
                showConfirm('Session Expired', 'You were logged out due to 30 minutes of inactivity.', () => {});
            }
        }, TIMEOUT);
    }
    ['mousemove','keydown','click','scroll','touchstart'].forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
})();

// ── Fix profile nav visibility in checkAuth ──
// hide profile link for admin, show for user
const _origCheckAuth = checkAuth;
document.addEventListener('DOMContentLoaded', () => {
    const user = storage.local.get('currentUser');
    if (user) {
        const profileLinks = document.querySelectorAll('.user-only');
        profileLinks.forEach(l => l.style.display = user.role === 'admin' ? 'none' : 'block');
    }
});

// ══════════════════════════════════════════
//  MAP SEARCH  —  Google Maps Style
// ══════════════════════════════════════════

const MAP_CATEGORIES = [
    { label: 'Hospital',      icon: '🏥', query: 'hospital' },
    { label: 'Police',        icon: '👮', query: 'police station' },
    { label: 'School',        icon: '🏫', query: 'school' },
    { label: 'Restaurant',    icon: '🍽️', query: 'restaurant' },
    { label: 'Petrol Bunk',   icon: '⛽', query: 'petrol station' },
    { label: 'ATM',           icon: '🏧', query: 'ATM' },
    { label: 'Bus Stand',     icon: '🚌', query: 'bus stand' },
    { label: 'Park',          icon: '🌳', query: 'park' },
];

let _suggestTimer = null;
let _activeSuggestIdx = -1;
let _currentSuggestions = [];

function _saveRecentSearch(query) {
    let recents = JSON.parse(localStorage.getItem('mapRecentSearches') || '[]');
    recents = [query, ...recents.filter(r => r !== query)].slice(0, 5);
    localStorage.setItem('mapRecentSearches', JSON.stringify(recents));
}

function _getRecentSearches() {
    return JSON.parse(localStorage.getItem('mapRecentSearches') || '[]');
}

function _showResultCard(displayName, type) {
    const card = document.getElementById('mapResultCard');
    const name = document.getElementById('mapResultName');
    const addr = document.getElementById('mapResultAddr');
    const icon = document.getElementById('mapResultIcon');
    if (!card) return;
    const parts = displayName.split(',');
    const icons = { hospital:'🏥', school:'🏫', restaurant:'🍽️', park:'🌳', police:'👮', fuel:'⛽', atm:'🏧', bus_stop:'🚌' };
    icon.textContent = icons[type] || '📍';
    name.textContent = parts[0].trim();
    addr.textContent = parts.slice(1, 3).join(',').trim();
    card.style.display = 'flex';
}

window.mapSearchFocus = function() {
    const input = document.getElementById('mapSearchInput');
    if (!input) return;
    if (!input.value.trim()) {
        _renderSuggestionsDefault();
    } else {
        mapSearchSuggest(input.value);
    }
};

window.mapSearchSuggest = function(val) {
    const clear = document.getElementById('mapSearchClear');
    if (clear) clear.style.display = val ? 'block' : 'none';

    clearTimeout(_suggestTimer);
    if (!val.trim()) { _renderSuggestionsDefault(); return; }

    _suggestTimer = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=6&addressdetails=1`)
            .then(r => r.json())
            .then(data => _renderSuggestionsResults(val, data))
            .catch(() => _renderSuggestionsDefault());
    }, 300);
};

function _renderSuggestionsDefault() {
    const box = document.getElementById('mapSuggestions');
    if (!box) return;
    const recents = _getRecentSearches();
    const places  = storage.local.get('touristPlaces', []).slice(0, 3);

    let html = '';

    if (recents.length) {
        html += `<div class="map-suggest-section">
            <div class="map-suggest-label">Recent Searches</div>
            ${recents.map((r,i) => `
            <div class="map-suggest-item" onclick="mapPickSuggest('${r.replace(/'/g,"\\'")}')">
                <div class="map-suggest-ico recent">🕐</div>
                <div class="map-suggest-text"><strong>${sanitizeHTML(r)}</strong></div>
                <span class="map-suggest-arrow">↗</span>
            </div>`).join('')}
        </div><div class="map-suggest-divider"></div>`;
    }

    html += `<div class="map-suggest-section">
        <div class="map-suggest-label">Quick Categories</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;padding:0.4rem 1rem 0.6rem;">
            ${MAP_CATEGORIES.map(c => `
            <button onclick="mapPickCategory('${c.query}')" style="display:flex;align-items:center;gap:0.35rem;padding:0.35rem 0.75rem;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);font-size:0.78rem;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all 0.2s;font-family:inherit;"
                onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)';this.style.background='rgba(99,102,241,0.06)'"
                onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)';this.style.background='var(--bg-card)'">
                ${c.icon} ${c.label}
            </button>`).join('')}
        </div>
    </div>`;

    if (places.length) {
        html += `<div class="map-suggest-divider"></div>
        <div class="map-suggest-section">
            <div class="map-suggest-label">Tourist Places</div>
            ${places.map(p => `
            <div class="map-suggest-item" onclick="mapPickSuggest('${(p.address||p.name).replace(/'/g,"\\'")}')">
                <div class="map-suggest-ico place">${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : '🏛️'}</div>
                <div class="map-suggest-text"><strong>${sanitizeHTML(p.name)}</strong><span>${sanitizeHTML(p.address||'')}</span></div>
                <span class="map-suggest-arrow">↗</span>
            </div>`).join('')}
        </div>`;
    }

    box.innerHTML = html;
    box.style.display = 'block';
    _activeSuggestIdx = -1;
}

function _renderSuggestionsResults(query, data) {
    const box = document.getElementById('mapSuggestions');
    if (!box) return;
    _currentSuggestions = data;

    let html = `<div class="map-suggest-section">
        <div class="map-suggest-label">Results for "${sanitizeHTML(query)}"</div>`;

    if (!data.length) {
        html += `<div style="padding:1rem;text-align:center;color:#94a3b8;font-size:0.85rem;">No results found</div>`;
    } else {
        html += data.map((item, i) => {
            const parts = item.display_name.split(',');
            const name  = parts[0].trim();
            const sub   = parts.slice(1,3).join(',').trim();
            const icons = { hospital:'🏥', school:'🏫', restaurant:'🍽️', park:'🌳', police:'👮', fuel:'⛽', atm:'🏧', bus_stop:'🚌' };
            const ico   = icons[item.type] || '📍';
            return `<div class="map-suggest-item" data-idx="${i}" onclick="mapPickResult(${i})">
                <div class="map-suggest-ico result">${ico}</div>
                <div class="map-suggest-text"><strong>${sanitizeHTML(name)}</strong><span>${sanitizeHTML(sub)}</span></div>
                <span class="map-suggest-arrow">↗</span>
            </div>`;
        }).join('');
    }
    html += '</div>';
    box.innerHTML = html;
    box.style.display = 'block';
    _activeSuggestIdx = -1;
}

window.mapPickSuggest = function(query) {
    document.getElementById('mapSearchInput').value = query;
    document.getElementById('mapSearchClear').style.display = 'block';
    closeMapSuggestions();
    searchMapLocation();
};

window.mapPickCategory = function(query) {
    const input = document.getElementById('mapSearchInput');
    input.value = query;
    document.getElementById('mapSearchClear').style.display = 'block';
    closeMapSuggestions();
    searchMapLocation();
};

window.mapPickResult = function(idx) {
    const item = _currentSuggestions[idx];
    if (!item) return;
    document.getElementById('mapSearchInput').value = item.display_name.split(',')[0].trim();
    document.getElementById('mapSearchClear').style.display = 'block';
    currentLat = parseFloat(item.lat);
    currentLon = parseFloat(item.lon);
    currentZoom = 15;
    _saveRecentSearch(item.display_name.split(',')[0].trim());
    closeMapSuggestions();
    renderMap();
    _showResultCard(item.display_name, item.type);
};

window.clearMapSearch = function() {
    const input = document.getElementById('mapSearchInput');
    input.value = '';
    document.getElementById('mapSearchClear').style.display = 'none';
    document.getElementById('mapResultCard').style.display = 'none';
    input.focus();
    _renderSuggestionsDefault();
};

function closeMapSuggestions() {
    const box = document.getElementById('mapSuggestions');
    if (box) box.style.display = 'none';
    _activeSuggestIdx = -1;
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const box = document.getElementById('mapSuggestions');
    if (!box || box.style.display === 'none') return;
    const items = box.querySelectorAll('.map-suggest-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        _activeSuggestIdx = Math.min(_activeSuggestIdx + 1, items.length - 1);
        items.forEach((el,i) => el.classList.toggle('active', i === _activeSuggestIdx));
        items[_activeSuggestIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _activeSuggestIdx = Math.max(_activeSuggestIdx - 1, 0);
        items.forEach((el,i) => el.classList.toggle('active', i === _activeSuggestIdx));
        items[_activeSuggestIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && _activeSuggestIdx >= 0) {
        e.preventDefault();
        items[_activeSuggestIdx]?.click();
    } else if (e.key === 'Escape') {
        closeMapSuggestions();
    }
});

// Close on outside click
document.addEventListener('click', function(e) {
    const box  = document.getElementById('mapSuggestions');
    const wrap = document.getElementById('mapSearchBox');
    if (box && wrap && !wrap.contains(e.target)) closeMapSuggestions();
});

// ══════════════════════════════════════════
//  REPORT ISSUE  —  Multi-step logic
// ══════════════════════════════════════════

let _reportStep = 1;
const _reportTotalSteps = 3;

window.selectCategory = function(val) {
    document.getElementById('category').value = val;
    document.querySelectorAll('.report-cat-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.value === val);
    });
    document.getElementById('categoryError').textContent = '';
};

window.reportStepNext = function() {
    if (_reportStep === 1) {
        const name  = document.getElementById('name');
        const phone = document.getElementById('phone');
        const cat   = document.getElementById('category');
        const desc  = document.getElementById('description');
        let ok = true;
        if (!name.value.trim())  { name.style.borderColor='#ef4444'; ok=false; } else name.style.borderColor='';
        if (!phone.value.trim() || !/^[0-9]{10}$/.test(phone.value)) { phone.style.borderColor='#ef4444'; ok=false; } else phone.style.borderColor='';
        if (!cat.value)  { document.getElementById('categoryError').textContent='Please select a category'; ok=false; }
        if (desc.value.trim().length < 10) { desc.style.borderColor='#ef4444'; ok=false; } else desc.style.borderColor='';
        if (!ok) return;
    }
    if (_reportStep === 2) {
        const loc = document.getElementById('location');
        if (!loc.value.trim()) { loc.style.borderColor='#ef4444'; return; }
        loc.style.borderColor='';
    }
    if (_reportStep < _reportTotalSteps) {
        _reportStep++;
        _updateReportStepUI();
    }
};

window.reportStepBack = function() {
    if (_reportStep > 1) { _reportStep--; _updateReportStepUI(); }
};

function _updateReportStepUI() {
    for (let i = 1; i <= _reportTotalSteps; i++) {
        const content = document.getElementById(`stepContent${i}`);
        const stepEl  = document.getElementById(`step${i}`);
        if (content) content.classList.toggle('active', i === _reportStep);
        if (stepEl) {
            stepEl.classList.remove('active','done');
            if (i === _reportStep) stepEl.classList.add('active');
            else if (i < _reportStep) stepEl.classList.add('done');
        }
    }
    // step lines
    document.querySelectorAll('.report-step-line').forEach((line, idx) => {
        line.classList.toggle('done', idx + 1 < _reportStep);
    });
    const back   = document.getElementById('reportBtnBack');
    const next   = document.getElementById('reportBtnNext');
    const submit = document.getElementById('reportBtnSubmit');
    if (back)   back.style.display   = _reportStep > 1 ? 'block' : 'none';
    if (next)   next.style.display   = _reportStep < _reportTotalSteps ? 'block' : 'none';
    if (submit) submit.style.display = _reportStep === _reportTotalSteps ? 'block' : 'none';

    // load map preview on step 2
    if (_reportStep === 2) _updateReportMapPreview();
    // load mini stats on right panel
    _loadReportMiniStats();
}

function _updateReportMapPreview() {
    const loc = document.getElementById('location').value.trim();
    const preview = document.getElementById('reportMapPreview');
    if (!preview) return;
    if (!loc) { preview.innerHTML = '<span>🗺️ Enter location above to preview on map</span>'; return; }
    preview.innerHTML = '<span>🔍 Loading map...</span>';
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`)
        .then(r => r.json())
        .then(data => {
            if (data && data[0]) {
                const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
                const delta = 0.008;
                preview.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-delta},${lat-delta},${lon+delta},${lat+delta}&layer=mapnik&marker=${lat},${lon}" style="width:100%;height:100%;border:none;"></iframe>`;
            } else {
                preview.innerHTML = '<span>📍 Location not found on map</span>';
            }
        }).catch(() => { preview.innerHTML = '<span>🗺️ Map preview unavailable</span>'; });
}

window.autoLocate = function() {
    const btn = document.querySelector('.report-locate-btn');
    if (btn) btn.textContent = '⏳';
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
            .then(r => r.json())
            .then(data => {
                document.getElementById('location').value = data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`;
                if (btn) btn.textContent = '📍';
                _updateReportMapPreview();
            }).catch(() => { if (btn) btn.textContent = '📍'; });
    }, () => { if (btn) btn.textContent = '📍'; });
};

// Drag-drop photo
(function() {
    const drop = document.getElementById('reportPhotoDrop');
    if (!drop) return;
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) _handleReportPhoto(file);
    });
})();

function _handleReportPhoto(file) {
    const reader = new FileReader();
    reader.onload = e => {
        window._issuePhotoData = e.target.result;
        const inner = document.getElementById('reportPhotoDropInner');
        if (inner) inner.innerHTML = `<img src="${e.target.result}" style="max-height:140px;border-radius:10px;"><small style="color:#10b981;font-weight:700;">✅ Photo attached</small>`;
    };
    reader.readAsDataURL(file);
}

// Override existing photo input handler for new drop zone
const _photoInput2 = document.getElementById('issuePhoto');
if (_photoInput2) {
    _photoInput2.addEventListener('change', function() {
        if (this.files[0]) _handleReportPhoto(this.files[0]);
    });
}

// Description char count
const _descTA = document.getElementById('description');
if (_descTA) {
    _descTA.addEventListener('input', function() {
        const el = document.getElementById('descCount');
        if (el) el.textContent = `${this.value.length} / 500`;
        if (this.value.length > 500) this.value = this.value.slice(0, 500);
    });
}

// Location input → update map preview on blur
const _locInput = document.getElementById('location');
if (_locInput) _locInput.addEventListener('blur', _updateReportMapPreview);

// Mini stats for right panel
function _loadReportMiniStats() {
    const el = document.getElementById('reportMiniStats');
    if (!el) return;
    const issues = storage.local.get('issues', []);
    const user   = storage.local.get('currentUser');
    const mine   = user ? issues.filter(i => i.userName === user.name || i.name === user.name) : [];
    el.innerHTML = `
        <div class="report-mini-stat"><strong>${issues.length}</strong><small>Total</small></div>
        <div class="report-mini-stat"><strong>${issues.filter(i=>i.status==='pending').length}</strong><small>Pending</small></div>
        <div class="report-mini-stat"><strong>${mine.length}</strong><small>Mine</small></div>
    `;
}

// Reset form to step 1 after submit
window.reportAgain = function() {
    _reportStep = 1;
    _updateReportStepUI();
    document.getElementById('reportForm').reset();
    document.getElementById('reportForm').style.display = 'block';
    document.getElementById('successMessage').classList.add('hidden');
    window._issuePhotoData = null;
    const inner = document.getElementById('reportPhotoDropInner');
    if (inner) inner.innerHTML = `<span>📸</span><strong>Click or drag photo here</strong><small>JPG, PNG up to 5MB</small>`;
    document.querySelectorAll('.report-cat-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('descCount').textContent = '0 / 500';
};

// Init step 1 on load
_updateReportStepUI();
_loadReportMiniStats();
