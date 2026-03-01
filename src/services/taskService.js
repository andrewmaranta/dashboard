const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');
const habitService = require('./habitService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getTasks() {
    const database = await getDb();
    const tasks = await database.all('SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at DESC');
    return tasks.map(t => ({
        ...t,
        steps: t.steps ? JSON.parse(t.steps) : []
    }));
}

async function archiveCompleted() {
    const database = await getDb();
    return await database.run('UPDATE tasks SET archived = 1 WHERE completed = 1');
}

async function addTask(text, attribute, difficulty = 'medium', if_then = null, belief_id = null, steps = []) {
    const database = await getDb();
    const now = new Date().toISOString();
    console.error(`DEBUG: Adding task text="${text}", attr="${attribute}", diff="${difficulty}"`);
    return await database.run(
        'INSERT INTO tasks (text, attribute, difficulty, completed, created_at, if_then, belief_id, steps) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
        [text, attribute, difficulty, now, if_then, belief_id, JSON.stringify(steps)]
    );
}

async function toggleTask(id, io = null) {
    const database = await getDb();
    const task = await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return;

    // Toggle the task status
    const newStatus = task.completed === 0 ? 1 : 0;
    const completedAt = newStatus === 1 ? new Date().toISOString() : null;
    
    await database.run(
        'UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?',
        [newStatus, completedAt, id]
    );
    
    // Handle XP
    let xpResult = null;
    if (task.attribute) {
        if (newStatus === 1) {
            // Calculate streak multiplier
            const streaks = await habitService.getHabitStreaks();
            const maxStreak = Math.max(...streaks.map(s => s.streak), 0);
            const multiplier = 1 + (Math.floor(maxStreak / 5) * 0.1);
            
            // Base XP based on difficulty
            const xpMapping = { 'easy': 10, 'medium': 25, 'hard': 50 };
            const baseXP = xpMapping[task.difficulty] || 25;
            const totalXP = Math.round(baseXP * multiplier);

            // Completing: Award XP
            xpResult = await attributeService.addXP(task.attribute, totalXP, io);
            if (xpResult) {
                xpResult.type = 'gained';
                xpResult.multiplier = multiplier;
                xpResult.baseXP = baseXP;
            }
        } else {
            // Unchecking: Remove XP (Always remove base XP to be fair, or scaled?)
            // Let's remove base XP to avoid "streak gaming" by unchecking while streak is high and re-checking.
            const xpMapping = { 'easy': 10, 'medium': 25, 'hard': 50 };
            const baseXP = xpMapping[task.difficulty] || 25;
            
            xpResult = await attributeService.removeXP(task.attribute, baseXP);
            if (xpResult) xpResult.type = 'removed';
        }
    }
    return { success: true, xp: xpResult };
}

async function deleteTask(id) {
    const database = await getDb();
    return await database.run('DELETE FROM tasks WHERE id = ?', [id]);
}

async function updateTask(id, text, attribute, difficulty, if_then = null, belief_id = null, steps = []) {
    const database = await getDb();
    return await database.run(
        'UPDATE tasks SET text = ?, attribute = ?, difficulty = ?, if_then = ?, belief_id = ?, steps = ? WHERE id = ?',
        [text, attribute, difficulty, if_then, belief_id, JSON.stringify(steps), id]
    );
}

// Templates logic
async function getTemplates() {
    const database = await getDb();
    const templates = await database.all('SELECT * FROM task_templates ORDER BY text ASC');
    return templates.map(t => ({
        ...t,
        steps: t.steps ? JSON.parse(t.steps) : []
    }));
}

async function addTemplate(text, attribute, difficulty = 'medium', if_then = null, belief_id = null, steps = []) {
    const database = await getDb();
    const now = new Date().toISOString();
    return await database.run(
        'INSERT INTO task_templates (text, attribute, difficulty, created_at, if_then, belief_id, steps) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [text, attribute, difficulty, now, if_then, belief_id, JSON.stringify(steps)]
    );
}

async function deleteTaskTemplate(id) {
    const database = await getDb();
    return await database.run('DELETE FROM task_templates WHERE id = ?', [id]);
}

module.exports = {
    getTasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    archiveCompleted,
    getTemplates,
    addTemplate,
    deleteTaskTemplate
};
