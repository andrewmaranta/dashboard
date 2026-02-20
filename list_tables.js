const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function check() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.map(t => t.name));
    await db.close();
}

check().catch(console.error);
