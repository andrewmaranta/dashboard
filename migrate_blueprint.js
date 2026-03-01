const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running blueprint migrations...');

    // 1. Add if_then to tasks
    try {
        await db.run('ALTER TABLE tasks ADD COLUMN if_then TEXT');
        console.log('Added if_then column to tasks.');
    } catch (e) {
        console.log('if_then column already exists or error:', e.message);
    }

    // 2. Create attribute_state_logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS attribute_state_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attribute_code TEXT NOT NULL,
            value INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            context TEXT
        )
    `);
    console.log('Created attribute_state_logs table.');

    // 3. Create interoceptive_logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS interoceptive_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feeling TEXT,
            intensity INTEGER,
            timestamp TEXT NOT NULL,
            vagal_zone TEXT
        )
    `);
    console.log('Created interoceptive_logs table.');

    await db.close();
    console.log('Blueprint migrations complete.');
}

migrate().catch(console.error);
