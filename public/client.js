const socket = io();
const audio = new Audio('audio.mp3'); audio.volume = 0.4;
function playSound() { audio.currentTime = 0; audio.play().catch(e => console.log('Audio blocked')); }

// Socket.io Real-time Updates
socket.on('habitUpdated', (data) => {
    console.log('Habit updated remotely:', data);
    const selectedDate = document.getElementById('habit-date-picker').value;
    if (data.date === selectedDate) {
        renderHabits(data.today);
    }
    loadHeatmap();
});

async function loadHeatmap(date) {
    try {
        const localNow = new Date();
        const todayStr = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const targetDate = date || todayStr;
        
        const picker = document.getElementById('heatmap-date-picker');
        if (picker) picker.value = targetDate;

        const res = await fetch(`/api/heatmap?date=${targetDate}`);
        const data = await res.json();
        renderHeatmap(data);
    } catch (e) { console.error('Heatmap failed:', e); }
}

function changeWeek(delta) {
    const picker = document.getElementById('heatmap-date-picker');
    if (!picker) return;
    
    const currentDate = new Date(picker.value + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + (delta * 7));
    const newDateStr = currentDate.toISOString().split('T')[0];
    
    picker.value = newDateStr;
    loadHeatmap(newDateStr);
}

socket.on('healthUpdated', (stats) => {
    console.log('Health updated remotely:', stats);
    renderDailyStats(stats);
});

socket.on('healthStatsUpdated', (data) => {
    console.log('Health stats updated remotely:', data);
    renderHealth(data);
});

socket.on('financeUpdated', (data) => {
    console.log('Finance updated remotely:', data);
    renderFinance(data);
});

socket.on('questUpdated', () => {
    console.log('Quest updated remotely');
    loadData();
});

socket.on('tasksUpdated', (tasks) => {
    console.log('Tasks updated remotely:', tasks);
    renderTasks(tasks);
});

const descriptions = { PWR: "Power", AGI: "Agility", VIT: "Vitality", KNW: "Knowledge", WEL: "Wellness", SOC: "Social" };

// Pomodoro Timer State
let pomoState = {
    workTime: parseInt(localStorage.getItem('pomoWorkTime')) || 2700,
    breakTime: parseInt(localStorage.getItem('pomoBreakTime')) || 900,
    timeLeft: 2700,
    isRunning: false,
    currentMode: 'work',
    breaksEarned: parseInt(localStorage.getItem('pomoBreaksEarned')) || 0,
    timerInterval: null
};

const CIRCUMFERENCE = 2 * Math.PI * 100;

function renderRadarChart(attrs) {
    const el = document.getElementById('attributeRadar');
    if (!el) return;
    const ctx = el.getContext('2d');
    const labels = ['PWR', 'AGI', 'VIT', 'KNW', 'WEL', 'SOC'];
    const values = labels.map(attr => {
        const score = attrs[attr]?.score || 10;
        return Math.max(0, (score - 10) * 10);
    });

    if (window.attributeChart) window.attributeChart.destroy();
    window.attributeChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attributes',
                data: values,
                backgroundColor: 'rgba(122, 158, 126, 0.2)',
                borderColor: '#7a9e7e',
                borderWidth: 2,
                pointBackgroundColor: '#d4a373',
                pointBorderColor: '#e8e2d9'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { display: false },
                    grid: { color: 'rgba(122, 158, 126, 0.08)' },
                    pointLabels: { color: '#7a9e7e', font: { family: 'Fraunces', size: 12 } }
                }
            }
        }
    });
}

function renderStreaks(data) {
    const container = document.getElementById('streaks-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Nutrition Streaks
    const nutritionStreaks = [
        { id: 'foodLogStreak', label: 'Food Log', icon: 'L' },
        { id: 'calorieStreak', label: 'Calories', icon: 'C' },
        { id: 'proteinStreak', label: 'Protein', icon: 'P' }
    ];

    nutritionStreaks.forEach(type => {
        const streak = data[type.id] || 0;
        const div = document.createElement('div');
        div.className = 'streak-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="streak-icon">${type.icon}</span>
                <span style="font-family:'Nunito', sans-serif;">${type.label}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                ${streak > 0 ? `<span class="streak" style="color:var(--accent-warm);">🔥 ${streak}</span>` : '<span style="color:#666;">-</span>'}
            </div>
        `;
        container.appendChild(div);
    });

    // Habit Streaks
    if (data.habitStreaks) {
        data.habitStreaks.forEach(h => {
            if (h.streak > 0) {
                const div = document.createElement('div');
                div.className = 'streak-item';
                div.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="streak-icon" style="background:var(--accent-primary-soft);">H</span>
                        <span style="font-family:'Nunito', sans-serif;">${h.name}</span>
                    </div>
                    <span class="streak" style="color:var(--accent-warm);">🔥 ${h.streak}</span>
                `;
                container.appendChild(div);
            }
        });
    }
}

