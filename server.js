const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createCanvas } = require('canvas');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smart-city-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new Database('./smartcity.db');
console.log('✅ Database connected');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        solution TEXT,
        rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tourist_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        icon TEXT DEFAULT '🏛️',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS emergency_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        number TEXT NOT NULL,
        address TEXT,
        map_link TEXT
    );
    CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        route TEXT NOT NULL,
        time TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        time INTEGER NOT NULL
    );
`);

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Auth
app.post('/api/register', async (req, res) => {
    const { name, phone, password, role } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Name and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (phone && !/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Phone must be 10 digits' });
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = db.prepare('INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)')
            .run(name.trim(), phone, hashedPassword, role === 'admin' ? 'admin' : 'user');
        res.json({ message: 'User created', id: result.lastInsertRowid });
    } catch {
        res.status(400).json({ error: 'User already exists' });
    }
});

app.post('/api/login', async (req, res) => {
    const { name, password, role } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Name and password required' });
    const user = db.prepare('SELECT * FROM users WHERE name = ? AND role = ?').get(name, role || 'user');
    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET);
    res.json({ token, user: { name: user.name, role: user.role, phone: user.phone } });
});

// Issues
app.get('/api/issues', auth, (req, res) => {
    const rows = req.user.role === 'admin'
        ? db.prepare('SELECT * FROM issues ORDER BY created_at DESC').all()
        : db.prepare('SELECT * FROM issues WHERE user_name = ? ORDER BY created_at DESC').all(req.user.name);
    res.json(rows);
});

app.post('/api/issues', auth, (req, res) => {
    const { name, phone, category, location, description } = req.body;
    if (!name || !phone || !category || !location || !description)
        return res.status(400).json({ error: 'All fields are required' });
    if (!/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Phone must be 10 digits' });
    if (description.trim().length < 10) return res.status(400).json({ error: 'Description too short' });
    const result = db.prepare('INSERT INTO issues (user_name, name, phone, category, location, description) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.name, name.trim(), phone, category, location.trim(), description.trim());
    res.json({ id: result.lastInsertRowid, message: 'Issue reported' });
});

app.put('/api/issues/:id', auth, (req, res) => {
    const { status, solution, rating } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (solution) { updates.push('solution = ?'); params.push(solution); }
    if (rating) { updates.push('rating = ?'); params.push(rating); }
    params.push(req.params.id);
    db.prepare(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: 'Issue updated' });
});

app.delete('/api/issues/:id', auth, (req, res) => {
    db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);
    res.json({ message: 'Issue deleted' });
});

// Tourist Places
app.get('/api/places', (req, res) => res.json(db.prepare('SELECT * FROM tourist_places').all()));

app.post('/api/places', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, image, description, address, icon } = req.body;
    const result = db.prepare('INSERT INTO tourist_places (name, image, description, address, icon) VALUES (?, ?, ?, ?, ?)')
        .run(name, image, description, address, icon || '🏛️');
    res.json({ id: result.lastInsertRowid, message: 'Place added' });
});

app.delete('/api/places/:id', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM tourist_places WHERE id = ?').run(req.params.id);
    res.json({ message: 'Place deleted' });
});

// Emergency Numbers
app.get('/api/emergency', (req, res) => res.json(db.prepare('SELECT * FROM emergency_numbers').all()));

app.post('/api/emergency', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { service, number, address, map_link } = req.body;
    const result = db.prepare('INSERT INTO emergency_numbers (service, number, address, map_link) VALUES (?, ?, ?, ?)')
        .run(service, number, address, map_link);
    res.json({ id: result.lastInsertRowid, message: 'Emergency number added' });
});

// Buses
app.get('/api/buses', (req, res) => res.json(db.prepare('SELECT * FROM buses').all()));

app.post('/api/buses', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { number, route, time } = req.body;
    const result = db.prepare('INSERT INTO buses (number, route, time) VALUES (?, ?, ?)').run(number, route, time);
    res.json({ id: result.lastInsertRowid, message: 'Bus added' });
});

// Alerts
app.get('/api/alerts', (req, res) => res.json(db.prepare('SELECT * FROM alerts ORDER BY time DESC LIMIT 10').all()));

app.post('/api/alerts', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { type, message } = req.body;
    const result = db.prepare('INSERT INTO alerts (type, message, time) VALUES (?, ?, ?)').run(type, message, Date.now());
    res.json({ id: result.lastInsertRowid, message: 'Alert added' });
});

// CAPTCHA store (in-memory, keyed by captchaId)
const captchaStore = new Map();

app.get('/api/captcha', (req, res) => {
    // Generate random 6-char text
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 6; i++) text += chars[Math.floor(Math.random() * chars.length)];

    // Draw on canvas
    const canvas = createCanvas(200, 60);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, 200, 60);

    // Noise lines
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `hsl(${Math.random()*360},60%,70%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 200, Math.random() * 60);
        ctx.lineTo(Math.random() * 200, Math.random() * 60);
        ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `hsl(${Math.random()*360},50%,60%)`;
        ctx.beginPath();
        ctx.arc(Math.random()*200, Math.random()*60, 1.5, 0, Math.PI*2);
        ctx.fill();
    }

    // Draw each character with slight rotation
    const colors = ['#3730a3','#7c3aed','#1d4ed8','#0f766e','#b45309'];
    text.split('').forEach((ch, i) => {
        ctx.save();
        ctx.font = `bold ${32 + Math.floor(Math.random()*8)}px Courier New`;
        ctx.fillStyle = colors[i % colors.length];
        ctx.translate(18 + i * 28, 42);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
    });

    // Unique ID to tie captcha to session
    const captchaId = crypto.randomBytes(16).toString('hex');
    captchaStore.set(captchaId, { text, expires: Date.now() + 5 * 60 * 1000 });

    // Clean expired entries
    for (const [k, v] of captchaStore) if (v.expires < Date.now()) captchaStore.delete(k);

    res.json({
        captchaId,
        captchaImage: canvas.toDataURL('image/png')
    });
});

app.post('/api/captcha/verify', (req, res) => {
    const { captchaId, captchaInput } = req.body;
    const entry = captchaStore.get(captchaId);
    if (!entry || entry.expires < Date.now()) return res.json({ valid: false, reason: 'expired' });
    const valid = entry.text === captchaInput.toUpperCase().trim();
    if (valid) captchaStore.delete(captchaId); // one-time use
    res.json({ valid });
});

// Users (Admin only)
app.get('/api/users', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json(db.prepare('SELECT id, name, phone, role, created_at FROM users').all());
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
