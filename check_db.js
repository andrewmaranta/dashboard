const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function check() {
    const db = await open({
        filename: path.join(__dirname, 'data/life.db'),
        driver: sqlite3.Database
    });
    const nutrition = await db.get('SELECT COUNT(*) as count FROM nutrition_log');
    const habits = await db.get('SELECT COUNT(*) as count FROM habits_log');
    const weight = await db.get('SELECT COUNT(*) as count FROM weight_history');
    const focus = await db.get('SELECT COUNT(*) as count FROM focus_sessions');
    console.log({ nutrition, habits, weight, focus });
    await db.close();
}
check();
