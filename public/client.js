const socket = io();
const audio = new Audio('audio.mp3'); audio.volume = 0.4;
function playSound() { audio.currentTime = 0; audio.play().catch(e => console.log('Audio blocked')); }

// Socket.io Real-time Updates
socket.on('habitUpdated', (data) => {
    console.log('Habit updated remotely:', data);
    renderHabits(data.today);
    renderStreaks(data.streaks);
});

socket.on('healthUpdated', (stats) => {
    console.log('Health updated remotely:', stats);
    renderDailyStats(stats);
});

socket.on('financeUpdated', (data) => {
    console.log('Finance updated remotely:', data);
    renderFinance(data);
});

socket.on('questUpdated', () => {
    console.log('Quest updated remotely');
    loadData();
});

const descriptions = { PWR: "Power", AGI: "Agility", VIT: "Vitality", KNW: "Knowledge", WEL: "Wellness", SOC: "Social" };

// Pomodoro Ritual State
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
    
    // Only show last 7 days for the weekly heatmap
    const weekDays = data.slice(-7);
    
    const dayLabels = document.createElement('div');
    dayLabels.className = 'heatmap-day-labels';
    dayLabels.appendChild(document.createElement('div'));
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    weekDays.forEach((dayData) => {
        const date = new Date(dayData.date + 'T12:00:00');
        const label = document.createElement('div');
        label.innerHTML = `${dayNames[date.getDay()]}<br><small>${date.getDate()}</small>`;
        dayLabels.appendChild(label);
    });
    grid.appendChild(dayLabels);

    const heatmapRows = [
        { key: 'workout', label: 'Workout' },
        { key: 'reading', label: 'Reading' },
        { key: 'nutrition', label: 'Nutrition' },
        { key: 'logging', label: 'Logging' }
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
            const value = day[habit.key];
            if (value >= 100) cell.classList.add('complete');
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
        renderList('daily-list', qData.daily); renderList('main-list', qData.main);
        
        const hRes = await fetch('/api/health'); const hData = await hRes.json(); renderHealth(hData);
        const statsRes = await fetch('/api/daily-stats'); const stats = await statsRes.json(); 
        renderDailyStats(stats);
        renderStreaks(stats); 

        // Load yesterday's meals by default
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const datePicker = document.getElementById('meal-date-picker');
        if (datePicker) {
            datePicker.value = yesterday;
            loadMealsForDate(yesterday);
        }
        
        const fRes = await fetch('/api/finance'); const fData = await fRes.json(); renderFinance(fData);
        const cRes = await fetch('/api/goals'); const cData = await cRes.json(); renderCampaigns(cData);
        
        const heatmapRes = await fetch('/api/heatmap'); const heatmapData = await heatmapRes.json();
        renderHeatmap(heatmapData);
    } catch (e) { console.error('LoadData failed:', e); }
}

let currentStats = { isToday: false };

function renderDailyStats(stats) {
    currentStats = stats;
    document.getElementById('display-calories').textContent = stats.calories || 0;
    document.getElementById('display-protein').textContent = stats.protein || 0;
    
    const label = document.getElementById('daily-log-header');
    if (stats.isToday) {
        document.getElementById('input-calories').value = stats.calories;
        document.getElementById('input-protein').value = stats.protein;
        document.getElementById('edit-log-btn').textContent = 'Edit Log';
        if (label) label.innerHTML = `📜 Daily Log`;
    } else {
        document.getElementById('edit-log-btn').textContent = 'Log Today';
        if (label) label.innerHTML = `📜 Daily Log <small style="color:var(--accent-warm); font-size:12px;">(Latest: ${stats.date})</small>`;
    }
    
    if (stats.habits) renderHabits(stats.habits);
}

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
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
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
    
    totalCalEl.textContent = totalCal;
    totalProteinEl.textContent = totalProtein;
}

