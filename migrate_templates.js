const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function migrate() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    
    console.log('Creating task_templates table...');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS task_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            attribute TEXT,
            difficulty TEXT DEFAULT 'medium',
            if_then TEXT,
            belief_id INTEGER,
            steps TEXT,
            created_at TEXT NOT NULL
        )
    `);
    
    console.log('Migration complete.');
}

migrate().catch(console.error);
