const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./src/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Attach io to requests for route access
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Debug Route
app.post('/api/echo', (req, res) => {
    console.error('Echo body:', req.body);
    res.json(req.body);
});

app.get('/api/debug/db', async (req, res) => {
    try {
        const { open } = require('sqlite');
        const sqlite3 = require('sqlite3');
        const { DB_PATH } = require('./src/config');
        const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
        const nutrition = await db.get('SELECT COUNT(*) as count FROM nutrition_log');
        const habits = await db.get('SELECT COUNT(*) as count FROM habits_log');
        const weight = await db.get('SELECT COUNT(*) as count FROM weight_history');
        const latestWeight = await db.get('SELECT * FROM weight_history ORDER BY date DESC LIMIT 1');
        await db.close();
        res.json({ nutrition, habits, weight, latestWeight });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Import Routes
const healthRoutes = require('./src/routes/health');
const questRoutes = require('./src/routes/quests');
const financeRoutes = require('./src/routes/finance');
const habitRoutes = require('./src/routes/habits');
const focusRoutes = require('./src/routes/focus');
const taskRoutes = require('./src/routes/tasks');
const bloodPressureRoutes = require('./src/routes/bloodPressure');

// Mount API Routes
app.use('/api', healthRoutes);
app.use('/api', questRoutes);
app.use('/api', financeRoutes);
app.use('/api', habitRoutes);
app.use('/api', focusRoutes);
app.use('/api', taskRoutes);
app.use('/api', bloodPressureRoutes);

// Socket Connection
io.on('connection', (socket) => {
    console.log('Dashboard client connected');
    socket.on('disconnect', () => console.log('Dashboard client disconnected'));
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the app after DB is ready
const focusService = require('./src/services/focusService');
focusService.initDb().then(() => {
    server.listen(PORT, () => {
        console.log(`Life RPG Dashboard running on http://localhost:${PORT}`);
    });
});
