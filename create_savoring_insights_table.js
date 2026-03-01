const { DB_PATH } = require('./src/config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function migrate() {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS savoring_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT DEFAULT '✨',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    // Seed with a placeholder if empty
    const count = await db.get('SELECT COUNT(*) as c FROM savoring_insights');
    if (count.c === 0) {
        await db.run(`INSERT INTO savoring_insights (category, title, description, icon) VALUES 
        ('system', 'Awaiting OpenClaw Analysis', 'OpenClaw will run its weekly analysis soon to uncover your hidden mastery patterns.', '⏳')`);
    }

    console.log("savoring_insights table created successfully.");
    await db.close();
}

migrate().catch(console.error);