function renderHeatmap(data) {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Data is already Sun-Sat from server
    const weekDays = data;
    
    const dayLabels = document.createElement('div');
    dayLabels.className = 'heatmap-day-labels';
    dayLabels.appendChild(document.createElement('div'));
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    weekDays.forEach((dayData, index) => {
        const date = new Date(dayData.date + 'T12:00:00');
        const label = document.createElement('div');
        label.innerHTML = `${dayNames[date.getDay()]}<br><small>${date.getDate()}</small>`;
        dayLabels.appendChild(label);
    });
    grid.appendChild(dayLabels);

    const heatmapRows = [
        { key: 'workout', label: 'Workout' },
        { key: 'reading', label: 'Reading' },
        { key: 'digitalSunset', label: 'Sunset' },
        { key: 'social', label: 'Social' },
        { key: 'medication', label: 'Med' },
        { key: 'calories', label: 'Cals' },
        { key: 'protein', label: 'Prot' }
    ];

    heatmapRows.forEach(habit => {
        const row = document.createElement('div');
        row.className = 'heatmap-row';
        const label = document.createElement('div');
        label.className = 'heatmap-label';
        label.textContent = habit.label;
        row.appendChild(label);
        
        weekDays.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            
            // Get streak from main value or streaks object if available
            // Note: The main value IS the streak count if > 1, or 1 if just today
            const value = day[habit.key];
            let streakCount = 0;
            
            if (value >= 1) {
                streakCount = Math.floor(value);
                const streakLevel = Math.min(4, streakCount);
                cell.classList.add(`streak-${streakLevel}`);
            } else if (value === 0.5) {
                cell.classList.add('partial');
            }

            // Tooltip
            if (streakCount > 0) {
                const tooltip = document.createElement('div');
                tooltip.className = 'heatmap-tooltip';
                tooltip.textContent = `🔥 ${streakCount} day streak`;
                cell.appendChild(tooltip);
            } else if (value === 0.5) {
                const tooltip = document.createElement('div');
                tooltip.className = 'heatmap-tooltip';
                tooltip.textContent = `Partial`;
                cell.appendChild(tooltip);
            }

            row.appendChild(cell);
        });
        grid.appendChild(row);
    });
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabName);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    const clickedTab = Array.from(document.querySelectorAll('.nav-tab')).find(el => el.textContent.toLowerCase().includes(tabName.toLowerCase()));
    if (clickedTab) clickedTab.classList.add('active');
    
    if (tabName === 'focus') loadPomoHistory();
}

async function loadData() {
    try {
        const qRes = await fetch('/api/quests'); const qData = await qRes.json();
        renderAttributes(qData.attributes); renderHeader(qData.profile);
        
        const tasksRes = await fetch('/api/tasks'); const tasks = await tasksRes.json();
        renderTasks(tasks);
        
        const hRes = await fetch('/api/health'); const hData = await hRes.json(); renderHealth(hData);
        const statsRes = await fetch('/api/daily-stats'); const stats = await statsRes.json(); 
        renderDailyStats(stats);
        renderStreaks(stats); 

        // Get local YYYY-MM-DD
        const localNow = new Date();
        const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        // Load today's habits by default
        const habitDatePicker = document.getElementById('habit-date-picker');
        if (habitDatePicker) {
            habitDatePicker.value = today;
            loadHabitsForDate(today);
        }

        // Load today's meals by default (fix: showing today instead of yesterday)
        const datePicker = document.getElementById('meal-date-picker');
        if (datePicker) {
            datePicker.value = today;
            loadMealsForDate(today);
        }
        
        const fRes = await fetch('/api/finance'); const fData = await fRes.json(); renderFinance(fData);
        const cRes = await fetch('/api/goals'); const cData = await cRes.json(); renderCampaigns(cData);
        
        loadHeatmap();
    } catch (e) { console.error('LoadData failed:', e); }
}

