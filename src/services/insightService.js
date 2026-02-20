const fs = require('fs');
const path = require('path');

const INSIGHTS_PATH = path.join(__dirname, '../../data/insights.md');

async function getInsights() {
    try {
        if (!fs.existsSync(INSIGHTS_PATH)) return [];
        
        const content = fs.readFileSync(INSIGHTS_PATH, 'utf8');
        const sections = content.split('##').slice(1);
        
        return sections.map(section => {
            const lines = section.trim().split('\n');
            const title = lines[0].trim();
            const text = lines.slice(1).join('\n').trim();
            
            // Basic icon mapping based on title keywords
            let icon = '✨';
            const t = title.toLowerCase();
            if (t.includes('productivity') || t.includes('pulse')) icon = '🌿';
            if (t.includes('wellness') || t.includes('wave')) icon = '⏳';
            if (t.includes('finance')) icon = '💰';
            
            return { title, text, icon };
        });
    } catch (err) {
        console.error('Error reading insights:', err);
        return [];
    }
}

module.exports = { getInsights };
