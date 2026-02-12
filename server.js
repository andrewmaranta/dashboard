const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const WEIGHT_LOG_PATH = path.join(__dirname, '../nutrition/weight_log.md');
const QUESTS_PATH = path.join(__dirname, '../quests.md');
const FINANCE_PATH = path.join(__dirname, '../finance/summary.json');
const NUTRITION_LOG_PATH = path.join(__dirname, '../nutrition/log.csv');

// API: Get Daily Nutrition/Activity
app.get('/api/daily-stats', (req, res) => {
    fs.readFile(NUTRITION_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.json({ calories: 0, protein: 0, steps: 0, water: 0 });
        
        const today = new Date().toISOString().split('T')[0];
        const lines = content.split('\n');
        let stats = { calories: 0, protein: 0, steps: 0, water: 0 };
        
        // Skip header, sum values for today
        for (let i = 1; i < lines.length; i++) {
            const parts = parseCSVLine(lines[i]);
            if (parts[0] === today) {
                stats.calories += isNaN(parseFloat(parts[2])) ? 0 : parseFloat(parts[2]);
                stats.protein += isNaN(parseFloat(parts[3])) ? 0 : parseFloat(parts[3]);
                stats.steps = Math.max(stats.steps, isNaN(parseFloat(parts[6])) ? 0 : parseFloat(parts[6]));
                stats.water = Math.max(stats.water, isNaN(parseFloat(parts[8])) ? 0 : parseFloat(parts[8]));
            }
        }
        res.json(stats);
    });
});

// API: Get Finance Data
app.get('/api/finance', (req, res) => {
    fs.readFile(FINANCE_PATH, 'utf8', (err, content) => {
        if (err) return res.json({ netWorth: '$0', emergencyFund: '$0', monthlySurplus: '$0' });
        try {
            const data = JSON.parse(content);
            if (data.netWorth && data.emergencyFund) { res.json(data); } 
            else { res.json({ netWorth: 'Error', emergencyFund: 'Error', monthlySurplus: 'Error' }); }
        } catch (e) {
            res.json({ netWorth: 'Error', emergencyFund: 'Error', monthlySurplus: 'Error' });
        }
    });
});

// Helper: Parse weight log
function parseWeightLog(markdown) {
    const lines = markdown.split('\n');
    const data = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.startsWith('|')) continue;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
            const date = parts[1];
            const weight = parseFloat(parts[2]);
            const bodyFatStr = parts[3].replace('%', '');
            const bodyFat = parseFloat(bodyFatStr);
            if (date && !isNaN(weight)) {
                data.push({ date, weight, bodyFat });
            }
        }
    }
    return data;
}

