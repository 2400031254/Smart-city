const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

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
        appScreen.classList.remove('hidden');
        userName.textContent = user.name;
        userRole.textContent = user.role || 'user';
        userRole.className = `user-role ${user.role || 'user'}`;
        
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => link.style.display = user.role === 'admin' ? 'block' : 'none');
        
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
    } else {
        authScreen.style.display = 'flex';
        appScreen.classList.add('hidden');
    }
}

checkAuth();

if (!storage.local.get('users')) {
    const defaultUsers = [
        { name: 'srisanth', phone: '1234567890', password: 'SASI@1234', role: 'admin', registeredAt: new Date().toISOString() },
        { name: 'Admin User', phone: '1234567891', password: 'admin123', role: 'admin', registeredAt: new Date().toISOString() },
        { name: 'Regular User', phone: '0987654321', password: 'user123', role: 'user', registeredAt: new Date().toISOString() }
    ];
    storage.local.set('users', defaultUsers);
}

const userLoginBtn = document.getElementById('userLoginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const loginRoleInput = document.getElementById('loginRole');

if (userLoginBtn && adminLoginBtn) {
    userLoginBtn.classList.add('active');
    
    userLoginBtn.addEventListener('click', () => {
        userLoginBtn.classList.add('active');
        adminLoginBtn.classList.remove('active');
        loginRoleInput.value = 'user';
    });
    
    adminLoginBtn.addEventListener('click', () => {
        adminLoginBtn.classList.add('active');
        userLoginBtn.classList.remove('active');
        loginRoleInput.value = 'admin';
    });
}

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
    
    storage.local.set('currentPage', pageId);
    storage.session.set('lastVisited', { page: pageId, time: new Date().toISOString() });
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
    const sessionData = {
        sessionStart: storage.session.get('sessionStart'),
        sessionEnd: new Date().toISOString(),
        lastPage: storage.session.get('lastVisited')
    };
    
    const sessions = storage.local.get('sessions', []);
    sessions.push(sessionData);
    storage.local.set('sessions', sessions);
    
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
        console.log('CAPTCHA generated:', captcha);
    } else {
        console.error('CAPTCHA element not found');
    }
}

setTimeout(() => {
    generateCaptcha();
}, 100);

document.getElementById('refreshCaptcha').addEventListener('click', () => {
    generateCaptcha();
    document.getElementById('captchaInput').value = '';
});

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

loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    loginFormElement.querySelectorAll('input:not([type="hidden"])').forEach(field => {
        if (!validateAuthField(field)) isValid = false;
    });
    
    if (isValid) {
        const name = document.getElementById('loginName').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        const captchaInput = document.getElementById('captchaInput').value.toUpperCase();
        const users = storage.local.get('users', []);
        
        if (captchaInput !== currentCaptcha) {
            const captchaField = document.getElementById('captchaInput');
            captchaField.classList.add('error');
            captchaField.parentElement.querySelector('.error-message').textContent = 'Invalid CAPTCHA';
            generateCaptcha();
            return;
        }
        
        const user = users.find(u => u.name === name && u.password === password && u.role === role);
        
        if (user) {
            storage.local.set('currentUser', user);
            storage.local.set('lastLogin', new Date().toISOString());
            loginFormElement.reset();
            loginFormElement.querySelectorAll('input').forEach(f => f.classList.remove('success', 'error'));
            userLoginBtn.classList.add('active');
            adminLoginBtn.classList.remove('active');
            loginRoleInput.value = 'user';
            generateCaptcha();
            checkAuth();
        } else {
            const nameField = document.getElementById('loginName');
            nameField.classList.add('error');
            nameField.parentElement.querySelector('.error-message').textContent = 'Invalid credentials for selected login type';
            generateCaptcha();
        }
    }
});

registerFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    registerFormElement.querySelectorAll('input').forEach(field => {
        if (!validateAuthField(field)) isValid = false;
    });
    
    if (isValid) {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPassword').value;
        
        const users = storage.local.get('users', []);
        
        if (users.find(u => u.name === name)) {
            const nameField = document.getElementById('regName');
            nameField.classList.add('error');
            nameField.parentElement.querySelector('.error-message').textContent = 'Name already registered';
            return;
        }
        
        if (users.find(u => u.phone === phone)) {
            const phoneField = document.getElementById('regPhone');
            phoneField.classList.add('error');
            phoneField.parentElement.querySelector('.error-message').textContent = 'Phone number already registered';
            return;
        }
        
        const newUser = { name, phone, password, role: 'user', registeredAt: new Date().toISOString() };
        users.push(newUser);
        storage.local.set('users', users);
        storage.local.set('currentUser', newUser);
        
        registerFormElement.reset();
        registerFormElement.querySelectorAll('input').forEach(f => f.classList.remove('success', 'error'));
        checkAuth();
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

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    form.querySelectorAll('input, select, textarea').forEach(field => {
        if (!validateField(field)) isValid = false;
    });
    
    if (isValid) {
        const currentUser = storage.local.get('currentUser');
        const issue = {
            id: Date.now(),
            name: document.getElementById('name').value,
            userName: currentUser ? currentUser.name : document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            status: 'pending',
            date: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString()
        };
        
        const issues = storage.local.get('issues', []);
        issues.push(issue);
        storage.local.set('issues', issues);
        
        updateNotificationBadge();
        
        clearFormDraft('reportForm');
        
        const refId = 'SC' + issue.id.toString().slice(-8);
        document.getElementById('refId').textContent = refId;
        
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
        
        setTimeout(() => {
            form.reset();
            form.querySelectorAll('input, select, textarea').forEach(field => {
                field.classList.remove('success', 'error');
            });
            form.style.display = 'block';
            successMessage.classList.add('hidden');
        }, 5000);
    }
});

