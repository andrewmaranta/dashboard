const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function addMeal() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    await db.run(
        `INSERT INTO nutrition_log (date, item, calories, protein, carbs, fat, fiber) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['2026-02-17', 'Bacon (3 strips) + Hamburger + Ketchup/Mustard', 650, 40, 35, 45, 0]
    );

    console.log('✅ Meal logged to SQLite database');
    
    // Verify
    const meals = await db.all('SELECT * FROM nutrition_log WHERE date = ?', ['2026-02-17']);
    console.log(`Today's meals: ${meals.length}`);
    console.log(meals);
    
    await db.close();
}

addMeal().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
