const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function check() {
    const db = await open({
        filename: path.join(__dirname, 'data/life.db'),
        driver: sqlite3.Database
    });
    const habits = await db.all('SELECT * FROM habits_log');
    console.log('Habit Entries:', JSON.stringify(habits, null, 2));
    await db.close();
}
check();
