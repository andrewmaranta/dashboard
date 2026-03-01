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

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- API ROUTES ---
const healthRoutes = require('./src/routes/health');
const questRoutes = require('./src/routes/quests');
const financeRoutes = require('./src/routes/finance');
const habitRoutes = require('./src/routes/habits');
const focusRoutes = require('./src/routes/focus');
const taskRoutes = require('./src/routes/tasks');
const bloodPressureRoutes = require('./src/routes/bloodPressure');
const explorerRoutes = require('./src/routes/explorer');
const insightRoutes = require('./src/routes/insights');
const blueprintRoutes = require('./src/routes/blueprint');
const beliefRoutes = require('./src/routes/beliefs');
const protocolRoutes = require('./src/routes/protocols');
const savoringRoutes = require('./src/routes/savoring');

app.use('/api', healthRoutes);
app.use('/api', questRoutes);
app.use('/api', financeRoutes);
app.use('/api', habitRoutes);
app.use('/api', focusRoutes);
app.use('/api', taskRoutes);
app.use('/api', bloodPressureRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/blueprint', blueprintRoutes);
app.use('/api', beliefRoutes);
app.use('/api', protocolRoutes);
app.use('/api', savoringRoutes);

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'client/dist')));

// --- SPA CATCH-ALL (Middleware style to avoid wildcard errors) ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// --- START SERVER ---
const focusService = require('./src/services/focusService');
focusService.initDb().then(() => {
    server.listen(PORT, () => {
        console.log(`Life RPG Dashboard running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize DB and start server:", err);
    process.exit(1);
});

io.on('connection', (socket) => {
    console.log('Dashboard client connected');
    socket.on('disconnect', () => console.log('Dashboard client disconnected'));
});
