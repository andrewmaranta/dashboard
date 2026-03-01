const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

async function updateInsights() {
    const db = await open({ filename: 'data/life.db', driver: sqlite3.Database });
    
    // Clear existing insights
    await db.run('DELETE FROM savoring_insights');
    console.log('Cleared all existing insights');
    
    // Insert new context-rich insights
    const insights = [
        {
            category: 'health',
            title: 'Root Cause Treatment: Allergy Immunotherapy Consistency',
            description: "You maintained your sublingual immunotherapy 6 times this week—a direct assault on the root cause of your chronic throat and sleep issues. This is not just 'taking medication'; you are actively retraining your immune system to stop sabotaging your nights. Every dose builds toward the deeper goal: falling asleep without throat pain, waking rested, breaking the years-long cycle. You are treating the cause, not managing symptoms.",
            icon: '💊'
        },
        {
            category: 'pattern',
            title: 'Exposure Therapy in Action: Building Social Safety',
            description: "Despite the activation energy of social anxiety, you initiated 4 interactions with strangers this week. Each brief exchange—however small—required courage and served as exposure therapy. You are actively rewiring the belief that connection is dangerous, building evidence that social interaction is survivable, even pleasant. This is the foundation for expanding your social world and creating the relationships you want. Small exposures, repeated, change patterns.",
            icon: '🤝'
        },
        {
            category: 'health',
            title: 'System-Wide Progress: Weight Responding to Treatment',
            description: 'Your weight dropped to 215.2 lbs as your system begins responding to the integrated work you are doing: allergy therapy improving sleep quality, workouts building muscle, nutrition protecting your energy, yoga managing pain. You are not "just losing weight"—you are dismantling the physiological conditions that have held you back. The 16% body fat goal is within reach because you are addressing root causes, not symptoms.',
            icon: '📉'
        },
        {
            category: 'health',
            title: 'Protecting the Foundation: Sleep Architecture Defense',
            description: "You hit Digital Sunset 4 times this week—deliberately choosing to power down screens by 10pm despite the pull of content and connection. This is active sleep architecture protection. You understand the cascade: late screens → poor sleep → throat issues → next-day suffering. By defending your circadian rhythm, you are prioritizing the biological foundation that makes everything else possible. Your body is learning it can trust you.",
            icon: '🌙'
        },
        {
            category: 'cognitive',
            title: 'Active Belief Dismantling: Emotion Regulation Evidence',
            description: 'You logged 3 pieces of evidence this week directly challenging the belief that you cannot regulate your emotions. Each entry—recognizing negative voices are not real, understanding the physiology-emotion link, having panic protocols that work—weakens the neural pathway of that limiting prior. You are building a new identity: someone who has tools, who understands their system, who can intervene. Cognitive flexibility is increasing.',
            icon: '🧠'
        }
    ];
    
    for (const insight of insights) {
        await db.run(`
            INSERT INTO savoring_insights (category, title, description, icon)
            VALUES (?, ?, ?, ?)
        `, [insight.category, insight.title, insight.description, insight.icon]);
        console.log('Inserted:', insight.title);
    }
    
    console.log('\n✅ 5 context-rich insights added');
    await db.close();
}

updateInsights();
