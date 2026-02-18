const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function initDb() {
    // Tables are created during migration or startup by the main database connection
    return await getDb();
}

async function logSession(timestamp, type, duration) {
    const database = await getDb();
    await database.run(
        'INSERT INTO focus_sessions (timestamp, type, duration) VALUES (?, ?, ?)',
        [timestamp, type, duration]
    );
    
    if (type === 'work') {
        // 15 XP per session (approx 45m), or scaled? Let's do flat 15 for now as requested.
        await attributeService.addXP('KNW', 15);
    }
}

async function getHistory(start, end) {
    const database = await getDb();
    return await database.all(
        'SELECT timestamp, type, duration FROM focus_sessions WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [start, end]
    );
}

module.exports = {
    initDb,
    logSession,
    getHistory
};
