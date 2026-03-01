const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Phase 2.4 migration (Protocols)...');

    await db.exec(`
        CREATE TABLE IF NOT EXISTS protocols (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trigger TEXT NOT NULL,
            action TEXT NOT NULL,
            difficulty TEXT DEFAULT 'medium',
            attribute TEXT,
            hits INTEGER DEFAULT 0,
            misses INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            archived INTEGER DEFAULT 0
        )
    `);
    console.log('Created protocols table.');

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);