let currentStats = { isToday: false };

function renderDailyStats(stats) {
    currentStats = stats;
    // Update any daily stats display elements if they exist
    const calEl = document.getElementById('daily-calories');
    const protEl = document.getElementById('daily-protein');
    if (calEl) calEl.textContent = stats.calories || 0;
    if (protEl) protEl.textContent = stats.protein || 0;
}

function renderHeader(profile) { document.getElementById('char-class').textContent = profile.class; document.getElementById('level-badge').textContent = profile.level; }

async function loadMealsForDate(date) {
    try {
        const res = await fetch(`/api/meals/${date}`);
        const meals = await res.json();
        renderMeals(meals, date);
    } catch (e) {
        console.error('Failed to load meals:', e);
    }
}

function renderMeals(meals, date) {
    const list = document.getElementById('meals-list');
    const totalCalEl = document.getElementById('meal-total-cal');
    const totalProteinEl = document.getElementById('meal-total-protein');
    const header = document.getElementById('meals-header');
    
    if (!list) return;
    list.innerHTML = '';
    
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const yesterdayDate = new Date(localNow.getTime() - 86400000);
    const yesterday = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    let dateLabel = '';
    if (date === today) dateLabel = '(Today)';
    else if (date === yesterday) dateLabel = '(Yesterday)';
    else dateLabel = `(${date})`;
    
    if (header) header.innerHTML = `🍽️ Meals <small style="color:var(--accent-warm); font-size:12px;">${dateLabel}</small>`;

    let totalCal = 0;
    let totalProtein = 0;

    if (meals.length === 0) {
        list.innerHTML = '<div style="color:#888; text-align:center; padding: 20px;">No meals logged for this date.</div>';
    } else {
        meals.forEach(meal => {
            totalCal += meal.calories || 0;
            totalProtein += meal.protein || 0;
            
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.background = 'rgba(255,255,255,0.03)';
            div.style.padding = '10px 15px';
            div.style.borderRadius = '8px';
            div.innerHTML = `
                <div style="flex:1;">${meal.item || 'Unnamed Meal'}</div>
                <div style="width: 80px; text-align: right; color: var(--accent-primary);">${meal.calories || 0} cal</div>
                <div style="width: 60px; text-align: right; color: var(--accent-warm);">${meal.protein || 0}g p</div>
            `;
            list.appendChild(div);
        });
    }
    
    if (totalCalEl) totalCalEl.textContent = totalCal;
    if (totalProteinEl) totalProteinEl.textContent = totalProtein;
}

async function loadHabitsForDate(date) {
    try {
        const res = await fetch(`/api/habits/today?date=${date}`);
        const habits = await res.json();
        renderHabits(habits);
    } catch (e) {
        console.error('Failed to load habits:', e);
    }
}

function renderHabits(habits) {
    const list = document.getElementById('core-habits-list');
    const header = document.getElementById('habits-header');
    if (!list) return;
    list.innerHTML = '';
    
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const yesterdayDate = new Date(localNow.getTime() - 86400000);
    const yesterday = new Date(yesterdayDate.getTime() - (yesterdayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    let dateLabel = '';
    if (habits._date === today) dateLabel = '(Today)';
    else if (habits._date === yesterday) dateLabel = '(Yesterday)';
    else dateLabel = `(${habits._date})`;
    
    if (header) header.innerHTML = `Core Habits <small style="color:var(--accent-warm); font-size:12px;">${dateLabel}</small>`;

    const names = {
        workout: 'Training Session (Workout)',
        read20Min: 'Reading (20m)',
        digitalSunset: 'Digital Sunset (Off 10pm)',
        socialInteraction: 'Social Interaction',
        medication: 'Medication'
    };
    Object.keys(names).forEach(key => {
        const completed = habits[key] === true;
        const li = document.createElement('li'); li.className = 'goal-item';
        li.innerHTML = `
            <div class="checkbox-custom ${completed ? 'checked' : ''}" onclick="toggleHabit('${key}', '${habits._date}')"></div>
            <div class="goal-text ${completed ? 'completed' : ''}">${names[key]}</div>
        `;
        list.appendChild(li);
    });
}

async function toggleHabit(key, date) {
    playSound();
    await fetch('/api/habits/toggle', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ habit: key, date: date }) 
    });
    loadHabitsForDate(date);
    loadHeatmap();
}

