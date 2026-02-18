const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function run() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.run("UPDATE tasks SET attribute = 'PWR' WHERE id = 1");
    const tasks = await db.all("SELECT * FROM tasks");
    console.log('Tasks Data:', tasks);
}

run().catch(console.error);
