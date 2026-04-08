const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 8080;
console.log('Starting server with PORT:', PORT);
console.log('ENV vars:', {
    MYSQLHOST: process.env.MYSQLHOST ? 'SET' : 'NOT SET',
    MYSQLPORT: process.env.MYSQLPORT ? 'SET' : 'NOT SET',
    MYSQLUSER: process.env.MYSQLUSER ? 'SET' : 'NOT SET',
    MYSQLPASSWORD: process.env.MYSQLPASSWORD ? 'SET' : 'NOT SET',
    MYSQLDATABASE: process.env.MYSQLDATABASE ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV
});
const JWT_SECRET = process.env.JWT_SECRET || 'smart-city-secret-key-2024';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Health check for Railway
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || 'nikhil140218',
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.MYSQL_DB || 'smartcity',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const pool = db.promise();

// Create database and tables
async function initDB() {
    // Connect without database first to create it
    const tempConn = mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || '127.0.0.1',
        port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || 'nikhil140218'
    }).promise();

    const dbName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.MYSQL_DB || 'smartcity';
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConn.end();
    console.log(`✅ Database "${dbName}" ready`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15),
        password VARCHAR(255) NOT NULL,
        role ENUM('user','admin') DEFAULT 'user',
        avatar_img LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        category VARCHAR(50) NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        photo LONGTEXT,
        status ENUM('pending','resolved','completed') DEFAULT 'pending',
        priority ENUM('low','medium','high') DEFAULT 'medium',
        solution TEXT,
        rating INT,
        solution_viewed TINYINT(1) DEFAULT 0,
        resolved_viewed TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS tourist_places (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        image LONGTEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        icon VARCHAR(10) DEFAULT '🏛️',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS emergency_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service VARCHAR(100) NOT NULL,
        number VARCHAR(20) NOT NULL,
        address TEXT,
        map_link TEXT
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS buses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number VARCHAR(20) NOT NULL,
        route TEXT NOT NULL,
        time VARCHAR(100) NOT NULL
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('warning','info','success') NOT NULL,
        message TEXT NOT NULL,
        time BIGINT NOT NULL
    )`);

    // Seed default admin if not exists
    const [admins] = await pool.query("SELECT id FROM users WHERE name='nikhil' AND role='admin'");
    if (admins.length === 0) {
        const hashed = await bcrypt.hash('nikhil2006', 10);
        await pool.query("INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)",
            ['nikhil', '0000000000', hashed, 'admin']);
        console.log('✅ Default admin created (nikhil / nikhil2006)');
    }

    // Seed default user if not exists
    const [users] = await pool.query("SELECT id FROM users WHERE name='user' AND role='user'");
    if (users.length === 0) {
        const hashed = await bcrypt.hash('user123', 10);
        await pool.query("INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)",
            ['user', '1111111111', hashed, 'user']);
        console.log('✅ Default user created (user / user123)');
    }

    console.log('✅ All tables ready');
}

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

// ── AUTH ──────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    const { name, phone, password, role } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Name and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (phone && !/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Phone must be 10 digits' });
    try {
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), phone || null, hashed, role === 'admin' ? 'admin' : 'user']);
        res.json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists' });
    }
});

app.post('/api/login', async (req, res) => {
    const { name, password, role } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Name and password required' });
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE name = ? AND role = ?', [name, role || 'user']);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, role: user.role, phone: user.phone } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ISSUES ────────────────────────────────────────
app.get('/api/issues', auth, async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? 'SELECT * FROM issues ORDER BY created_at DESC'
            : 'SELECT * FROM issues WHERE user_name = ? ORDER BY created_at DESC';
        const params = req.user.role === 'admin' ? [] : [req.user.name];
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/issues', auth, async (req, res) => {
    const { name, phone, category, location, description, photo } = req.body;
    if (!name || !phone || !category || !location || !description)
        return res.status(400).json({ error: 'All fields are required' });
    if (!/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Phone must be 10 digits' });
    if (description.trim().length < 10) return res.status(400).json({ error: 'Description too short' });
    try {
        const [result] = await pool.query(
            'INSERT INTO issues (user_name, name, phone, category, location, description, photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.name, name.trim(), phone, category, location.trim(), description.trim(), photo || null]);
        res.json({ id: result.insertId, message: 'Issue reported' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/issues/:id', auth, async (req, res) => {
    const { status, solution, rating, priority, solution_viewed, resolved_viewed } = req.body;
    const updates = [], params = [];
    if (status)           { updates.push('status = ?');           params.push(status); }
    if (solution !== undefined) { updates.push('solution = ?');   params.push(solution); }
    if (rating)           { updates.push('rating = ?');           params.push(rating); }
    if (priority)         { updates.push('priority = ?');         params.push(priority); }
    if (solution_viewed !== undefined) { updates.push('solution_viewed = ?'); params.push(solution_viewed ? 1 : 0); }
    if (resolved_viewed !== undefined) { updates.push('resolved_viewed = ?'); params.push(resolved_viewed ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.params.id);
    try {
        await pool.query(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'Issue updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/issues/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM issues WHERE id = ?', [req.params.id]);
        res.json({ message: 'Issue deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TOURIST PLACES ────────────────────────────────
app.get('/api/places', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tourist_places ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/places', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, image, description, address, icon } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO tourist_places (name, image, description, address, icon) VALUES (?, ?, ?, ?, ?)',
            [name, image, description, address, icon || '🏛️']);
        res.json({ id: result.insertId, message: 'Place added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/places/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, image, description, address, icon } = req.body;
    try {
        await pool.query('UPDATE tourist_places SET name=?, image=?, description=?, address=?, icon=? WHERE id=?',
            [name, image, description, address, icon || '🏛️', req.params.id]);
        res.json({ message: 'Place updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/places/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await pool.query('DELETE FROM tourist_places WHERE id = ?', [req.params.id]);
        res.json({ message: 'Place deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── EMERGENCY NUMBERS ─────────────────────────────
app.get('/api/emergency', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM emergency_numbers');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/emergency', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { service, number, address, map_link } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO emergency_numbers (service, number, address, map_link) VALUES (?, ?, ?, ?)',
            [service, number, address || null, map_link || null]);
        res.json({ id: result.insertId, message: 'Emergency number added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/emergency/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { service, number, address, map_link } = req.body;
    try {
        await pool.query('UPDATE emergency_numbers SET service=?, number=?, address=?, map_link=? WHERE id=?',
            [service, number, address || null, map_link || null, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/emergency/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await pool.query('DELETE FROM emergency_numbers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── BUSES ─────────────────────────────────────────
app.get('/api/buses', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM buses');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/buses', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { number, route, time } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO buses (number, route, time) VALUES (?, ?, ?)', [number, route, time]);
        res.json({ id: result.insertId, message: 'Bus added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/buses/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { number, route, time } = req.body;
    try {
        await pool.query('UPDATE buses SET number=?, route=?, time=? WHERE id=?', [number, route, time, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/buses/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await pool.query('DELETE FROM buses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALERTS ────────────────────────────────────────
app.get('/api/alerts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM alerts ORDER BY time DESC LIMIT 10');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/alerts', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { type, message } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO alerts (type, message, time) VALUES (?, ?, ?)',
            [type, message, Date.now()]);
        res.json({ id: result.insertId, message: 'Alert added' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/alerts/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { type, message } = req.body;
    try {
        await pool.query('UPDATE alerts SET type=?, message=? WHERE id=?', [type, message, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/alerts/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await pool.query('DELETE FROM alerts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USERS (Admin) ─────────────────────────────────
app.get('/api/users', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [rows] = await pool.query('SELECT id, name, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:name', auth, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.name !== req.params.name)
        return res.status(403).json({ error: 'Forbidden' });
    const { phone, password, avatar_img } = req.body;
    const updates = [], params = [];
    if (phone)       { updates.push('phone = ?');      params.push(phone); }
    if (password)    { updates.push('password = ?');   params.push(await bcrypt.hash(password, 10)); }
    if (avatar_img)  { updates.push('avatar_img = ?'); params.push(avatar_img); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.params.name);
    try {
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE name = ?`, params);
        res.json({ message: 'User updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:name', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        await pool.query('DELETE FROM users WHERE name = ?', [req.params.name]);
        res.json({ message: 'User deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start server first, then init DB
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

initDB().then(() => {
    console.log('✅ Database initialized');
}).catch(err => {
    console.error('❌ DB init failed:', err.message);
    console.error('Check MySQL env variables: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE');
});
