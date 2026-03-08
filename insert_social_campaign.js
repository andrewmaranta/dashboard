const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'life.db');

async function migrate() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Inserting Social Ladder Campaign...');

    const campaignName = 'Social Mastery (SOC)';
    const description = 'A graduated exposure ladder to build social confidence and reduce safety behaviors.';
    const attribute = 'SOC';

    const milestones = [
        { title: 'Level 1: Make eye contact and smile at a stranger', campaign: campaignName, description, attribute },
        { title: 'Level 2: Give a genuine compliment to a service worker', campaign: campaignName, description, attribute },
        { title: 'Level 3: Ask a cashier an open-ended question', campaign: campaignName, description, attribute },
        { title: 'Level 4: Initiate a brief conversation with a neighbor/acquaintance', campaign: campaignName, description, attribute },
        { title: 'Level 5: Attend a social gathering or event', campaign: campaignName, description, attribute },
        { title: 'Level 6: Share an opinion in a group setting', campaign: campaignName, description, attribute },
        { title: 'Level 7: Invite a friend or acquaintance to grab coffee', campaign: campaignName, description, attribute },
        { title: 'Level 8: Engage in small talk without using your phone as a safety behavior', campaign: campaignName, description, attribute },
        { title: 'Level 9: Compliment a stranger on something specific', campaign: campaignName, description, attribute },
        { title: 'Level 10: Hold a conversation for 5+ minutes with a new person', campaign: campaignName, description, attribute }
    ];

    try {
        for (const m of milestones) {
            await db.run(
                'INSERT INTO milestones (title, campaign, description, attribute, completed) VALUES (?, ?, ?, ?, 0)',
                [m.title, m.campaign, m.description, m.attribute]
            );
        }
        console.log('Successfully inserted Social Ladder campaign.');
    } catch (e) {
        console.error('Error inserting campaign:', e.message);
    }

    await db.close();
}

migrate().catch(console.error);