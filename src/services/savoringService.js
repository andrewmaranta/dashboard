const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const habitService = require('./habitService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getSavoringData() {
    const database = await getDb();
    
    // 1. Get recent hard/epic completed tasks (Enactive Mastery)
    const completedTasks = await database.all(`
        SELECT id, text, attribute, difficulty, completed_at
        FROM tasks 
        WHERE completed = 1 AND difficulty IN ('hard', 'epic', 'medium') 
        ORDER BY completed_at DESC 
        LIMIT 5
    `);

    // 2. Get current top streaks from habits
    const allStreaks = await habitService.getHabitStreaks();
    const topStreaks = allStreaks
        .filter(s => s.streak >= 3)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5)
        .map(s => ({
            name: s.name,
            streak: s.streak,
            category: 'Habit',
            attribute: '' // UI mostly relies on category and name
        }));

    // 3. Get OpenClaw AI Pattern Recognition Insights
    const aiInsights = await database.all(`
        SELECT * FROM savoring_insights
        ORDER BY created_at DESC
        LIMIT 5
    `);

    // 4. Get Manual Gratitude Logs (Three Good Things)
    const gratitudeLogs = await database.all(`
        SELECT * FROM manual_savoring_logs
        ORDER BY created_at DESC
        LIMIT 10
    `);

    // 5. Get recent high-mood/energy states
    const highMoodStates = await database.all(`
        SELECT * FROM attribute_state_logs
        WHERE attribute_code = 'WEL' AND value >= 7
        ORDER BY timestamp DESC
        LIMIT 5
    `);

    return {
        completedTasks,
        topStreaks,
        aiInsights,
        gratitudeLogs,
        highMoodStates
    };
}

module.exports = {
    getSavoringData
};