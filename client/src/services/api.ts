import { io, Socket } from 'socket.io-client';
import { 
  DailyHabits, 
  Task, 
  HealthStat, 
  Meal, 
  FinanceData, 
  Attributes, 
  Campaign, 
  UserProfile, 
  FocusSession,
  BloodPressureData,
  SleepEntry
} from '../types';

// API Base URL - Backend runs on port 3000
const API_BASE = 'http://100.75.38.93:3000';

// Initialize Socket.io connection
export const socket: Socket = io(API_BASE, {
  transports: ['websocket'],
  path: '/socket.io'
});

// API Functions
export const api = {
  // Quests & Attributes
  getQuests: async (): Promise<{ profile: UserProfile, attributes: Attributes }> => {
    const res = await fetch(`${API_BASE}/api/quests`);
    if (!res.ok) throw new Error('Failed to fetch quests');
    return res.json();
  },
  
  toggleQuest: async (questText: string): Promise<void> => {
    await fetch(`${API_BASE}/api/quests/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questText })
    });
  },

  // Habits
  getHabits: async (date: string): Promise<DailyHabits> => {
    console.log('Fetching habits for:', date);
    const res = await fetch(`${API_BASE}/api/habits/today?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch habits');
    const data = await res.json();
    console.log('Received habits:', data);
    return data;
  },

  toggleHabit: async (habit: string, date: string, note?: string): Promise<void> => {
    console.log('Toggling habit:', habit, 'for date:', date, 'note:', note);
    await fetch(`${API_BASE}/api/habits/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit, date, note })
    });
  },

  getHeatmap: async (date?: string): Promise<any[]> => { 
    console.log('Fetching heatmap for date:', date);
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE}/api/heatmap${query}`);
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    const data = await res.json();
    console.log('Received heatmap:', data);
    return data;
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${API_BASE}/api/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  addTask: async (text: string, attribute?: string): Promise<Task> => {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attribute })
    });
    if (!res.ok) throw new Error('Failed to add task');
    return res.json();
  },

  toggleTask: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  deleteTask: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
  },

  archiveCompleted: async (): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/archive-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Health
  getHealth: async (): Promise<HealthStat[]> => {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error('Failed to fetch health stats');
    return res.json();
  },

  updateHealthStats: async (weight: number, bodyFat: number): Promise<void> => {
    await fetch(`${API_BASE}/api/health/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, bodyFat })
    });
  },

  getBloodPressure: async (): Promise<BloodPressureData> => {
    const res = await fetch(`${API_BASE}/api/blood-pressure`);
    if (!res.ok) throw new Error('Failed to fetch blood pressure data');
    return res.json();
  },

  logBloodPressure: async (data: { systolic: number, diastolic: number, pulse: number, notes?: string }): Promise<void> => {
    await fetch(`${API_BASE}/api/blood-pressure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getSleep: async (): Promise<SleepEntry[]> => {
    const res = await fetch(`${API_BASE}/api/sleep`);
    if (!res.ok) throw new Error('Failed to fetch sleep history');
    return res.json();
  },

  updateSleep: async (hours: number, quality: number, notes?: string): Promise<void> => {
    await fetch(`${API_BASE}/api/sleep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours, quality, notes })
    });
  },

  getMeals: async (date: string): Promise<Meal[]> => {
    console.log('Fetching meals for:', date);
    const res = await fetch(`${API_BASE}/api/meals/${date}`);
    if (!res.ok) throw new Error('Failed to fetch meals');
    return res.json();
  },

  getDailyStats: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/daily-stats`);
    if (!res.ok) throw new Error('Failed to fetch daily stats');
    return res.json();
  },

  // Finance
  getFinance: async (): Promise<FinanceData> => {
    const res = await fetch(`${API_BASE}/api/finance`);
    if (!res.ok) throw new Error('Failed to fetch finance data');
    return res.json();
  },

  updateFinance: async (data: FinanceData): Promise<void> => {
    await fetch(`${API_BASE}/api/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await fetch(`${API_BASE}/api/goals`); 
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  // Focus
  getFocusHistory: async (start: string, end: string): Promise<FocusSession[]> => {
    const res = await fetch(`${API_BASE}/api/focus/history?start=${start}&end=${end}`);
    if (!res.ok) throw new Error('Failed to fetch focus history');
    return res.json();
  },

  logFocusSession: async (session: { timestamp: string, type: 'work' | 'break', duration: number }): Promise<void> => {
    await fetch(`${API_BASE}/api/focus/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  },

  // Explorer
  getTables: async (): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/api/explorer/tables`);
    if (!res.ok) throw new Error('Failed to fetch tables');
    return res.json();
  },

  getTableData: async (tableName: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/explorer/table/${tableName}`);
    if (!res.ok) throw new Error('Failed to fetch table data');
    return res.json();
  },

  getInsights: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/insights`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  }
};
