const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { isDateConsecutive } = require('../utils/dateUtils');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

const habitMapping = {
    'Workout': 'workout',
    'Read20Min': 'read20Min',
    "The Reader's Vow": 'read20Min',
    'DigitalSunset': 'digitalSunset',
    'Off screens 10pm': 'digitalSunset',
    'SocialInteraction': 'socialInteraction',
    "Stranger's Greeting": 'socialInteraction',
    'Medication': 'medication',
    'The Vital Dose': 'medication'
};

const reverseHabitMapping = {
    'workout': 'Workout',
    'read20Min': "The Reader's Vow",
    'digitalSunset': 'Off screens 10pm',
    'socialInteraction': "Stranger's Greeting",
    'medication': 'The Vital Dose'
};

async function getTodayHabits() {
    const today = new Date().toISOString().split('T')[0];
    const database = await getDb();
    
    // Check for today
    let rows = await database.all('SELECT habit FROM habits_log WHERE date = ?', [today]);
    let resultDate = today;
    let isToday = true;

    if (rows.length === 0) {
        // Find latest date with habits
        const latest = await database.get('SELECT date FROM habits_log ORDER BY date DESC LIMIT 1');
        if (latest) {
            rows = await database.all('SELECT habit FROM habits_log WHERE date = ?', [latest.date]);
            resultDate = latest.date;
            isToday = false;
        }
    }
    
    const status = {
        workout: false,
        read20Min: false,
        digitalSunset: false,
        socialInteraction: false,
        medication: false,
        _date: resultDate,
        _isToday: isToday
    };

    rows.forEach(r => {
        const normalized = habitMapping[r.habit];
        if (normalized) status[normalized] = true;
    });
    return status;
}

async function getWeeklyHabits() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + mondayOffset);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const database = await getDb();
    const rows = await database.all('SELECT habit FROM habits_log WHERE date >= ?', [weekStartStr]);
    
    const counts = {};
    rows.forEach(r => {
        const normalized = habitMapping[r.habit];
        if (normalized) counts[normalized] = (counts[normalized] || 0) + 1;
    });
    
    return [
        { name: 'Workout', count: counts['workout'] || 0, target: 3 },
        { name: 'Read20Min', count: counts['read20Min'] || 0, target: 7 },
        { name: 'DigitalSunset', count: counts['digitalSunset'] || 0, target: 7 },
        { name: 'SocialInteraction', count: counts['socialInteraction'] || 0, target: 7 },
        { name: 'Medication', count: counts['medication'] || 0, target: 7 }
    ];
}

async function getHabitStreaks() {
    const database = await getDb();
    const rows = await database.all('SELECT date, habit FROM habits_log ORDER BY date DESC');
    
    const habitsByDate = new Map();
    rows.forEach(r => {
        const normalized = habitMapping[r.habit];
        if (!normalized) return;
        if (!habitsByDate.has(normalized)) habitsByDate.set(normalized, []);
        habitsByDate.get(normalized).push(r.date);
    });
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return Object.keys(reverseHabitMapping).map(id => {
        const dates = habitsByDate.get(id) || [];
        let streak = 0;
        if (dates.length > 0 && (dates[0] === today || dates[0] === yesterday)) {
            streak = 1;
            for (let i = 1; i < dates.length; i++) {
                if (isDateConsecutive(dates[i-1], dates[i])) streak++;
                else break;
            }
        }
        return { name: reverseHabitMapping[id].split('(')[0].trim(), id, streak };
    });
}

async function toggleHabit(habitName) {
    const today = new Date().toISOString().split('T')[0];
    const targetHabit = reverseHabitMapping[habitName] || habitName;
    const database = await getDb();

    const existing = await database.get('SELECT id FROM habits_log WHERE date = ? AND habit = ?', [today, targetHabit]);

    if (existing) {
        await database.run('DELETE FROM habits_log WHERE id = ?', [existing.id]);
    } else {
        await database.run(
            'INSERT INTO habits_log (date, habit, notes) VALUES (?, ?, ?)',
            [today, targetHabit, 'Logged via Dashboard']
        );
    }
    return true;
}

module.exports = {
    getTodayHabits,
    getWeeklyHabits,
    getHabitStreaks,
    toggleHabit
};
