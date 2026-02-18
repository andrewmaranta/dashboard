const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function check() {
    const db = await open({
        filename: path.join(__dirname, 'data/life.db'),
        driver: sqlite3.Database
    });
    const nutrition = await db.all('SELECT date, item, calories FROM nutrition_log');
    console.log('Nutrition Entries:', JSON.stringify(nutrition, null, 2));
    await db.close();
}
check();