function toggleEditLog() {
    const display = document.getElementById('stats-display');
    const edit = document.getElementById('stats-edit');
    const btn = document.getElementById('edit-log-btn');
    if (display.style.display === 'none') {
        display.style.display = 'grid'; 
        edit.style.display = 'none'; 
        btn.textContent = currentStats.isToday ? 'Edit Log' : 'Log Today';
    } else {
        display.style.display = 'none'; 
        edit.style.display = 'grid'; 
        btn.textContent = 'Cancel';
    }
}

function renderHabits(habits) {
    const list = document.getElementById('core-habits-list');
    if (!list) return;
    list.innerHTML = '';
    
    // Show tracking date in header
    const habitHeader = document.querySelector('#daily h3:nth-of-type(2)');
    if (habitHeader) {
        habitHeader.innerHTML = `Core Habits <small style="color:var(--accent-warm); font-size:12px;">(${habits._isToday ? 'Today' : 'Latest: ' + habits._date})</small>`;
    }

    const names = {
        workout: '⚔️ Training Session (Workout)',
        read20Min: '📚 The Reader\'s Vow (Read 20m)',
        digitalSunset: '🌅 Digital Sunset (Screens off 10pm)',
        socialInteraction: '🤝 Stranger\'s Greeting (Social Interaction)',
        medication: '💊 The Vital Dose (Medication)'
    };
    Object.keys(names).forEach(key => {
        const completed = habits[key] === true;
        const li = document.createElement('li'); li.className = 'goal-item';
        li.innerHTML = `<div class="checkbox-custom ${completed ? 'checked' : ''}" onclick="toggleHabit('${key}')"></div><div class="goal-text ${completed ? 'completed' : ''}">${names[key]}</div>`;
        list.appendChild(li);
    });
}

async function toggleHabit(key) {
    playSound();
    await fetch('/api/habits/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habit: key }) });
    loadData();
}

async function saveDailyStats() {
    const stats = {
        calories: parseInt(document.getElementById('input-calories').value) || 0,
        protein: parseInt(document.getElementById('input-protein').value) || 0
    };
    await fetch('/api/daily-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stats) });
    playSound(); loadData();
    if (document.getElementById('stats-edit').style.display === 'grid') toggleEditLog();
}

function renderHeader(profile) { document.getElementById('char-class').textContent = profile.class; document.getElementById('level-badge').textContent = profile.level; }
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
    const container = document.querySelector('#health .chart-container');
    if (container) {
        container.innerHTML = '<canvas id="healthChart"></canvas>';
        const ctx = document.getElementById('healthChart').getContext('2d');
        new Chart(ctx, { type: 'line', data: { labels: data.map(d => d.date), datasets: [{ label: 'Weight', data: data.map(d => d.weight), borderColor: '#d4a373', backgroundColor: 'rgba(212, 163, 115, 0.1)', tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } } } } });
    }
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
    pomoState.timeLeft = pomoState.workTime; updatePomoDisplay(); updatePomoVault(); loadPomoHistory();
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
function updatePomoVault() {
    const v = document.getElementById('pomo-tokens'); v.innerHTML = '🍷'.repeat(pomoState.breaksEarned) || 'The vault is empty.';
    document.getElementById('pomo-take-break').disabled = pomoState.breaksEarned === 0 || pomoState.currentMode === 'break';
}
function startPomo() {
    if (pomoState.isRunning) return;
    pomoState.isRunning = true; document.getElementById('pomo-start').style.display = 'none'; document.getElementById('pomo-pause').style.display = 'inline-block';
    pomoState.timerInterval = setInterval(() => {
        pomoState.timeLeft--; updatePomoDisplay();
        if (pomoState.timeLeft <= 0) { pausePomo(); playSound(); pomoState.breaksEarned++; updatePomoVault(); resetPomo(); }
    }, 1000);
}
function pausePomo() { pomoState.isRunning = false; clearInterval(pomoState.timerInterval); document.getElementById('pomo-start').style.display = 'inline-block'; document.getElementById('pomo-pause').style.display = 'none'; }
function resetPomo() { pausePomo(); pomoState.timeLeft = pomoState.workTime; updatePomoDisplay(); }
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