form.addEventListener('reset', () => {
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.classList.remove('success', 'error');
        field.parentElement.querySelector('.error-message').textContent = '';
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

function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
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
    
    if (places.length === 0) {
        touristPlacesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><h3>No tourist places available</h3><p>Check back later for amazing destinations!</p></div>';
        return;
    }
    
    touristPlacesList.innerHTML = places.map(place => `
        <div class="tourist-card">
            ${place.image ? `<img src="${place.image}" alt="${place.name}" style="width: 100%; height: 200px; object-fit: cover;">` : ''}
            <div class="tourist-card-header">
                <h3>🏛️ ${place.name}</h3>
            </div>
            <div class="tourist-card-body">
                <p>${place.description}</p>
                <div class="tourist-card-address">
                    <span>📍</span>
                    <span>${place.address}</span>
                </div>
                <div class="tourist-card-map">
                    <iframe 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(place.address)}&output=embed" 
                        width="100%" 
                        height="250" 
                        style="border:0;" 
                        loading="lazy">
                    </iframe>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAdminTouristPlaces() {
    const adminTouristList = document.getElementById('adminTouristList');
    const places = storage.local.get('touristPlaces', []);
    
    if (places.length === 0) {
        adminTouristList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No tourist places added yet. Click "Add Tourist Place" to get started.</p>';
        return;
    }
    
    adminTouristList.innerHTML = places.map(place => `
        <div class="admin-list-item">
            <div>
                <h4>🏛️ ${place.name}</h4>
                <p>${place.description}</p>
                <small style="opacity: 0.7;">📍 ${place.address}</small>
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
    document.getElementById('touristDescription').value = '';
    document.getElementById('touristAddress').value = '';
    document.getElementById('touristModal').classList.remove('hidden');
};

window.editTourist = function(id) {
    const places = storage.local.get('touristPlaces', []);
    const place = places.find(p => p.id === id);
    
    if (place) {
        document.getElementById('touristId').value = place.id;
        document.getElementById('touristName').value = place.name;
        document.getElementById('touristImage').value = place.image || '';
        document.getElementById('touristDescription').value = place.description;
        document.getElementById('touristAddress').value = place.address;
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
    
    if (!name || !description || !address) {
        alert('Please fill all required fields');
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
        places.push({ id: Date.now(), name, image, description, address });
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
});

function renderIssues() {
    const issuesList = document.getElementById('issuesList');
    const emptyState = document.getElementById('emptyState');
    const issues = storage.local.get('issues', []);
    const user = storage.local.get('currentUser');
    
    console.log('All issues:', issues);
    console.log('Current user:', user);
    
    if (!user) {
        issuesList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    storage.session.set('issuesViewedAt', new Date().toISOString());
    
    let userIssues = issues.filter(i => i.userName === user.name || i.name === user.name);
    console.log('User issues:', userIssues);
    
    userIssues.forEach(issue => {
        if (issue.solution) issue.solutionViewed = true;
        if (issue.status === 'resolved') issue.resolvedViewed = true;
    });
    storage.local.set('issues', issues);
    updateNotificationBadge();
    
    if (userIssues.length === 0) {
        issuesList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    issuesList.innerHTML = userIssues.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <div class="issue-title">
                    <span>${getCategoryIcon(issue.category)}</span>
                    <span>${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}</span>
                </div>
                <span class="issue-status ${issue.status}">${issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}</span>
            </div>
            <div class="issue-body">
                <p><strong>Location:</strong> ${issue.location}</p>
                <p><strong>Description:</strong> ${issue.description}</p>
                ${issue.solution ? `<p style="background: #d4edda; padding: 0.75rem; border-radius: 8px; margin: 0.5rem 0;"><strong>✅ Admin Solution:</strong> ${issue.solution}</p>` : ''}
                ${issue.rating ? `<p><strong>Your Rating:</strong> ${'⭐'.repeat(issue.rating)}</p>` : ''}
                <p><strong>Reported:</strong> ${issue.date}</p>
            </div>
            <div class="issue-actions">
                ${issue.status === 'pending' ? `<button class="btn-edit" onclick="editIssue(${issue.id})">Edit</button>` : ''}
                ${(issue.status === 'resolved' || issue.status === 'completed') && !issue.rating ? `
                    <button class="btn-primary" onclick="rateIssue(${issue.id})">Rate Solution</button>
                    <button class="btn-secondary" onclick="skipRating(${issue.id})">Skip Rating</button>
                ` : ''}
                <button class="btn-delete" onclick="deleteIssue(${issue.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        pothole: '🕳️',
        streetlight: '💡',
        traffic: '🚦',
        waste: '🗑️',
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
    });
});

function renderUserEmergencyNumbers() {
    const userEmergencyList = document.getElementById('userEmergencyList');
    const numbers = storage.local.get('emergencyNumbers', [
        { id: 1, service: 'Police', number: '911', address: '', mapLink: '' },
        { id: 2, service: 'Fire Department', number: '911', address: '', mapLink: '' },
        { id: 3, service: 'Ambulance', number: '911', address: '', mapLink: '' },
        { id: 4, service: 'City Hall', number: '311', address: '', mapLink: '' }
    ]);
    
    if (numbers.length === 0) {
        userEmergencyList.innerHTML = '<p>No emergency numbers available.</p>';
        return;
    }
    
    userEmergencyList.innerHTML = numbers.map(num => `
        <div class="emergency-card user-emergency">
            <div class="emergency-info">
                <h4>${num.service}</h4>
                <p><a href="tel:${num.number}">${num.number}</a></p>
                ${num.address ? `
                    <small>📍 ${num.address}</small>
                    <div style="margin-top: 0.5rem;">
                        <iframe 
                            src="https://maps.google.com/maps?q=${encodeURIComponent(num.address)}&output=embed" 
                            width="100%" 
                            height="200" 
                            style="border:0; border-radius: 8px;" 
                            loading="lazy">
                        </iframe>
                    </div>
                ` : ''}
                ${num.mapLink && !num.address ? `<small><a href="${num.mapLink}" target="_blank">🗺️ View Map</a></small>` : ''}
            </div>
            <div class="emergency-call">
                <a href="tel:${num.number}" class="btn-call">📞 Call</a>
            </div>
        </div>
    `).join('');
}

function renderAdminPanel() {
    const issues = storage.local.get('issues', []);
    const users = storage.local.get('users', []);
    const places = storage.local.get('touristPlaces', []);
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalIssues').textContent = issues.length;
    document.getElementById('pendingIssues').textContent = issues.filter(i => i.status === 'pending').length;
    const totalPlacesEl = document.getElementById('totalPlaces');
    if (totalPlacesEl) totalPlacesEl.textContent = places.length;
    
    renderAdminUsers();
    renderRegularUsers();
    renderAdminTouristPlaces();
    renderBusList();
    renderAdminAlerts();
    renderParkingManagement();
    renderEmergencyNumbers();
    
    const adminIssuesList = document.getElementById('adminIssuesList');
    adminIssuesList.innerHTML = issues.map(issue => `
        <div class="issue-card">
            <div class="issue-header">
                <div class="issue-title">
                    <span>${getCategoryIcon(issue.category)}</span>
                    <span>${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}</span>
                </div>
                <span class="issue-status ${issue.status}">${issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}</span>
            </div>
            <div class="issue-body">
                <p><strong>Reported by:</strong> ${issue.name} (${issue.phone})</p>
                <p><strong>Location:</strong> ${issue.location}</p>
                <p><strong>Description:</strong> ${issue.description}</p>
                ${issue.solution ? `<p><strong>Solution:</strong> ${issue.solution}</p>` : ''}
                ${issue.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(issue.rating)}</p>` : ''}
                <p><strong>Date:</strong> ${issue.date}</p>
            </div>
            <div class="issue-actions">
                ${issue.status === 'pending' ? `<button class="btn-primary" onclick="addSolution(${issue.id})">Add Solution</button>` : ''}
                ${issue.status === 'pending' ? `<button class="btn-resolve" onclick="resolveIssue(${issue.id})">Mark Resolved</button>` : ''}
                ${issue.status === 'resolved' ? `<button class="btn-primary" onclick="completeIssue(${issue.id})">Mark Completed</button>` : ''}
                <button class="btn-delete" onclick="adminDeleteIssue(${issue.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

window.resolveIssue = function(id) {
    let issues = storage.local.get('issues', []);
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) {
        issues[index].status = 'resolved';
        issues[index].resolvedAt = new Date().toISOString();
        issues[index].resolvedViewed = false;
        storage.local.set('issues', issues);
        renderAdminPanel();
        renderIssues();
        updateNotificationBadge();
        alert('Issue marked as resolved. User can now rate the solution.');
    }
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
        }
    }
};

