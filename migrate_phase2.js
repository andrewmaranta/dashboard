const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Phase 2 migrations...');

    // 1. Create beliefs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS beliefs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            attribute_code TEXT,
            confidence INTEGER DEFAULT 50,
            created_at TEXT NOT NULL,
            archived INTEGER DEFAULT 0
        )
    `);
    console.log('Created beliefs table.');

    // 2. Add belief_id to tasks
    try {
        await db.run('ALTER TABLE tasks ADD COLUMN belief_id INTEGER');
        console.log('Added belief_id column to tasks.');
    } catch (e) {
        console.log('belief_id column already exists or error:', e.message);
    }

    // 3. Add context columns to attribute_state_logs
    try {
        await db.run('ALTER TABLE attribute_state_logs ADD COLUMN location TEXT');
        console.log('Added location column to attribute_state_logs.');
    } catch (e) {
        console.log('location column already exists or error:', e.message);
    }

    try {
        await db.run('ALTER TABLE attribute_state_logs ADD COLUMN social_context TEXT');
        console.log('Added social_context column to attribute_state_logs.');
    } catch (e) {
        console.log('social_context column already exists or error:', e.message);
    }

    await db.close();
    console.log('Phase 2 migrations complete.');
}

migrate().catch(console.error);
