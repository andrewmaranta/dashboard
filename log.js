const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/life.db');

async function logEntry(type, data) {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    // Get local date (PST) instead of UTC
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const now = localNow.toISOString();

    try {
        switch(type) {
            case 'nutrition':
                // data: { item, calories, protein, carbs, fat, fiber, date? }
                const nutDate = data.date || today;
                await db.run(
                    `INSERT INTO nutrition_log (date, item, calories, protein, carbs, fat, fiber) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [nutDate, data.item, data.calories || 0, data.protein || 0, 
                     data.carbs || 0, data.fat || 0, data.fiber || 0]
                );
                console.log(`🍽️  Logged: ${data.item} (${data.calories} cal, ${data.protein}g protein)`);
                break;

            case 'habit':
                // data: { habit, date? } - habit names: 'Workout', 'Read20Min', etc.
                const habitDate = data.date || today;
                await db.run(
                    `INSERT OR REPLACE INTO habits_log (date, habit, completed) VALUES (?, ?, ?)`,
                    [habitDate, data.habit, 1]
                );
                console.log(`✅ Habit logged: ${data.habit}`);
                break;

            case 'weight':
                // data: { weight, bodyFat, date? }
                const weightDate = data.date || today;
                await db.run(
                    `INSERT INTO weight_history (date, weight, body_fat) VALUES (?, ?, ?)`,
                    [weightDate, data.weight, data.bodyFat || null]
                );
                console.log(`⚖️  Weight logged: ${data.weight} lbs`);
                break;

            case 'focus':
                // data: { duration, type } - type: 'work' or 'break'
                await db.run(
                    `INSERT INTO focus_sessions (timestamp, type, duration) VALUES (?, ?, ?)`,
                    [now, data.type || 'work', data.duration || 45]
                );
                console.log(`🎯 Focus session: ${data.duration}min ${data.type}`);
                break;

            case 'finance':
                // data: { netWorth, emergencyFund, monthlySurplus }
                await db.run(
                    `INSERT OR REPLACE INTO finance (id, net_worth, emergency_fund, monthly_surplus, updated_at)
                     VALUES (1, ?, ?, ?, ?)`,
                    [data.netWorth || 0, data.emergencyFund || 0, 
                     data.monthlySurplus || 0, now]
                );
                console.log(`💰 Finance updated`);
                break;

            case 'bp':
            case 'bloodpressure':
                // data: { systolic, diastolic, pulse, notes?, date?, time? }
                const bpDate = data.date || today;
                const time = data.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                await db.run(
                    `INSERT INTO blood_pressure (date, time, systolic, diastolic, pulse, notes) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [bpDate, time, data.systolic, data.diastolic, data.pulse, data.notes || '']
                );
                console.log(`🩺 Blood pressure logged: ${data.systolic}/${data.diastolic} (Pulse: ${data.pulse})`);
                break;

            default:
                console.log(`Unknown type: ${type}`);
        }
    } catch (err) {
        console.error('Error logging:', err.message);
    }

    await db.close();
}

// CLI usage
const type = process.argv[2];
const jsonData = process.argv[3];

async function main() {
    if (type && jsonData) {
        try {
            const data = JSON.parse(jsonData);
            await logEntry(type, data);
        } catch(e) {
            console.error('Invalid JSON:', e.message);
            process.exit(1);
        }
    } else {
        console.log('Usage: node log.js <type> \'<json-data>\'');
        console.log('');
        console.log('Examples:');
        console.log('  node log.js nutrition \'{"item":"Eggs","calories":300,"protein":20}\'');
        console.log('  node log.js habit \'{"habit":"Workout"}\'');
        console.log('  node log.js weight \'{"weight":210.5,"bodyFat":28}\'');
        console.log('  node log.js focus \'{"duration":45,"type":"work"}\'');
        console.log('  node log.js finance \'{"emergencyFund":7000}\'');
        console.log('  node log.js bp \'{"systolic":120,"diastolic":80,"pulse":72}\'');
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

module.exports = { logEntry };
