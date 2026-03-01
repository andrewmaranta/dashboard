const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Running Phase 2.1 migration (Belief Refinement)...');

    // Add initial_confidence
    try {
        await db.run('ALTER TABLE beliefs ADD COLUMN initial_confidence INTEGER DEFAULT 0');
        console.log('Added initial_confidence column.');
        
        // Copy current confidence to initial for existing records
        await db.run('UPDATE beliefs SET initial_confidence = confidence WHERE initial_confidence = 0');
        console.log('Migrated existing confidence values.');
    } catch (e) {
        console.log('Column likely exists:', e.message);
    }

    await db.close();
    console.log('Migration complete.');
}

migrate().catch(console.error);
