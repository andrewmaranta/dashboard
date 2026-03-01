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

async function getProtocols() {
    const database = await getDb();
    return await database.all('SELECT * FROM protocols WHERE archived = 0 ORDER BY created_at DESC');
}

async function createProtocol(trigger, action, difficulty, attribute) {
    const database = await getDb();
    const now = new Date().toISOString();
    const actionValue = Array.isArray(action) ? JSON.stringify(action) : action;
    return await database.run(
        'INSERT INTO protocols (trigger, action, difficulty, attribute, created_at) VALUES (?, ?, ?, ?, ?)',
        [trigger, actionValue, difficulty, attribute, now]
    );
}

async function logProtocol(id, isHit, io = null) {
    const database = await getDb();
    const protocol = await database.get('SELECT * FROM protocols WHERE id = ?', [id]);
    if (!protocol) return;

    if (isHit) {
        await database.run('UPDATE protocols SET hits = hits + 1 WHERE id = ?', [id]);
        
        // Award XP
        if (protocol.attribute) {
            const xpMapping = { 'easy': 10, 'medium': 25, 'hard': 50 };
            const xp = xpMapping[protocol.difficulty] || 25;
            const result = await attributeService.addXP(protocol.attribute, xp, io);
            if (result && io) {
                io.emit('xpGainedV2', { attribute: result.code, amount: xp });
            }
        }
    } else {
        await database.run('UPDATE protocols SET misses = misses + 1 WHERE id = ?', [id]);
    }
    return { success: true };
}

async function archiveProtocol(id) {
    const database = await getDb();
    return await database.run('UPDATE protocols SET archived = 1 WHERE id = ?', [id]);
}

async function updateProtocol(id, trigger, action, difficulty, attribute) {
    const database = await getDb();
    const actionValue = Array.isArray(action) ? JSON.stringify(action) : action;
    return await database.run(
        'UPDATE protocols SET trigger = ?, action = ?, difficulty = ?, attribute = ? WHERE id = ?',
        [trigger, actionValue, difficulty, attribute, id]
    );
}

module.exports = {
    getProtocols,
    createProtocol,
    logProtocol,
    archiveProtocol,
    updateProtocol
};