window.completeIssue = function(id) {
    let issues = storage.local.get('issues', []);
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) {
        issues[index].status = 'completed';
        issues[index].completedAt = new Date().toISOString();
        storage.local.set('issues', issues);
        renderAdminPanel();
    }
};

window.adminDeleteIssue = function(id) {
    if (confirm('Are you sure you want to delete this issue?')) {
        let issues = storage.local.get('issues', []);
        issues = issues.filter(i => i.id !== id);
        storage.local.set('issues', issues);
        renderAdminPanel();
    }
};

function renderEmergencyNumbers() {
    const emergencyList = document.getElementById('emergencyList');
    const numbers = storage.local.get('emergencyNumbers', [
        { id: 1, service: 'Police', number: '911', address: '', mapLink: '' },
        { id: 2, service: 'Fire Department', number: '911', address: '', mapLink: '' },
        { id: 3, service: 'Ambulance', number: '911', address: '', mapLink: '' },
        { id: 4, service: 'City Hall', number: '311', address: '', mapLink: '' }
    ]);
    
    if (numbers.length === 0) {
        emergencyList.innerHTML = '<p>No emergency numbers added yet.</p>';
        return;
    }
    
    emergencyList.innerHTML = numbers.map(num => `
        <div class="emergency-card">
            <div class="emergency-info">
                <h4>${num.service}</h4>
                <p>${num.number}</p>
                ${num.address ? `
                    <small>📍 ${num.address}</small>
                    <div style="margin-top: 0.5rem;">
                        <iframe 
                            src="https://maps.google.com/maps?q=${encodeURIComponent(num.address)}&output=embed" 
                            width="100%" 
                            height="200" 
                            style="border:0; border-radius: 8px;" 
                            loading="lazy">
                        </iframe>
                    </div>
                ` : ''}
                ${num.mapLink && !num.address ? `<small><a href="${num.mapLink}" target="_blank">🗺️ View Map</a></small>` : ''}
            </div>
            <div class="emergency-actions">
                <button class="btn-icon" onclick="editEmergency(${num.id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteEmergency(${num.id})" title="Delete">🗑️</button>
            </div>
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

window.deleteUser = function(name) {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
        let users = storage.local.get('users', []);
        users = users.filter(u => u.name !== name);
        storage.local.set('users', users);
        renderRegularUsers();
    }
};

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

colorOptionBtns.forEach(btn => {
    if (btn.dataset.color === savedColor) {
        btn.classList.add('selected');
    }
    
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        html.style.setProperty('--accent', color);
        html.style.setProperty('--accent-hover', adjustColor(color, -20));
        storage.local.set('accentColor', color);
        
        colorOptionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

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
