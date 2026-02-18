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

async function getAttributes() {
    const database = await getDb();
    const rows = await database.all('SELECT * FROM attributes ORDER BY code');
    const attrs = {};
    rows.forEach(r => attrs[r.code] = r);
    return attrs;
}

module.exports = {
    addXP,
    getAttributes
};
