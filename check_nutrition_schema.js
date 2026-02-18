const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function check() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const nutritionCols = await db.all("PRAGMA table_info(nutrition_log)");
    console.log('Nutrition Log Columns:', nutritionCols);
    await db.close();
}

check().catch(console.error);
