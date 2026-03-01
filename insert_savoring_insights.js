const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function insertInsights() {
    const db = await open({ filename: 'data/life.db', driver: sqlite3.Database });
    
    const insights = [
        {
            category: 'health',
            title: 'Nervous System Regulation Through Consistent Sleep Hygiene',
            description: "You hit your Digital Sunset goal 4 times this week—deliberately powering down screens by 10pm. This is not just 'good sleep hygiene'—it is active nervous system regulation. By protecting your circadian rhythm, you are reducing cortisol spikes and creating the biological conditions for deep recovery. Your body is learning it can trust you to create rest.",
            icon: '🌙'
        },
        {
            category: 'cognitive',
            title: 'Active Prior Dismantling',
            description: 'You logged 3 pieces of belief evidence this week, directly challenging rigid negative priors. This is the hard work of cognitive flexibility—looking for disconfirming evidence against your own limiting stories. Each piece of evidence you recorded weakens the neural pathways of old beliefs and builds psychological resilience. You are becoming less reactive and more adaptive.',
            icon: '🧠'
        },
        {
            category: 'habit',
            title: 'Relentless Medication Consistency',
            description: "You completed 'The Vital Dose' 6 times this week—near-perfect adherence. This reflects something deeper than discipline: it shows you are prioritizing your biological foundation. Every dose is a vote for your future self, a signal that your health matters. This consistency compounds into measurable outcomes over time.",
            icon: '💊'
        },
        {
            category: 'pattern',
            title: 'Social Expansion Through Micro-Courage',
            description: "You engaged in 'Stranger's Greeting' 4 times this week. Each interaction—however brief—required a micro-dose of social courage and expanded your behavioral repertoire. You are actively rewiring social avoidance patterns and building evidence that connection is safe. Small exposures, repeated, create lasting change.",
            icon: '🤝'
        },
        {
            category: 'health',
            title: 'Steady Downward Weight Trend',
            description: 'Your weight dropped from 217.4 to 215.2 lbs—a 2.2 lb decrease in just a few days, continuing your downward trajectory from 217.6 lbs earlier this month. This is not water weight fluctuation; this is the result of your consistency in hitting protein targets (120g+) and maintaining your calorie ceiling. Your system is responding to your leadership.',
            icon: '📉'
        }
    ];
    
    for (const insight of insights) {
        await db.run(`
            INSERT INTO savoring_insights (category, title, description, icon)
            VALUES (?, ?, ?, ?)
        `, [insight.category, insight.title, insight.description, insight.icon]);
        console.log('Inserted:', insight.title);
    }
    
    console.log('\n✅ 5 insights added to savoring_insights table');
    await db.close();
}

insertInsights();
