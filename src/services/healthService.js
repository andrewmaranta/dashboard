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
    // Use local timezone (PST) instead of UTC
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
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

async function getHeatmapData(requestedDate) {
    const database = await getDb();
    const habitService = require('./habitService');
    const { habitMapping } = habitService;
    
    const nRows = await database.all(`SELECT date, SUM(calories) as calories, SUM(protein) as protein FROM nutrition_log GROUP BY date`);
    const hRows = await database.all(`SELECT date, habit FROM habits_log`);

    const dailyStats = new Map();
    nRows.forEach(r => dailyStats.set(r.date, { calories: r.calories, protein: r.protein, habits: new Set() }));
    hRows.forEach(r => {
        if (!dailyStats.has(r.date)) dailyStats.set(r.date, { calories: 0, protein: 0, habits: new Set() });
        const normalized = habitMapping[r.habit] || r.habit;
        dailyStats.get(r.date).habits.add(normalized);
    });

    // Calculate streaks across all history day-by-day
    const allDates = Array.from(dailyStats.keys()).sort();
    const history = new Map();
    if (allDates.length > 0) {
        const runningStreaks = { workout: 0, read20Min: 0, digitalSunset: 0, socialInteraction: 0, medication: 0, calories: 0, protein: 0 };
        const firstDate = new Date(allDates[0] + 'T12:00:00');
        const localNow = new Date();
        const todayStr = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const lastDate = new Date(todayStr + 'T12:00:00');

        for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
            const dStr = d.toISOString().split('T')[0];
            const stats = dailyStats.get(dStr) || { calories: 0, protein: 0, habits: new Set() };
            
            const results = {
                workout: stats.habits.has('workout'),
                read20Min: stats.habits.has('read20Min'),
                digitalSunset: stats.habits.has('digitalSunset'),
                socialInteraction: stats.habits.has('socialInteraction'),
                medication: stats.habits.has('medication'),
                calories: (stats.calories > 0 && stats.calories <= 1800) ? 1 : (stats.calories > 1800 && stats.calories <= 2000 ? 0.5 : 0),
                protein: (stats.protein >= 150) ? 1 : (stats.protein > 100 ? 0.5 : 0)
            };

            const dailyResults = {};
            Object.keys(results).forEach(k => {
                if (results[k] === true || results[k] === 1) {
                    runningStreaks[k]++;
                    dailyResults[k] = runningStreaks[k];
                } else {
                    runningStreaks[k] = 0;
                    dailyResults[k] = results[k]; // 0 or 0.5
                }
            });
            history.set(dStr, dailyResults);
        }
    }

    const localNow = new Date();
    const todayStr = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const targetDateStr = requestedDate || todayStr;
    const targetDate = new Date(targetDateStr + 'T12:00:00');
    
    const dayOfWeek = targetDate.getDay();
    const sun = new Date(targetDate);
    sun.setDate(targetDate.getDate() - dayOfWeek);
    
    const result = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(sun);
        date.setDate(sun.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const h = history.get(dateStr) || {};

        result.push({
            date: dateStr,
            workout: h.workout || 0,
            reading: h.read20Min || 0,
            digitalSunset: h.digitalSunset || 0,
            social: h.socialInteraction || 0,
            medication: h.medication || 0,
            calories: h.calories || 0,
            protein: h.protein || 0,
            streaks: h // Include raw streak counts for tooltip
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
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const yesterdayDate = new Date(localNow.getTime() - 86400000);
    const yesterday = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
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
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const database = await getDb();
    await database.run('DELETE FROM nutrition_log WHERE date = ? AND item = ?', [today, 'Dashboard-Summary']);
    await database.run(
        `INSERT INTO nutrition_log (date, item, calories, protein) 
         VALUES (?, ?, ?, ?)`,
        [today, 'Dashboard-Summary', stats.calories||0, stats.protein||0]
    );
    return true;
}

async function updateHealthStats(weight, bodyFat) {
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const database = await getDb();
    
    // Check if entry exists for today
    const existing = await database.get('SELECT id FROM weight_history WHERE date = ?', [today]);
    
    if (existing) {
        await database.run(
            'UPDATE weight_history SET weight = ?, body_fat = ? WHERE id = ?',
            [weight, bodyFat, existing.id]
        );
    } else {
        await database.run(
            'INSERT INTO weight_history (date, weight, body_fat) VALUES (?, ?, ?)',
            [today, weight, bodyFat]
        );
    }
    return true;
}

module.exports = {
    getHealthData,
    getDailyStats,
    getHeatmapData,
    getStreaks,
    updateDailyStats,
    getMealsForDate,
    updateHealthStats
};
