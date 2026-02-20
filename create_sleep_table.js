const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function migrate() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    console.log('Creating sleep_log table...');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sleep_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            hours REAL NOT NULL,
            quality INTEGER DEFAULT 3,
            notes TEXT
        )
    `);
    console.log('Table created successfully.');
    await db.close();
}

migrate().catch(console.error);
