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
const HABITS_LOG_PATH = path.join(__dirname, '../habits/log.csv');

// API: Get Daily Nutrition/Activity
app.get('/api/daily-stats', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Read nutrition log
    fs.readFile(NUTRITION_LOG_PATH, 'utf8', (err, content) => {
        let stats = { calories: 0, protein: 0, steps: 0, water: 0, habits: {} };
        
        if (!err) {
            const lines = content.split('\n');
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
        }
        
        // Read habits log for today's completions
        fs.readFile(HABITS_LOG_PATH, 'utf8', (err, content) => {
            if (!err) {
                const habits = parseHabitsLog(content);
                
                // Define habit mapping to normalized names
                const habitMapping = {
                    'Workout': 'workout',
                    'Read20Min': 'read20Min',
                    "The Reader's Vow": 'read20Min',
                    'DigitalSunset': 'digitalSunset',
                    'Off screens 10pm': 'digitalSunset',
                    'SocialInteraction': 'socialInteraction',
                    "Stranger's Greeting": 'socialInteraction',
                    'Medication': 'medication',
                    'The Vital Dose': 'medication'
                };
                
                // Track today's habit completions
                const todayHabits = {};
                habits.forEach(h => {
                    if (h.date === today) {
                        const normalized = habitMapping[h.habit];
                        if (normalized) {
                            todayHabits[normalized] = true;
                        }
                    }
                });
                
                stats.habits = todayHabits;
            }
            
            res.json(stats);
        });
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
        else if (trimmed.startsWith('## ⚡ Core Habits')) { section = 'daily'; continue; }
        else if (trimmed.startsWith('## 🎯 Long-Term Goals')) { 
            section = 'main'; 
            continue; 
        }
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
                // Store the habit name and look for reward on next line
                currentDailySection = trimmed.replace(/#/g, '').trim();
                const habitName = currentDailySection;
                // Parse (STR) from habit name if present
                const attrMatch = habitName.match(/\((.*?)\)/);
                const attrType = attrMatch ? attrMatch[1] : '';
                // Create quest item
                if (habitName) {
                    result.daily.push({
                        text: habitName,
                        rewards: { [attrType]: 25 },
                        completed: false,
                        campaign: 'Core Habits',
                        raw: trimmed
                    });
                }
            }
            // Still handle traditional checkbox items
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

// Helper: Parse habits CSV log
function parseHabitsLog(content) {
    try {
        if (!content || !content.trim()) return [];
        
        const lines = content.split('\n').slice(1); // Skip header
        const habits = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = parseCSVLine(line);
            if (parts.length < 4) continue;
            
            const date = parts[0];
            const habit = parts[1];
            const duration = parts[2];
            const notes = parts[3] || '';
            
            habits.push({ date, habit, duration, notes });
        }
        
        return habits;
    } catch (err) {
        console.error('Error parsing habits log:', err);
        return [];
    }
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

// API: Get Campaign Goals
app.get('/api/goals', (req, res) => {
    fs.readFile(QUESTS_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Failed to read quests' });
        
        const lines = content.split('\n');
        let inCampaignSection = false;
        let currentCampaign = null;
        const campaigns = [];
        
        for (let line of lines) {
            if (line.startsWith('## 🎯 Long-Term Goals')) {
                inCampaignSection = true;
                continue;
            } else if (inCampaignSection && line.startsWith('## ')) {
                break; // End of campaigns section
            }
            
            if (!inCampaignSection) continue;
            
            // Start of new campaign
            if (line.startsWith('### ')) {
                if (currentCampaign) campaigns.push(currentCampaign);
                const campaignMatch = line.match(/### [⚔️🏃💰📚🧘🎭] (.*?) \((.*?)\)/);
                if (campaignMatch) {
                    currentCampaign = {
                        name: campaignMatch[1],
                        attribute: campaignMatch[2],
                        description: '',
                        milestones: []
                    };
                }
                continue;
            }
            
            // Campaign description
            if (line.startsWith('*') && currentCampaign) {
                currentCampaign.description = line.replace(/^\*|\*$/g, '').trim();
                continue;
            }
            
            // Milestone
            if (line.match(/- \[ \]/) && currentCampaign) {
                const milestoneMatch = line.match(/- \[ \] (.*?) — (.*?) \(\+(.*?) XP\)/);
                if (milestoneMatch) {
                    currentCampaign.milestones.push({
                        title: milestoneMatch[1],
                        task: milestoneMatch[2],
                        xp: parseInt(milestoneMatch[3]),
                        completed: line.includes('[x]')
                    });
                }
            }
        }
        
        // Add the last campaign
        if (currentCampaign) campaigns.push(currentCampaign);
        
        res.json(campaigns);
    });
});

// API: Complete Dashboard Check-In
app.post('/api/quest-complete', (req, res) => {
    const { questName = "Meta Habit: The Dashboard Check-In" } = req.body;
    fs.readFile(QUESTS_PATH, 'utf8', (err, content) => {
        if (err) return res.status(500).json({ error: 'Failed to read quests' });
        
        let lines = content.split('\n');
        let found = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Dashboard Check-In') && !lines[i].includes('[x]')) {
                lines[i] = lines[i].replace('[ ]', '[x]');
                found = true;
                break;
            }
        }
        
        if (!found) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        fs.writeFile(QUESTS_PATH, lines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to write quests' });
            res.json({ success: true });
        });
    });
});

