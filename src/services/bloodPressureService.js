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

async function getBloodPressureHistory(limit = 30) {
    const database = await getDb();
    return await database.all(
        `SELECT * FROM blood_pressure 
         ORDER BY date DESC, time DESC 
         LIMIT ?`,
        [limit]
    );
}

async function getBloodPressureStats() {
    const database = await getDb();
    const stats = await database.get(
        `SELECT 
            AVG(systolic) as avgSystolic,
            AVG(diastolic) as avgDiastolic,
            AVG(pulse) as avgPulse,
            COUNT(*) as totalReadings
         FROM blood_pressure`
    );
    
    const latest = await database.get(
        `SELECT * FROM blood_pressure ORDER BY date DESC, time DESC LIMIT 1`
    );
    
    return { stats, latest };
}

async function logBloodPressure(data) {
    const database = await getDb();
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    await database.run(
        `INSERT INTO blood_pressure (date, time, systolic, diastolic, pulse, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.date || today, data.time || time, data.systolic, data.diastolic, data.pulse, data.notes || '']
    );
    await attributeService.addXP('VIT', 10);
    
    return { success: true };
}

module.exports = {
    getBloodPressureHistory,
    getBloodPressureStats,
    logBloodPressure
};
