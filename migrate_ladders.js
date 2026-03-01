const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Phase 2.3 migration (Task Ladders)...');

    try {
        await db.run('ALTER TABLE tasks ADD COLUMN steps TEXT'); // JSON array of {text, completed, distress}
        console.log('Added steps column to tasks.');
    } catch (e) {
        console.log('steps column already exists or error:', e.message);
    }

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);
