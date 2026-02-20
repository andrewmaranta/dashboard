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

async function getTables() {
    const database = await getDb();
    const rows = await database.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    return rows.map(r => r.name);
}

async function getTableData(tableName) {
    const database = await getDb();
    // Validate table name against whitelist to prevent SQL injection
    const tables = await getTables();
    if (!tables.includes(tableName)) {
        throw new Error('Invalid table name');
    }
    return await database.all(`SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 500`);
}

module.exports = {
    getTables,
    getTableData
};
