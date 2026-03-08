const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getTargets() {
    const database = await getDb();
    const row = await database.get('SELECT * FROM nutrition_targets WHERE id = 1');
    return row || { calories_target: 1500, calories_warning: 1700, protein_target: 120, protein_partial: 90 };
}

async function updateTargets(targets) {
    const database = await getDb();
    await database.run(
        `INSERT INTO nutrition_targets (id, calories_target, calories_warning, protein_target, protein_partial, updated_at)
         VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
         calories_target = excluded.calories_target,
         calories_warning = excluded.calories_warning,
         protein_target = excluded.protein_target,
         protein_partial = excluded.protein_partial,
         updated_at = excluded.updated_at`,
        [targets.calories_target, targets.calories_warning, targets.protein_target, targets.protein_partial]
    );
    return getTargets();
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
    let stats = { calories: 0, protein: 0, fiber: 0, isToday: (dateToFetch === today), date: dateToFetch };
    
    if (rows.length > 0) {
        rows.forEach(r => {
            stats.calories += r.calories || 0;
            stats.protein += r.protein || 0;
            stats.fiber += r.fiber || 0;
        });
    } else if (!requestedDate) {
        const latest = await database.get('SELECT date FROM nutrition_log WHERE date < ? ORDER BY date DESC LIMIT 1', [today]);
        if (latest) {
            rows = await database.all('SELECT * FROM nutrition_log WHERE date = ?', [latest.date]);
            rows.forEach(r => {
                stats.calories += r.calories || 0;
                stats.protein += r.protein || 0;
                stats.fiber += r.fiber || 0;
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
    const targets = await getTargets();
    const habitService = require('./habitService');
    const { habitMapping } = habitService;
    
    const nRows = await database.all(`SELECT date, SUM(calories) as calories, SUM(protein) as protein FROM nutrition_log GROUP BY date`);
    const hRows = await database.all(`SELECT date, habit, notes FROM habits_log`);

    const dailyStats = new Map();
    nRows.forEach(r => dailyStats.set(r.date, { calories: r.calories, protein: r.protein, habits: new Set(), workoutNote: null }));
    hRows.forEach(r => {
        if (!dailyStats.has(r.date)) dailyStats.set(r.date, { calories: 0, protein: 0, habits: new Set(), workoutNote: null });
        const normalized = habitMapping[r.habit] || r.habit;
        dailyStats.get(r.date).habits.add(normalized);
        if (normalized === 'workout') {
            dailyStats.get(r.date).workoutNote = r.notes;
        }
    });

    // Calculate streaks across all history day-by-day
    const allDates = Array.from(dailyStats.keys()).sort();
    const history = new Map();
    if (allDates.length > 0) {
        const runningStreaks = { workout: 0, yoga: 0, digitalSunset: 0, socialInteraction: 0, medication: 0, calories: 0, protein: 0 };
        const gaps = { workout: 0, yoga: 0, digitalSunset: 0, socialInteraction: 0, medication: 0, calories: 0, protein: 0 };
        
        const firstDate = new Date(allDates[0] + 'T12:00:00');
        const localNow = new Date();
        const todayStr = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const lastDate = new Date(todayStr + 'T12:00:00');

        for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
            const dStr = d.toISOString().split('T')[0];
            const stats = dailyStats.get(dStr) || { calories: 0, protein: 0, habits: new Set(), workoutNote: null };
            
            const isWorkout = stats.habits.has('workout');
            const currentCalorieTarget = isWorkout ? targets.calories_warning : targets.calories_target;
            
            const results = {
                workout: isWorkout,
                yoga: stats.habits.has('yoga'),
                digitalSunset: stats.habits.has('digitalSunset'),
                socialInteraction: stats.habits.has('socialInteraction'),
                medication: stats.habits.has('medication'),
                calories: (stats.calories > 0 && stats.calories <= currentCalorieTarget) ? 1 : (stats.calories > currentCalorieTarget && stats.calories <= targets.calories_warning ? 0.5 : 0),
                protein: (stats.protein >= targets.protein_target) ? 1 : (stats.protein > targets.protein_partial ? 0.5 : 0),
                workoutNote: stats.workoutNote
            };

            const dailyResults = { workoutNote: results.workoutNote };
            Object.keys(results).forEach(k => {
                if (k === 'workoutNote') return;
                
                if (results[k] === true || results[k] === 1) {
                    runningStreaks[k]++;
                    gaps[k] = 0;
                    dailyResults[k] = runningStreaks[k];
                } else {
                    // Miss (or partial)
                    gaps[k]++;
                    if (gaps[k] === 1 && runningStreaks[k] > 0) {
                        // First miss after a streak -> Safety Day
                        // Encode as negative streak count to preserve color but flag safety
                        dailyResults[k] = -runningStreaks[k]; 
                    } else {
                        // Second miss or no streak -> Fail
                        dailyResults[k] = results[k]; // 0 or 0.5
                        
                        // Only kill the previous shield if we are PAST today 
                        // or if it's the second miss and we're not on today's processing yet
                        if (gaps[k] === 2 && dStr !== todayStr) {
                            // Retroactive kill: The previous day was marked Safety (negative), but streak is now broken.
                            // Convert the Shield to a Fail
                            const prevDate = new Date(d);
                            prevDate.setDate(prevDate.getDate() - 1);
                            const prevDStr = prevDate.toISOString().split('T')[0];
                            const prevEntry = history.get(prevDStr);
                            if (prevEntry && prevEntry[k] < 0) {
                                prevEntry[k] = 0; 
                            }
                            runningStreaks[k] = 0;
                        } else if (gaps[k] > 2) {
                            runningStreaks[k] = 0;
                        }
                    }
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
            yoga: h.yoga || 0,
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
    const targets = await getTargets();
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

    if (hasRecentData) {
        for (let i = 0; i < rows.length; i++) {
            if (i > 0 && !isDateConsecutive(rows[i-1].date, rows[i].date)) break;
            foodLogStreak++;
        }
    }

    // Use heatmap data for accurate, safety-day-aware streaks
    const heatmap = await getHeatmapData(today);
    const todayData = heatmap.find(d => d.date === today);
    const yesterdayData = heatmap.find(d => d.date === yesterday);

    let calorieStreak = 0;
    let proteinStreak = 0;

    if (todayData && todayData.streaks) {
        calorieStreak = Math.abs(todayData.streaks.calories || 0);
        proteinStreak = Math.abs(todayData.streaks.protein || 0);
        
        // If today is an active "miss" (0) but hasn't been logged yet, fall back to yesterday's streak
        if (calorieStreak === 0 && yesterdayData && yesterdayData.streaks) {
            calorieStreak = Math.abs(yesterdayData.streaks.calories || 0);
        }
        if (proteinStreak === 0 && yesterdayData && yesterdayData.streaks) {
            proteinStreak = Math.abs(yesterdayData.streaks.protein || 0);
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
    
    // Award 10 VIT XP for nutrition logging
    await attributeService.addXP('VIT', 10);
    
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
    await attributeService.addXP('VIT', 10);
    return true;
}

async function getSleepHistory(limit = 30) {
    const database = await getDb();
    return await database.all('SELECT * FROM sleep_log ORDER BY date DESC LIMIT ?', [limit]);
}

async function updateSleep(hours, quality, notes = '') {
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const database = await getDb();
    
    const existing = await database.get('SELECT id FROM sleep_log WHERE date = ?', [today]);
    if (existing) {
        await database.run(
            'UPDATE sleep_log SET hours = ?, quality = ?, notes = ? WHERE id = ?',
            [hours, quality, notes, existing.id]
        );
    } else {
        await database.run(
            'INSERT INTO sleep_log (date, hours, quality, notes) VALUES (?, ?, ?, ?)',
            [today, hours, quality, notes]
        );
    }
    await attributeService.addXP('WEL', 10);
    return true;
}

module.exports = {
    getHealthData,
    getDailyStats,
    getHeatmapData,
    getStreaks,
    updateDailyStats,
    getMealsForDate,
    updateHealthStats,
    getSleepHistory,
    updateSleep,
    getTargets,
    updateTargets
};
