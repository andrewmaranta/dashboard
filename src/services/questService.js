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

async function getQuests() {
    const database = await getDb();
    
    // Get attributes
    const attrs = await database.all('SELECT * FROM attributes ORDER BY code');
    const attributes = {};
    attrs.forEach(a => {
        attributes[a.code] = { score: a.score, xp: a.xp, max: a.xp_max };
    });
    
    // Get daily quests
    const dailyRows = await database.all('SELECT * FROM daily_quests ORDER BY sort_order');
    const daily = dailyRows.map(q => ({
        text: q.text,
        completed: q.completed === 1
    }));
    
    // Get milestones (main quests)
    const milestoneRows = await database.all('SELECT * FROM milestones ORDER BY campaign');
    const main = milestoneRows.map(m => ({
        text: m.title,
        campaign: m.campaign,
        completed: m.completed === 1
    }));
    
    return {
        profile: { class: 'Phase 1', level: 1, xp: 0, xpMax: 100 },
        attributes,
        daily,
        main,
        completed: []
    };
}

async function toggleDailyQuest(id) {
    const database = await getDb();
    await database.run('UPDATE daily_quests SET completed = NOT completed WHERE id = ?', [id]);
    return { success: true };
}

async function toggleMilestone(id) {
    const database = await getDb();
    await database.run('UPDATE milestones SET completed = NOT completed WHERE id = ?', [id]);
    return { success: true };
}

async function getGoals() {
    const database = await getDb();
    const rows = await database.all('SELECT * FROM milestones ORDER BY campaign');
    
    const campaigns = {};
    rows.forEach(m => {
        if (!campaigns[m.campaign]) {
            campaigns[m.campaign] = {
                name: m.campaign.replace(/\s*\([A-Z]{3}\)$/, ''),
                attribute: m.attribute,
                description: m.description,
                milestones: []
            };
        }
        campaigns[m.campaign].milestones.push({
            title: m.title,
            completed: m.completed === 1,
            xp: m.xp_reward
        });
    });
    
    return Object.values(campaigns);
}

async function completeDashboardCheckIn() {
    // Log dashboard review as a habit
    const today = new Date().toISOString().split('T')[0];
    const database = await getDb();
    await database.run(
        'INSERT INTO habits_log (date, habit, notes) VALUES (?, ?, ?)',
        [today, 'Dashboard', 'Daily review completed']
    );
    return { success: true };
}

module.exports = {
    getQuests,
    toggleDailyQuest,
    toggleMilestone,
    getGoals,
    completeDashboardCheckIn
};
