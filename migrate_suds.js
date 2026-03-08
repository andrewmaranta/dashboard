const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running SUDS Migration...');

    try {
        await db.run('ALTER TABLE tasks ADD COLUMN suds_before INTEGER');
        console.log('Added suds_before column to tasks.');
    } catch (e) {
        console.log('suds_before column already exists or error:', e.message);
    }

    try {
        await db.run('ALTER TABLE tasks ADD COLUMN suds_after INTEGER');
        console.log('Added suds_after column to tasks.');
    } catch (e) {
        console.log('suds_after column already exists or error:', e.message);
    }

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);