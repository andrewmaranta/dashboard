const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function checkStreaks() {
    const db = await open({
        filename: path.join(__dirname, 'data/life.db'),
        driver: sqlite3.Database
    });
    const rows = await db.all('SELECT date, habit FROM habits_log ORDER BY date DESC LIMIT 200');
    console.log(JSON.stringify(rows));
    await db.close();
}
checkStreaks();
