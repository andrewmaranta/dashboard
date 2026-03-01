const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Phase 2.2 migration (Belief Evidence)...');

    // Create belief_evidence table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS belief_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            belief_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'manual', 'habit', 'metric', 'log'
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
    console.log('Created belief_evidence table.');

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);
