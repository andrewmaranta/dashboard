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

async function getTasks() {
    const database = await getDb();
    return await database.all('SELECT * FROM tasks ORDER BY created_at DESC');
}

async function addTask(text, attribute) {
    const database = await getDb();
    const now = new Date().toISOString();
    console.error(`DEBUG: Adding task text="${text}", attr="${attribute}"`);
    return await database.run(
        'INSERT INTO tasks (text, attribute, completed, created_at) VALUES (?, ?, 0, ?)',
        [text, attribute, now]
    );
}

async function toggleTask(id) {
    const database = await getDb();
    const task = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return;

    // Toggle the task status
    const newStatus = task.completed === 0 ? 1 : 0;
    await database.run(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        [newStatus, id]
    );
    
    // Handle XP
    let xpResult = null;
    if (task.attribute) {
        if (newStatus === 1) {
            // Completing: Award XP
            xpResult = await attributeService.addXP(task.attribute, 20);
            if (xpResult) xpResult.type = 'gained';
        } else {
            // Unchecking: Remove XP
            xpResult = await attributeService.removeXP(task.attribute, 20);
            if (xpResult) xpResult.type = 'removed';
        }
    }
    return { success: true, xp: xpResult };
}

async function deleteTask(id) {
    const database = await getDb();
    return await database.run('DELETE FROM tasks WHERE id = ?', [id]);
}

module.exports = {
    getTasks,
    addTask,
    toggleTask,
    deleteTask
};