// API: Get Habits Weekly Count
app.get('/api/habits/weekly', (req, res) => {
    fs.readFile(HABITS_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.json({ habits: [] });
        
        const habits = parseHabitsLog(content);
        
        // Get current week dates (Mon-Sun)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1; // If Sunday, go back 6 days, else go to Monday
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filter habits for current week
        const weekHabits = habits.filter(h => {
            const habitDate = new Date(h.date);
            return habitDate >= weekStart && habitDate <= weekEnd;
        });
        
        // Define habit mapping and targets
        const habitMapping = {
            'Workout': { name: 'Workout', target: 3 },
            'Read20Min': { name: 'Read20Min', target: 7 },
            "The Reader's Vow": { name: 'Read20Min', target: 7 },
            'DigitalSunset': { name: 'DigitalSunset', target: 7 },
            'Off screens 10pm': { name: 'DigitalSunset', target: 7 },
            'SocialInteraction': { name: 'SocialInteraction', target: 7 },
            "Stranger's Greeting": { name: 'SocialInteraction', target: 7 },
            'Medication': { name: 'Medication', target: 7 },
            'The Vital Dose': { name: 'Medication', target: 7 }
        };
        
        // Count occurrences
        const counts = {};
        weekHabits.forEach(h => {
            const mapping = habitMapping[h.habit];
            if (mapping) {
                counts[mapping.name] = (counts[mapping.name] || 0) + 1;
            }
        });
        
        // Build response
        const result = Object.entries({
            'Workout': 3,
            'Read20Min': 7,
            'DigitalSunset': 7,
            'SocialInteraction': 7,
            'Medication': 7
        }).map(([name, target]) => ({
            name,
            count: counts[name] || 0,
            target
        }));
        
        res.json({ habits: result });
    });
});

// API: Get Habits Streaks
app.get('/api/habits/streaks', (req, res) => {
    fs.readFile(HABITS_LOG_PATH, 'utf8', (err, content) => {
        if (err) return res.json({ habits: [] });
        
        const habits = parseHabitsLog(content);
        
        // Define habit mapping
        const habitMapping = {
            'Workout': 'Workout',
            'Read20Min': 'Read20Min',
            "The Reader's Vow": 'Read20Min',
            'DigitalSunset': 'DigitalSunset',
            'Off screens 10pm': 'DigitalSunset',
            'SocialInteraction': 'SocialInteraction',
            "Stranger's Greeting": 'SocialInteraction',
            'Medication': 'Medication',
            'The Vital Dose': 'Medication'
        };
        
        // Group habits by normalized name and date
        const habitsByName = {};
        habits.forEach(h => {
            const normalizedName = habitMapping[h.habit];
            if (!normalizedName) return;
            
            if (!habitsByName[normalizedName]) {
                habitsByName[normalizedName] = new Set();
            }
            habitsByName[normalizedName].add(h.date);
        });
        
        // Calculate streaks for each habit
        const today = new Date().toISOString().split('T')[0];
        const result = Object.entries({
            'Workout': [],
            'Read20Min': [],
            'DigitalSunset': [],
            'SocialInteraction': [],
            'Medication': []
        }).map(([name, _]) => {
            const dates = habitsByName[name] ? Array.from(habitsByName[name]).sort().reverse() : [];
            let streak = 0;
            
            if (dates.length > 0) {
                // Check if today or yesterday has data (streak only counts if recent)
                const mostRecent = dates[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                
                if (mostRecent === today || mostRecent === yesterday) {
                    streak = 1;
                    for (let i = 1; i < dates.length; i++) {
                        if (isDateConsecutive(dates[i-1], dates[i])) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }
            
            return { name, streak };
        });
        
        res.json({ habits: result });
    });
});

app.listen(PORT, () => {
    console.log(`Life RPG Dashboard running on http://localhost:${PORT}`);
});
