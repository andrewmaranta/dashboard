const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function check() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const cols = await db.all("PRAGMA table_info(tasks)");
    console.log('Tasks Columns:', cols);
    
    const attrs = await db.all("PRAGMA table_info(attributes)");
    console.log('Attributes Columns:', attrs);
    
    const tasks = await db.all("SELECT * FROM tasks");
    console.log('Tasks Data:', tasks);
}

check().catch(console.error);
