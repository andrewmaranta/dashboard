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

async function addXP(attributeCode, amount) {
    if (!attributeCode || amount <= 0) return null;
    
    const database = await getDb();
    const attr = await database.get('SELECT * FROM attributes WHERE code = ?', [attributeCode]);
    
    if (!attr) return null;
    
    let newXP = attr.xp + amount;
    let newScore = attr.score;
    let newMax = attr.xp_max;
    let leveledUp = false;
    
    while (newXP >= newMax) {
        newXP -= newMax;
        newScore += 1;
        newMax = Math.floor(newMax * 1.1); // 10% increase in difficulty
        leveledUp = true;
    }
    
    await database.run(
        'UPDATE attributes SET xp = ?, score = ?, xp_max = ? WHERE code = ?',
        [newXP, newScore, newMax, attributeCode]
    );
    
    return { 
        code: attributeCode, 
        xpGained: amount, 
        currentXP: newXP, 
        score: newScore, 
        leveledUp 
    };
}

async function removeXP(attributeCode, amount) {
    if (!attributeCode || amount <= 0) return null;
    
    const database = await getDb();
    const attr = await database.get('SELECT * FROM attributes WHERE code = ?', [attributeCode]);
    
    if (!attr) return null;
    
    let newXP = attr.xp - amount;
    let newScore = attr.score;
    let newMax = attr.xp_max;
    
    // Handle level down
    while (newXP < 0 && newScore > 1) { // Assuming level 1 is min
        newScore -= 1;
        // Reverse the 10% increase: oldMax = newMax / 1.1
        // Since we did floor previously, we might need to approximate or store level tables.
        // For simplicity: newMax = Math.ceil(newMax / 1.1)
        newMax = Math.ceil(newMax / 1.1);
        newXP += newMax;
    }
    
    if (newXP < 0) newXP = 0; // Cap at 0 if at min level
    
    await database.run(
        'UPDATE attributes SET xp = ?, score = ?, xp_max = ? WHERE code = ?',
        [newXP, newScore, newMax, attributeCode]
    );
    
    return { 
        code: attributeCode, 
        xpLost: amount, 
        currentXP: newXP, 
        score: newScore 
    };
}

async function getAttributes() {
    const database = await getDb();
    const rows = await database.all('SELECT * FROM attributes ORDER BY code');
    const attrs = {};
    rows.forEach(r => attrs[r.code] = r);
    return attrs;
}

module.exports = {
    addXP,
    removeXP,
    getAttributes
};
