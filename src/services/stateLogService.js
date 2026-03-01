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

async function logState(attributeCode, value, context = null, location = null, socialContext = null) {
    const database = await getDb();
    const now = new Date().toISOString();
    return await database.run(
        'INSERT INTO attribute_state_logs (attribute_code, value, timestamp, context, location, social_context) VALUES (?, ?, ?, ?, ?, ?)',
        [attributeCode, value, now, context, location, socialContext]
    );
}

async function getStateLogs(attributeCode = null, startDate = null) {
    const database = await getDb();
    let query = 'SELECT * FROM attribute_state_logs';
    let params = [];
    let conditions = [];

    if (attributeCode) {
        conditions.push('attribute_code = ?');
        params.push(attributeCode);
    }

    if (startDate) {
        conditions.push('timestamp >= ?');
        params.push(startDate);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC LIMIT 2000';

    return await database.all(query, params);
}

module.exports = {
    logState,
    getStateLogs
};