// Helper: Parse quests.md (Revised for D&D Attribute XP)
function parseQuests(markdown) {
    const lines = markdown.split('\n');
    let section = '';
    const result = {
        profile: { class: 'Unknown', level: 1, xp: 0, xpMax: 100 },
        attributes: {},
        daily: [],
        main: [],
        completed: []
    };
    
    let currentMainQuest = 'General';
    let currentDailySection = 'General';

    for (const line of lines) {
        const trimmed = line.trim();
        
        // Detect Sections
        if (trimmed.startsWith('## Profile')) { section = 'profile'; continue; }
        else if (trimmed.startsWith('## Attributes')) { section = 'attributes'; continue; }
        else if (trimmed.startsWith('## ⚔️ Daily Grind')) { section = 'daily'; continue; }
        else if (trimmed.startsWith('## 🛡️ Campaign') || trimmed.startsWith('## 🏰 Campaign') || trimmed.startsWith('## Campaign')) { 
            section = 'main'; 
            continue; 
        }
        else if (trimmed.startsWith('## 📜 Side Quests')) { section = 'daily'; continue; }
        else if (trimmed.startsWith('## Completed Log')) { section = 'completed'; continue; }

        // Logic per section
        if (section === 'profile') {
            if (trimmed.startsWith('- **Class:**')) result.profile.class = trimmed.replace('- **Class:**', '').replace(/\*\*/g, '').trim();
            if (trimmed.startsWith('- **Total Level:**')) {
                 const levelPart = trimmed.split(':')[1] || '1';
                 result.profile.level = parseInt(levelPart.trim()) || 1;
            }
        } 
        else if (section === 'attributes') {
            const attrMatch = trimmed.match(/- \*\*(.*?) \(.*?\):\*\* (\d+) \| (\d+) \/ (\d+)/);
            if (attrMatch) {
                const attr = attrMatch[1];
                result.attributes[attr] = { score: parseInt(attrMatch[2]), xp: parseInt(attrMatch[3]), max: parseInt(attrMatch[4]) };
            }
        } 
        else if (section === 'daily') {
            if (trimmed.startsWith('### ')) {
                currentDailySection = trimmed.replace(/#/g, '').trim();
            }
            else if (trimmed.startsWith('- [')) {
                const item = parseQuestLine(trimmed);
                if (item) {
                    item.campaign = currentDailySection;
                    result.daily.push(item);
                }
            }
        }
        else if (section === 'main') {
            if (trimmed.startsWith('### ')) {
                currentMainQuest = trimmed.replace(/#/g, '').trim();
            }
            else if (trimmed.startsWith('- [')) {
                const item = parseQuestLine(trimmed);
                if (item) {
                    item.campaign = currentMainQuest;
                    result.main.push(item);
                }
            }
        }
    }
    return result;
}

function parseQuestLine(line) {
    const isCompleted = line.trim().startsWith('- [x]');
    // Regex for: "- [ ] Quest Name (+50 XP)"
    const textMatch = line.match(/- \[[ x]\] (.*?) \(\+(.*?)\)/);
    
    if (textMatch) {
        const text = textMatch[1].trim();
        const rewardsStr = textMatch[2];
        let rewards = {};
        
        rewardsStr.split(',').forEach(r => {
            const parts = r.trim().split(' ');
            if (parts.length >= 2) {
                const val = parseInt(parts[0]);
                const attr = parts[1];
                if (!isNaN(val)) rewards[attr] = val;
            }
        });
        return { text, rewards, completed: isCompleted, raw: line };
    } else {
        // Fallback for no rewards listed
        const text = line.replace(/- \[[ x]\] /, '').trim();
        return { text, rewards: {}, completed: isCompleted, raw: line };
    }
}

// API: Get Health Data
app.get('/api/health', (req, res) => {
    fs.readFile(WEIGHT_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Failed to read weight log' });
        res.json(parseWeightLog(content));
    });
});

// API: Get Quest Data
app.get('/api/quests', (req, res) => {
    fs.readFile(QUESTS_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Failed to read quests' });
        res.json(parseQuests(content));
    });
});

// API: Toggle Quest (Updated for Attribute XP)
app.post('/api/quests/toggle', (req, res) => {
    const { questText } = req.body;
    
    fs.readFile(QUESTS_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Read error' });
        
        let lines = content.split('\n');
        let newLines = [];
        let rewards = {};
        let found = false;
        let isComplete = false;

        for (let line of lines) {
            if (line.includes(questText) && (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]'))) {
                found = true;
                isComplete = line.trim().startsWith('- [x]');
                
                const rewardMatch = line.match(/\(\+(.*?)\)/);
                if (rewardMatch) {
                    const parts = rewardMatch[1].split(',');
                    parts.forEach(p => {
                        const segs = p.trim().split(' ');
                        if (segs.length >= 2) {
                             rewards[segs[1]] = parseInt(segs[0]);
                        }
                    });
                }

                if (isComplete) {
                    newLines.push(line.replace('- [x]', '- [ ]'));
                } else {
                    newLines.push(line.replace('- [ ]', '- [x]'));
                }
            } else {
                newLines.push(line);
            }
        }

        if (!found) return res.status(404).json({ error: 'Quest not found' });

        let finalLines = [];
        
        for (let line of newLines) {
            let updatedLine = line;
            
            for (const [attr, xpVal] of Object.entries(rewards)) {
                if (line.trim().startsWith(`- **${attr} (`)) {
                    const match = line.match(/:\*\* (\d+) \| (\d+) \/ (\d+)/);
                    if (match) {
                        let score = parseInt(match[1]);
                        let xp = parseInt(match[2]);
                        let max = parseInt(match[3]);
                        
                        const change = isComplete ? -xpVal : xpVal;
                        xp += change;
                        
                        if (xp >= max) {
                            score += Math.floor(xp / max);
                            xp = xp % max;
                        } else if (xp < 0) {
                            xp = 0; 
                        }
                        
                        updatedLine = line.replace(/:\*\* .*/, `:** ${score} | ${xp} / ${max}`);
                    } else {
                        const legacyMatch = line.match(/:\*\* (\d+)/);
                        if (legacyMatch) {
                            let score = parseInt(legacyMatch[1]);
                            let xp = isComplete ? 0 : xpVal;
                            updatedLine = line.replace(/:\*\* .*/, `:** ${score} | ${xp} / 100`);
                        }
                    }
                }
            }
            finalLines.push(updatedLine);
        }

        fs.writeFile(QUESTS_PATH, finalLines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Write error' });
            res.json({ success: true });
        });
    });
});

