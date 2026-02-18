const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { isDateConsecutive } = require('../utils/dateUtils');
const attributeService = require('./attributeService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

const habitMapping = {
    'Workout': 'workout',
    'workout': 'workout',
    'Read20Min': 'read20Min',
    'read20Min': 'read20Min',
    "The Reader's Vow": 'read20Min',
    'DigitalSunset': 'digitalSunset',
    'digitalSunset': 'digitalSunset',
    'Off screens 10pm': 'digitalSunset',
    'SocialInteraction': 'socialInteraction',
    'socialInteraction': 'socialInteraction',
    "Stranger's Greeting": 'socialInteraction',
    'Medication': 'medication',
    'medication': 'medication',
    'The Vital Dose': 'medication'
};

const habitAttributes = {
    'workout': 'PWR',
    'read20Min': 'KNW',
    'digitalSunset': 'WEL',
    'socialInteraction': 'SOC',
    'medication': 'VIT'
};

const reverseHabitMapping = {
    'workout': 'Workout',
    'read20Min': "The Reader's Vow",
    'digitalSunset': 'Off screens 10pm',
    'socialInteraction': "Stranger's Greeting",
    'medication': 'The Vital Dose'
};

async function getTodayHabits(requestedDate) {
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dateToFetch = requestedDate || today;
    const database = await getDb();
    
    // Check for specific date
    let rows = await database.all('SELECT habit FROM habits_log WHERE date = ?', [dateToFetch]);
    let resultDate = dateToFetch;
    let isToday = (dateToFetch === today);

    if (rows.length === 0 && !requestedDate) {
        // Find latest date with habits only if no specific date requested
        const latest = await database.get('SELECT date FROM habits_log ORDER BY date DESC LIMIT 1');
        if (latest) {
            rows = await database.all('SELECT habit FROM habits_log WHERE date = ?', [latest.date]);
            resultDate = latest.date;
            isToday = (resultDate === today);
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
    const localNow = new Date();
    const dayOfWeek = localNow.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1;
    const weekStart = new Date(localNow);
    weekStart.setDate(localNow.getDate() - dayOfWeek + mondayOffset);
    const weekStartStr = new Date(weekStart.getTime() - (weekStart.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
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
    
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const yesterdayDate = new Date(localNow.getTime() - 86400000);
    const yesterday = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

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

async function toggleHabit(habitName, requestedDate) {
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dateToToggle = requestedDate || today;
    const targetHabit = reverseHabitMapping[habitName] || habitName;
    const database = await getDb();

    const existing = await database.get('SELECT id FROM habits_log WHERE date = ? AND habit = ?', [dateToToggle, targetHabit]);

    let xpResult = null;
    if (existing) {
        await database.run('DELETE FROM habits_log WHERE id = ?', [existing.id]);
    } else {
        await database.run(
            'INSERT INTO habits_log (date, habit, notes) VALUES (?, ?, ?)',
            [dateToToggle, targetHabit, 'Logged via Dashboard']
        );
        // Award XP
        const normalized = habitMapping[targetHabit] || targetHabit;
        const attrCode = habitAttributes[normalized];
        if (attrCode) {
            xpResult = await attributeService.addXP(attrCode, 10);
        }
    }
    return { success: true, xp: xpResult };
}

module.exports = {
    getTodayHabits,
    getWeeklyHabits,
    getHabitStreaks,
    toggleHabit,
    habitMapping
};
