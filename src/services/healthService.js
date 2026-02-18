const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getHealthData() {
    const database = await getDb();
    return await database.all('SELECT date, weight, body_fat as bodyFat FROM weight_history ORDER BY date ASC');
}

async function getDailyStats(requestedDate) {
    const today = new Date().toISOString().split('T')[0];
    const dateToFetch = requestedDate || today;
    const database = await getDb();
    let rows = await database.all('SELECT * FROM nutrition_log WHERE date = ?', [dateToFetch]);
    let stats = { calories: 0, protein: 0, isToday: (dateToFetch === today), date: dateToFetch };
    
    if (rows.length > 0) {
        rows.forEach(r => {
            stats.calories += r.calories || 0;
            stats.protein += r.protein || 0;
        });
    } else if (!requestedDate) {
        const latest = await database.get('SELECT date FROM nutrition_log WHERE date < ? ORDER BY date DESC LIMIT 1', [today]);
        if (latest) {
            rows = await database.all('SELECT * FROM nutrition_log WHERE date = ?', [latest.date]);
            rows.forEach(r => {
                stats.calories += r.calories || 0;
                stats.protein += r.protein || 0;
            });
            stats.date = latest.date;
        }
    }
    return stats;
}

async function getMealsForDate(date) {
    const database = await getDb();
    return await database.all('SELECT * FROM nutrition_log WHERE date = ? AND item != ? ORDER BY id ASC', [date, 'Dashboard-Summary']);
}

async function getHeatmapData() {
    const database = await getDb();
    
    // Get Nutrition data
    const nRows = await database.all(`
        SELECT date, SUM(calories) as calories, SUM(protein) as protein, COUNT(*) as foodEntries 
        FROM nutrition_log 
        GROUP BY date
    `);
    
    // Get Habits data
    const hRows = await database.all(`
        SELECT date, habit FROM habits_log
    `);

    const dailyStats = new Map();
    nRows.forEach(r => dailyStats.set(r.date, { ...r, habits: new Set() }));
    
    hRows.forEach(r => {
        if (!dailyStats.has(r.date)) {
            dailyStats.set(r.date, { calories: 0, protein: 0, foodEntries: 0, habits: new Set() });
        }
        dailyStats.get(r.date).habits.add(r.habit);
    });

    const today = new Date();
    const result = [];
    for (let i = 0; i < 7; i++) { // Focus on this week (last 7 days)
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const stats = dailyStats.get(dateStr) || { calories: 0, protein: 0, foodEntries: 0, habits: new Set() };

        result.unshift({
            date: dateStr,
            workout: stats.habits.has('Workout') ? 100 : 0,
            reading: (stats.habits.has('Read20Min') || stats.habits.has("The Reader's Vow")) ? 100 : 0,
            nutrition: (stats.calories > 0 && stats.calories <= 1800 && stats.protein >= 150) ? 100 : 0,
            logging: stats.foodEntries > 0 ? 100 : 0
        });
    }
    return result;
}

async function getStreaks() {
    const database = await getDb();
    const rows = await database.all(`
        SELECT date, SUM(calories) as calories, SUM(protein) as protein 
        FROM nutrition_log 
        GROUP BY date 
        ORDER BY date DESC
    `);

    const { isDateConsecutive } = require('../utils/dateUtils');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const hasRecentData = rows.length > 0 && (rows[0].date === today || rows[0].date === yesterday);

    let foodLogStreak = 0;
    let calorieStreak = 0;
    let proteinStreak = 0;

    if (hasRecentData) {
        for (let i = 0; i < rows.length; i++) {
            if (i > 0 && !isDateConsecutive(rows[i-1].date, rows[i].date)) break;
            foodLogStreak++;
            if (rows[i].calories <= 1800 && rows[i].calories > 0) calorieStreak++;
            if (rows[i].protein >= 150) proteinStreak++;
        }
    }

    return { foodLogStreak, calorieStreak, proteinStreak };
}

async function updateDailyStats(stats) {
    const today = new Date().toISOString().split('T')[0];
    const database = await getDb();
    await database.run('DELETE FROM nutrition_log WHERE date = ? AND item = ?', [today, 'Dashboard-Summary']);
    await database.run(
        `INSERT INTO nutrition_log (date, item, calories, protein) 
         VALUES (?, ?, ?, ?)`,
        [today, 'Dashboard-Summary', stats.calories||0, stats.protein||0]
    );
    return true;
}

module.exports = {
    getHealthData,
    getDailyStats,
    getHeatmapData,
    getStreaks,
    updateDailyStats,
    getMealsForDate
};
