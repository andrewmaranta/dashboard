const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Manual Savoring Logs Migration...');

    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS manual_savoring_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        `);
        console.log('Created manual_savoring_logs table.');
    } catch (e) {
        console.log('Error creating table:', e.message);
    }

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);