// API: Calculate Streaks
app.get('/api/streaks', (req, res) => {
    fs.readFile(NUTRITION_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.json({ foodLogStreak: 0, calorieStreak: 0, proteinStreak: 0 });
        
        const lines = content.split('\n').slice(1); // Skip header
        const dailyStats = new Map();
        
        // Aggregate daily totals
        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = parseCSVLine(line);
            if (parts.length < 4) return;
            const date = parts[0];
            const calories = parseFloat(parts[2]) || 0;
            const protein = parseFloat(parts[3]) || 0;
            
            if (!dailyStats.has(date)) {
                dailyStats.set(date, { calories: 0, protein: 0 });
            }
            const stats = dailyStats.get(date);
            stats.calories += calories;
            stats.protein += protein;
        });

        // Convert to array and sort by date descending (newest first)
        const sortedDays = Array.from(dailyStats.entries())
            .sort((a, b) => new Date(b[0]) - new Date(a[0]));

        // Get today's and yesterday's dates for comparison
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Check if we have data for today or yesterday (streak only counts if recent)
        const mostRecentDate = sortedDays.length > 0 ? sortedDays[0][0] : null;
        const hasRecentData = mostRecentDate === today || mostRecentDate === yesterday;

        let foodLogStreak = 0;
        let calorieStreak = 0;
        let proteinStreak = 0;

        if (hasRecentData) {
            // Calculate each streak independently
            for (let i = 0; i < sortedDays.length; i++) {
                const [, stats] = sortedDays[i];
                const prevDate = i > 0 ? sortedDays[i-1][0] : null;
                const currDate = sortedDays[i][0];
                
                // Check if this day is consecutive to the previous
                const isConsecutive = i === 0 || isDateConsecutive(prevDate, currDate);
                
                if (!isConsecutive && i > 0) break;
                
                foodLogStreak++;
                
                if (stats.calories <= 1800 && stats.calories > 0) {
                    calorieStreak++;
                }
                
                if (stats.protein >= 150) {
                    proteinStreak++;
                }
            }
        }

        res.json({
            foodLogStreak,
            calorieStreak,
            proteinStreak
        });
    });
});

// Helper: Check if dates are consecutive
function isDateConsecutive(newerDate, olderDate) {
    const d1 = new Date(newerDate);
    const d2 = new Date(olderDate);
    const diffTime = d1 - d2;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 1;
}

// Helper: Parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// API: Get Heatmap Data
app.get('/api/heatmap', (req, res) => {
    fs.readFile(NUTRITION_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Failed to read nutrition log' });

        const lines = content.split('\n').slice(1); // Skip header
        const dailyStats = new Map();
        
        // Aggregate daily totals
        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = parseCSVLine(line);
            if (parts.length < 9) return;
            
            const date = parts[0];
            const calories = parseFloat(parts[2]) || 0;
            const protein = parseFloat(parts[3]) || 0;
            const steps = parseFloat(parts[6]) || 0;
            
            if (!dailyStats.has(date)) {
                dailyStats.set(date, {
                    date,
                    calories: 0,
                    protein: 0,
                    steps: steps, // Take highest steps value for the day
                    entries: 0
                });
            }
            
            const stats = dailyStats.get(date);
            stats.calories += calories;
            stats.protein += protein;
            stats.steps = Math.max(stats.steps, steps);
            stats.entries++;
        });

        // Get last 30 days, fill in missing days
        const today = new Date();
        const result = [];
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const stats = dailyStats.get(dateStr) || {
                date: dateStr,
                calories: 0,
                protein: 0,
                steps: 0,
                entries: 0
            };

            // Calculate completion percentages
            result.unshift({
                date: dateStr,
                protein: Math.min(100, (stats.protein / 150) * 100),
                calories: stats.calories > 0 ? (stats.calories <= 1800 ? 100 : Math.max(0, 100 - ((stats.calories - 1800) / 100 * 10))) : 0,
                steps: Math.min(100, (stats.steps / 10000) * 100),
                foodLog: stats.entries > 0 ? 100 : 0
            });
        }

        res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Life RPG Dashboard running on http://localhost:${PORT}`);
});