function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'goal-item';
        let attrBadge = '';
        if (task.attribute) {
            attrBadge = `<span class="goal-points" style="margin-right: 10px;">${task.attribute}</span>`;
        }
        li.innerHTML = `
            <div class="checkbox-custom ${task.completed ? 'checked' : ''}" onclick="toggleTaskItem(${task.id})"></div>
            ${attrBadge}
            <div class="goal-text ${task.completed ? 'completed' : ''}">${task.text}</div>
            <button class="timer-btn" style="background:transparent; color:var(--accent-warm); box-shadow:none; padding: 5px;" onclick="deleteTask(${task.id})">✕</button>
        `;
        list.appendChild(li);
    });
}

async function addTask() {
    const input = document.getElementById('new-task-input');
    const attrSelect = document.getElementById('new-task-attr');
    const text = input.value.trim();
    if (!text) return;
    
    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attribute: attrSelect.value })
    });
    input.value = '';
    playSound();
}

// ... existing toggleTaskItem ...

function showNotification(message) {
    const container = document.getElementById('notification-container');
    const div = document.createElement('div');
    div.style.background = 'var(--panel-bg)';
    div.style.border = '1px solid var(--accent-primary)';
    div.style.color = 'var(--text-primary)';
    div.style.padding = '15px 25px';
    div.style.marginBottom = '10px';
    div.style.borderRadius = '12px';
    div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    div.style.animation = 'fadeIn 0.3s ease-out';
    div.innerHTML = message;
    
    container.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

socket.on('xpGained', (data) => {
    playSound();
    showNotification(`✨ <strong>+${data.amount} ${data.attribute} XP</strong>`);
    // Reload attributes to show progress
    loadData();
});

async function toggleTaskItem(id) {
    playSound();
    await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
}

function changeDay(type, delta) {
    const pickerId = type === 'habit' ? 'habit-date-picker' : 'meal-date-picker';
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    
    const currentDate = new Date(picker.value + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + delta);
    const newDateStr = currentDate.toISOString().split('T')[0];
    
    picker.value = newDateStr;
    if (type === 'habit') loadHabitsForDate(newDateStr);
    else loadMealsForDate(newDateStr);
}
function renderAttributes(attrs) {
    const container = document.getElementById('attributes-list'); 
    if (!container) return;
    container.innerHTML = '';
    ['PWR', 'AGI', 'VIT', 'KNW', 'WEL', 'SOC'].forEach(key => {
        const attr = attrs[key] || { score: 10, xp: 0, max: 100 };
        const percent = Math.min(100, (attr.xp / attr.max) * 100);
        const div = document.createElement('div'); div.className = 'attr-block';
        div.innerHTML = `<div class="attr-icon">${attr.score}</div><div class="attr-details"><div class="attr-name">${key}</div><div class="attr-progress-bar"><div class="attr-progress-fill" style="width:${percent}%"></div></div></div><div class="attr-tooltip">${descriptions[key]}</div>`;
        container.appendChild(div);
    });
    renderRadarChart(attrs);
}

function renderList(elId, items) {
    const el = document.getElementById(elId); if (!el) return;
    el.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li'); li.className = 'goal-item';
        li.innerHTML = `<div class="checkbox-custom ${item.completed ? 'checked' : ''}" onclick="event.stopPropagation(); toggleGoal('${item.text}', ${!item.completed})"></div><div class="goal-text ${item.completed ? 'completed' : ''}">${item.text}</div>`;
        el.appendChild(li);
    });
}

