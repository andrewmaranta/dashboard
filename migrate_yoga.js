const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function migrate() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    
    console.log('Migrating Read20Min to Yoga...');
    
    // Update main variations
    const result = await db.run(`
        UPDATE habits_log 
        SET habit = 'yoga' 
        WHERE habit IN ('read20Min', 'Read20Min', "The Reader's Vow")
    `);
    
    console.log(`Updated ${result.changes} rows.`);
    
    // Verify
    const rows = await db.all("SELECT DISTINCT habit FROM habits_log");
    console.log('Current habits:', rows.map(r => r.habit));
}

migrate().catch(console.error);
