const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function logInteroception(feeling, intensity, vagalZone, context = null) {
    const database = await getDb();
    const now = new Date().toISOString();
    return await database.run(
        'INSERT INTO interoceptive_logs (feeling, intensity, vagal_zone, timestamp) VALUES (?, ?, ?, ?)',
        [feeling, intensity, vagalZone, now]
    );
}

async function getInteroceptiveLogs(limit = 100) {
    const database = await getDb();
    return await database.all(
        'SELECT * FROM interoceptive_logs ORDER BY timestamp DESC LIMIT ?',
        [limit]
    );
}

module.exports = {
    logInteroception,
    getInteroceptiveLogs
};