function renderHealth(data) {
    if (!data || data.length === 0) return;
    const last = data[data.length - 1]; 
    document.getElementById('weight').textContent = last.weight; 
    document.getElementById('bf').textContent = last.bodyFat;
    
    // Fill modal values with latest
    document.getElementById('h-weight').value = last.weight;
    document.getElementById('h-bf').value = last.bodyFat;

    const container = document.querySelector('#health .chart-container');
    if (container) {
        container.innerHTML = '<canvas id="healthChart"></canvas>';
        const ctx = document.getElementById('healthChart').getContext('2d');
        new Chart(ctx, { type: 'line', data: { labels: data.map(d => d.date), datasets: [{ label: 'Weight', data: data.map(d => d.weight), borderColor: '#d4a373', backgroundColor: 'rgba(212, 163, 115, 0.1)', tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } } } } });
    }
}

function openHealthModal() {
    document.getElementById('health-modal').classList.add('active');
}
function closeHealthModal() { document.getElementById('health-modal').classList.remove('active'); }
async function saveHealthStats() {
    const weight = parseFloat(document.getElementById('h-weight').value);
    const bodyFat = parseFloat(document.getElementById('h-bf').value);
    if (isNaN(weight) || isNaN(bodyFat)) return;

    await fetch('/api/health/stats', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ weight, bodyFat }) 
    });
    playSound();
    // reload data to refresh graph and stats
    const hRes = await fetch('/api/health'); 
    const hData = await hRes.json(); 
    renderHealth(hData);
    closeHealthModal();
}

let currentFinanceData = {};
function renderFinance(data) {
    currentFinanceData = data;
    ['netWorth', 'emergencyFund', 'cashReserve', 'income', 'burnRate', 'savingsRate'].forEach(key => {
        const el = document.getElementById(key); if (el) el.textContent = data[key] || '-';
    });
    const efTarget = data.targets?.emergencyFund || 10000;
    const efCurrent = parseInt((data.emergencyFund || '$0').replace(/[^0-9]/g, ''));
    const efPercent = Math.min(100, Math.round((efCurrent / efTarget) * 100));
    document.getElementById('efProgressBar').style.width = efPercent + '%';
    document.getElementById('efProgressText').textContent = efPercent + '%';
    const cbTarget = data.targets?.cashBuffer || 5000;
    const cbCurrent = parseInt((data.cashReserve || '$0').replace(/[^0-9]/g, ''));
    const cbPercent = Math.min(100, Math.round((cbCurrent / cbTarget) * 100));
    document.getElementById('cbProgressBar').style.width = cbPercent + '%';
    document.getElementById('cbProgressText').textContent = cbPercent + '%';
}

