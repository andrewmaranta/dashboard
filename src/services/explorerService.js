const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const TRANSACTIONS_DIR = path.join(path.dirname(DB_PATH), 'transactions');

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
    
    // Filter out internal or irrelevant tables
    const ignoredTables = ['pomo_state', 'pomo_settings', 'interoceptive_logs', 'sqlite_sequence'];
    const tables = rows.map(r => r.name).filter(name => !ignoredTables.includes(name));
    
    tables.push('Transactions (CSV)');
    return tables;
}

async function getTableData(tableName) {
    if (tableName === 'Transactions (CSV)') {
        if (!fs.existsSync(TRANSACTIONS_DIR)) return [];
        const files = fs.readdirSync(TRANSACTIONS_DIR)
            .filter(f => f.endsWith('.csv'))
            .map(f => ({ name: f, time: fs.statSync(path.join(TRANSACTIONS_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);
        
        if (files.length === 0) return [];
        
        const content = fs.readFileSync(path.join(TRANSACTIONS_DIR, files[0].name), 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(r => r.trim().replace(/"/g, ''));
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = row[idx];
            });
            data.push(obj);
        }
        return data;
    }

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
