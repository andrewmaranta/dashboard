const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Creating tables...');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS nutrition_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            item TEXT,
            calories REAL DEFAULT 0,
            protein REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            fat REAL DEFAULT 0,
            fiber REAL DEFAULT 0,
            steps INTEGER DEFAULT 0,
            deep_work_hours REAL DEFAULT 0,
            water_liters REAL DEFAULT 0,
            financial_check_in TEXT
        );

        CREATE TABLE IF NOT EXISTS habits_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            habit TEXT NOT NULL,
            duration TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS weight_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            weight REAL NOT NULL,
            body_fat REAL
        );

        CREATE TABLE IF NOT EXISTS focus_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            duration INTEGER NOT NULL
        );
    `);

    // Migration logic for Nutrition CSV
    const nutritionPath = path.join(DATA_DIR, 'nutrition.csv');
    if (fs.existsSync(nutritionPath)) {
        console.log('Migrating nutrition data...');
        const content = fs.readFileSync(nutritionPath, 'utf8');
        const lines = content.split('\n').slice(1);
        for (const line of lines) {
            if (!line.trim()) continue;
            const p = line.split(',').map(s => s.replace(/"/g, '').trim());
            if (p.length >= 10) {
                await db.run(
                    `INSERT INTO nutrition_log (date, item, calories, protein, carbs, fat, fiber, steps, deep_work_hours, water_liters, financial_check_in) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p[0], p[1], parseFloat(p[2])||0, parseFloat(p[3])||0, parseFloat(p[4])||0, parseFloat(p[5])||0, parseFloat(p[6])||0, parseInt(p[7])||0, parseFloat(p[8])||0, parseFloat(p[9])||0, p[10]||'No']
                );
            }
        }
    }

    // Migration logic for Habits CSV
    const habitsPath = path.join(DATA_DIR, 'habits.csv');
    if (fs.existsSync(habitsPath)) {
        console.log('Migrating habits data...');
        const content = fs.readFileSync(habitsPath, 'utf8');
        const lines = content.split('\n').slice(1);
        for (const line of lines) {
            if (!line.trim()) continue;
            const p = line.split(',').map(s => s.replace(/"/g, '').trim());
            if (p.length >= 2) {
                await db.run(
                    'INSERT INTO habits_log (date, habit, duration, notes) VALUES (?, ?, ?, ?)',
                    [p[0], p[1], p[2]||'', p[3]||'']
                );
            }
        }
    }

    // Migration logic for Weight Markdown
    const weightPath = path.join(DATA_DIR, 'weight.md');
    if (fs.existsSync(weightPath)) {
        console.log('Migrating weight history...');
        const content = fs.readFileSync(weightPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || !line.startsWith('|')) continue;
            const p = line.split('|').map(s => s.trim());
            if (p.length >= 4) {
                const date = p[1];
                const weight = parseFloat(p[2]);
                const bf = parseFloat(p[3].replace('%', ''));
                if (date && !isNaN(weight)) {
                    await db.run(
                        'INSERT OR IGNORE INTO weight_history (date, weight, body_fat) VALUES (?, ?, ?)',
                        [date, weight, bf]
                    );
                }
            }
        }
    }

    // Migration logic for Focus Sessions
    const focusPath = path.join(__dirname, 'focus.sqlite');
    if (fs.existsSync(focusPath)) {
        console.log('Migrating focus sessions...');
        const oldDb = await open({ filename: focusPath, driver: sqlite3.Database });
        try {
            const sessions = await oldDb.all('SELECT * FROM focus_sessions');
            for (const s of sessions) {
                await db.run(
                    'INSERT INTO focus_sessions (timestamp, type, duration) VALUES (?, ?, ?)',
                    [s.timestamp, s.type, s.duration]
                );
            }
        } catch (e) {
            console.error('No focus_sessions table in focus.sqlite to migrate.');
        }
        await oldDb.close();
    }

    console.log('Migration complete! life.db is ready.');
    await db.close();
}

migrate().catch(console.error);
