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

async function createBelief(text, attributeCode, confidence = 50) {
    const database = await getDb();
    const now = new Date().toISOString();
    return await database.run(
        'INSERT INTO beliefs (text, attribute_code, confidence, initial_confidence, created_at) VALUES (?, ?, ?, ?, ?)',
        [text, attributeCode, confidence, confidence, now]
    );
}

async function getBeliefs() {
    const database = await getDb();
    const beliefs = await database.all('SELECT * FROM beliefs WHERE archived = 0 ORDER BY created_at DESC');
    
    for (const belief of beliefs) {
        // 1. Fetch completed tasks linked to this belief
        const tasks = await database.all(
            `SELECT id, text, completed_at as created_at, 'task' as type 
             FROM tasks 
             WHERE belief_id = ? AND completed = 1`, 
            [belief.id]
        );

        // 2. Fetch manual/other evidence
        const otherEvidence = await database.all(
            `SELECT id, text, created_at, type 
             FROM belief_evidence 
             WHERE belief_id = ?`,
            [belief.id]
        );

        // 3. Merge and Sort
        const allEvidence = [...tasks, ...otherEvidence].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        belief.evidence = allEvidence;
        belief.evidence_count = allEvidence.length;
    }
    return beliefs;
}

async function updateBelief(id, text, confidence) {
    const database = await getDb();
    return await database.run(
        'UPDATE beliefs SET text = ?, confidence = ? WHERE id = ?',
        [text, confidence, id]
    );
}

async function archiveBelief(id) {
    const database = await getDb();
    return await database.run('UPDATE beliefs SET archived = 1 WHERE id = ?', [id]);
}

async function deleteBelief(id) {
    const database = await getDb();
    await database.run('UPDATE tasks SET belief_id = NULL WHERE belief_id = ?', [id]);
    await database.run('DELETE FROM belief_evidence WHERE belief_id = ?', [id]);
    return await database.run('DELETE FROM beliefs WHERE id = ?', [id]);
}

async function addEvidence(beliefId, text, type = 'manual') {
    const database = await getDb();
    const now = new Date().toISOString();
    return await database.run(
        'INSERT INTO belief_evidence (belief_id, text, type, created_at) VALUES (?, ?, ?, ?)',
        [beliefId, text, type, now]
    );
}

async function deleteEvidence(id) {
    const database = await getDb();
    return await database.run('DELETE FROM belief_evidence WHERE id = ?', [id]);
}

module.exports = {
    createBelief,
    getBeliefs,
    updateBelief,
    archiveBelief,
    deleteBelief,
    addEvidence,
    deleteEvidence
};
