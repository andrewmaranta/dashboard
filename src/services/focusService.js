const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');
const { exec } = require('child_process');
const fs = require('fs');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

const notifyOpenClaw = (type) => {
    let message = type === 'work' 
        ? '🍅 Pomodoro complete! Time for a break ☕️'
        : '⏳ Break finished! Ready for another focus session?';
    
    // Prepend [webclient] to identify the source
    message = `[webclient] ${message}`;
    
    // Using absolute path for better reliability
    const command = `/home/maranta/.npm-global/bin/openclaw message send --channel telegram --target 8132488660 --message "${message}"`;
    
    fs.appendFileSync('/tmp/focus_debug.log', `[${new Date().toISOString()}] Notifying for type: ${type}\n`);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            fs.appendFileSync('/tmp/focus_debug.log', `[${new Date().toISOString()}] Error: ${error.message}\n`);
            return;
        }
        if (stderr) {
            fs.appendFileSync('/tmp/focus_debug.log', `[${new Date().toISOString()}] Stderr: ${stderr}\n`);
        }
        if (stdout) {
            fs.appendFileSync('/tmp/focus_debug.log', `[${new Date().toISOString()}] Stdout: ${stdout.trim()}\n`);
        }
    });
};

async function initDb() {
    const database = await getDb();
    
    await database.exec(`
        CREATE TABLE IF NOT EXISTS pomo_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            timeLeft INTEGER,
            isRunning INTEGER,
            mode TEXT,
            breaksEarned INTEGER,
            lastTick TEXT
        );

        CREATE TABLE IF NOT EXISTS pomo_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            workDuration INTEGER,
            breakDuration INTEGER
        );
    `);

    // Initialize defaults if not present
    const state = await database.get('SELECT * FROM pomo_state WHERE id = 1');
    if (!state) {
        await database.run(
            'INSERT INTO pomo_state (id, timeLeft, isRunning, mode, breaksEarned) VALUES (1, 1500, 0, "work", 0)'
        );
    }

    const settings = await database.get('SELECT * FROM pomo_settings WHERE id = 1');
    if (!settings) {
        await database.run(
            'INSERT INTO pomo_settings (id, workDuration, breakDuration) VALUES (1, 1500, 300)'
        );
    }

    return database;
}

async function logSession(timestamp, type, duration, io = null) {
    const database = await getDb();
    await database.run(
        'INSERT INTO focus_sessions (timestamp, type, duration) VALUES (?, ?, ?)',
        [timestamp, type, duration]
    );
    
    notifyOpenClaw(type);
    
    if (type === 'work') {
        // 15 XP per session (approx 45m), or scaled? Let's do flat 15 for now as requested.
        await attributeService.addXP('KNW', 15, io);
    }

    if (io) {
        io.emit('focusSessionComplete', { type, duration });
    }
}

async function getHistory(start, end) {
    const database = await getDb();
    return await database.all(
        'SELECT timestamp, type, duration FROM focus_sessions WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [start, end]
    );
}

async function getPomoState() {
    const database = await getDb();
    const state = await database.get('SELECT * FROM pomo_state WHERE id = 1');
    const settings = await database.get('SELECT * FROM pomo_settings WHERE id = 1');
    return { ...state, ...settings };
}

async function updatePomoState(data) {
    const database = await getDb();
    const fields = [];
    const values = [];
    
    // Whitelist allowed fields to prevent arbitrary updates
    const allowedState = ['timeLeft', 'isRunning', 'mode', 'breaksEarned', 'lastTick'];
    const allowedSettings = ['workDuration', 'breakDuration'];

    const stateUpdates = [];
    const stateValues = [];
    for (const key of allowedState) {
        if (data[key] !== undefined) {
            stateUpdates.push(`${key} = ?`);
            stateValues.push(key === 'isRunning' ? (data[key] ? 1 : 0) : data[key]);
        }
    }

    const settingsUpdates = [];
    const settingsValues = [];
    for (const key of allowedSettings) {
        if (data[key] !== undefined) {
            settingsUpdates.push(`${key} = ?`);
            settingsValues.push(data[key]);
        }
    }

    if (stateUpdates.length > 0) {
        await database.run(
            `UPDATE pomo_state SET ${stateUpdates.join(', ')} WHERE id = 1`,
            stateValues
        );
    }

    if (settingsUpdates.length > 0) {
        await database.run(
            `UPDATE pomo_settings SET ${settingsUpdates.join(', ')} WHERE id = 1`,
            settingsValues
        );
    }
}

module.exports = {
    initDb,
    logSession,
    getHistory,
    getPomoState,
    updatePomoState
};
