const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'smart-city-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('./smartcity.db', (err) => {
    if (err) console.error(err);
    else console.log('✅ Database connected');
});

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS issues (
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
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tourist_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        icon TEXT DEFAULT '🏛️',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS emergency_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        number TEXT NOT NULL,
        address TEXT,
        map_link TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        route TEXT NOT NULL,
        time TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        time INTEGER NOT NULL
    )`);
});

// Auth Middleware
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

// Auth Routes
app.post('/api/register', async (req, res) => {
    const { name, phone, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
        [name, phone, hashedPassword, role || 'user'],
        function(err) {
            if (err) return res.status(400).json({ error: 'User exists' });
            res.json({ message: 'User created', id: this.lastID });
        });
});

app.post('/api/login', (req, res) => {
    const { name, password, role } = req.body;
    db.get('SELECT * FROM users WHERE name = ? AND role = ?', [name, role], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET);
        res.json({ token, user: { name: user.name, role: user.role, phone: user.phone } });
    });
});

// Issues Routes
app.get('/api/issues', auth, (req, res) => {
    const query = req.user.role === 'admin' 
        ? 'SELECT * FROM issues ORDER BY created_at DESC'
        : 'SELECT * FROM issues WHERE user_name = ? ORDER BY created_at DESC';
    const params = req.user.role === 'admin' ? [] : [req.user.name];
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/issues', auth, (req, res) => {
    const { name, phone, category, location, description } = req.body;
    db.run('INSERT INTO issues (user_name, name, phone, category, location, description) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.name, name, phone, category, location, description],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Issue reported' });
        });
});

app.put('/api/issues/:id', auth, (req, res) => {
    const { status, solution, rating } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (solution) { updates.push('solution = ?'); params.push(solution); }
    if (rating) { updates.push('rating = ?'); params.push(rating); }
    params.push(req.params.id);
    db.run(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Issue updated' });
    });
});

app.delete('/api/issues/:id', auth, (req, res) => {
    db.run('DELETE FROM issues WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Issue deleted' });
    });
});

// Tourist Places Routes
app.get('/api/places', (req, res) => {
    db.all('SELECT * FROM tourist_places', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/places', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, image, description, address, icon } = req.body;
    db.run('INSERT INTO tourist_places (name, image, description, address, icon) VALUES (?, ?, ?, ?, ?)',
        [name, image, description, address, icon || '🏛️'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Place added' });
        });
});

app.delete('/api/places/:id', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.run('DELETE FROM tourist_places WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Place deleted' });
    });
});

// Emergency Numbers Routes
app.get('/api/emergency', (req, res) => {
    db.all('SELECT * FROM emergency_numbers', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/emergency', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { service, number, address, map_link } = req.body;
    db.run('INSERT INTO emergency_numbers (service, number, address, map_link) VALUES (?, ?, ?, ?)',
        [service, number, address, map_link],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Emergency number added' });
        });
});

// Buses Routes
app.get('/api/buses', (req, res) => {
    db.all('SELECT * FROM buses', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/buses', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { number, route, time } = req.body;
    db.run('INSERT INTO buses (number, route, time) VALUES (?, ?, ?)',
        [number, route, time],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Bus added' });
        });
});

// Alerts Routes
app.get('/api/alerts', (req, res) => {
    db.all('SELECT * FROM alerts ORDER BY time DESC LIMIT 10', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/alerts', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { type, message } = req.body;
    db.run('INSERT INTO alerts (type, message, time) VALUES (?, ?, ?)',
        [type, message, Date.now()],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Alert added' });
        });
});

// Users Routes (Admin only)
app.get('/api/users', auth, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.all('SELECT id, name, phone, role, created_at FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