function openFinanceModal() {
    ['netWorth', 'emergencyFund', 'cashReserve', 'income', 'burnRate', 'savingsRate'].forEach(key => {
        document.getElementById('f-' + key).value = currentFinanceData[key] || '';
    });
    document.getElementById('finance-modal').classList.add('active');
}
function closeFinanceModal() { document.getElementById('finance-modal').classList.remove('active'); }
async function saveFinances() {
    const updated = { ...currentFinanceData, lastUpdated: new Date().toISOString().split('T')[0] };
    ['netWorth', 'emergencyFund', 'cashReserve', 'income', 'burnRate', 'savingsRate'].forEach(key => {
        updated[key] = document.getElementById('f-' + key).value;
    });
    await fetch('/api/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    playSound(); renderFinance(updated); closeFinanceModal();
}

function renderCampaigns(campaigns) {
    const container = document.getElementById('campaign-list'); if (!container) return;
    container.innerHTML = campaigns.map(campaign => `
        <div class="campaign-card">
            <div class="campaign-header"><span class="campaign-attr">🎯 ${campaign.attribute}</span><span class="campaign-title">${campaign.name}</span></div>
            <div class="campaign-desc">${campaign.description}</div>
            <div class="milestone-list">${campaign.milestones.map(m => `
                <div class="milestone-item"><div class="milestone-check ${m.completed ? 'completed' : ''}">${m.completed ? '✓' : ''}</div><div class="milestone-text">${m.title}</div></div>
            `).join('')}</div>
        </div>
    `).join('');
}

async function toggleGoal(text) { playSound(); await fetch('/api/quests/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questText: text }) }); loadData(); }

// Focus Logic (Pomodoro)
function initPomodoro() {
    pomoState.timeLeft = pomoState.workTime; updatePomoDisplay(); updatePomoBank(); loadPomoHistory();
    document.getElementById('pomo-start').onclick = startPomo;
    document.getElementById('pomo-pause').onclick = pausePomo;
    document.getElementById('pomo-reset').onclick = resetPomo;
    document.getElementById('pomo-take-break').onclick = takeBreak;
    document.getElementById('pomo-settings-toggle').onclick = () => {
        document.getElementById('pomo-work-input').value = pomoState.workTime / 60;
        document.getElementById('pomo-break-input').value = pomoState.breakTime / 60;
        document.getElementById('pomo-settings-modal').classList.add('active');
    };
    document.getElementById('pomo-close-settings').onclick = () => document.getElementById('pomo-settings-modal').classList.remove('active');
    document.getElementById('pomo-save-settings').onclick = () => {
        pomoState.workTime = parseInt(document.getElementById('pomo-work-input').value) * 60;
        pomoState.breakTime = parseInt(document.getElementById('pomo-break-input').value) * 60;
        resetPomo(); document.getElementById('pomo-settings-modal').classList.remove('active');
    };
}
function updatePomoDisplay() {
    const m = Math.floor(pomoState.timeLeft / 60), s = pomoState.timeLeft % 60;
    document.getElementById('timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const ring = document.getElementById('pomodoro-ring');
    if (ring) ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - pomoState.timeLeft / (pomoState.currentMode === 'work' ? pomoState.workTime : pomoState.breakTime));
}
function updatePomoBank() {
    const v = document.getElementById('pomo-tokens'); v.innerHTML = '☕'.repeat(pomoState.breaksEarned) || 'No breaks earned yet.';
    document.getElementById('pomo-take-break').disabled = pomoState.breaksEarned === 0 || pomoState.currentMode === 'break';
    localStorage.setItem('pomoBreaksEarned', pomoState.breaksEarned);
}
function startPomo() {
    if (pomoState.isRunning) return;
    pomoState.isRunning = true; 
    document.getElementById('pomo-start').style.display = 'none'; 
    document.getElementById('pomo-pause').style.display = 'inline-block';
    
    pomoState.timerInterval = setInterval(async () => {
        pomoState.timeLeft--; 
        updatePomoDisplay();
        
        if (pomoState.timeLeft <= 0) {
            playSound();
            const duration = Math.floor((pomoState.currentMode === 'work' ? pomoState.workTime : pomoState.breakTime) / 60);
            
            if (pomoState.currentMode === 'work') {
                pomoState.breaksEarned++;
                updatePomoBank();
                // Log work session
                await fetch('/api/focus/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        type: 'work',
                        duration: duration
                    })
                });
                loadPomoHistory();
                
                // Continue work session automatically
                pomoState.timeLeft = pomoState.workTime;
            } else {
                // Break ended, switch back to work
                pomoState.currentMode = 'work';
                pomoState.timeLeft = pomoState.workTime;
                updatePomoBank();
            }
            updatePomoDisplay();
        }
    }, 1000);
}
function pausePomo() { pomoState.isRunning = false; clearInterval(pomoState.timerInterval); document.getElementById('pomo-start').style.display = 'inline-block'; document.getElementById('pomo-pause').style.display = 'none'; }
function resetPomo() { 
    pausePomo(); 
    pomoState.currentMode = 'work';
    pomoState.timeLeft = pomoState.workTime; 
    updatePomoDisplay(); 
    updatePomoBank();
}
async function takeBreak() {
    if (pomoState.breaksEarned > 0 && pomoState.currentMode !== 'break') {
        pomoState.breaksEarned--;
        pomoState.currentMode = 'break';
        pomoState.timeLeft = pomoState.breakTime;
        updatePomoBank();
        updatePomoDisplay();
        if (!pomoState.isRunning) startPomo();
    }
}
async function loadPomoHistory() {
    const res = await fetch(`/api/focus/history?start=${new Date(Date.now()-604800000).toISOString()}&end=${new Date().toISOString()}`);
    const history = await res.json();
    document.getElementById('pomo-history').innerHTML = history.map(s => `
        <div class="history-item"><span>${new Date(s.timestamp).toLocaleDateString()}</span><span>${s.duration}m</span></div>
    `).join('') || '<div class="history-item">No records yet.</div>';
}

function updateDateDisplay() {
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function init() { updateDateDisplay(); await loadData(); initPomodoro(); }
init();
