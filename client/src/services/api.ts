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
  PomodoroState,
  BloodPressureData,
  SleepEntry
} from '../types';

// API Base URL - Relative path since frontend is served by backend
const API_BASE = '';

// Initialize Socket.io connection
export const socket: Socket = io('/', {
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

  addTask: async (text: string, attribute?: string, difficulty?: string, if_then?: string, belief_id?: number, steps?: any[]): Promise<Task> => {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attribute, difficulty, if_then, belief_id, steps })
    });
    if (!res.ok) throw new Error('Failed to add task');
    return res.json();
  },

  toggleTask: async (id: number, suds_before?: number, suds_after?: number): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, suds_before, suds_after })
    });
  },

  deleteTask: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
  },

  updateTask: async (id: number, text: string, attribute?: string, difficulty?: string, if_then?: string, belief_id?: number, steps?: any[]): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text, attribute, difficulty, if_then, belief_id, steps })
    });
  },

  archiveCompleted: async (): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/archive-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Task Templates
  getTemplates: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/tasks/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  addTemplate: async (text: string, attribute?: string, difficulty?: string, if_then?: string, belief_id?: number, steps?: any[]): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/tasks/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attribute, difficulty, if_then, belief_id, steps })
    });
    if (!res.ok) throw new Error('Failed to add template');
    return res.json();
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/tasks/templates/${id}`, { method: 'DELETE' });
  },

  // Blueprint (Whole Trait Theory & Somatic Awareness)
  logState: async (attributeCode: string, value: number, context?: string, location?: string, socialContext?: string): Promise<void> => {
    await fetch(`${API_BASE}/api/blueprint/state-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributeCode, value, context, location, socialContext })
    });
  },

  getStateLogs: async (attributeCode?: string, startDate?: string): Promise<any[]> => {
    const query = new URLSearchParams();
    if (attributeCode) query.append('attributeCode', attributeCode);
    if (startDate) query.append('startDate', startDate);
    const res = await fetch(`${API_BASE}/api/blueprint/state-logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch state logs');
    return res.json();
  },

  logInteroception: async (feeling: string, intensity: number, vagalZone: string): Promise<void> => {
    await fetch(`${API_BASE}/api/blueprint/interoceptive-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeling, intensity, vagalZone })
    });
  },

  getInteroceptiveLogs: async (limit?: number): Promise<any[]> => {
    const query = limit ? `?limit=${limit}` : '';
    const res = await fetch(`${API_BASE}/api/blueprint/interoceptive-logs${query}`);
    if (!res.ok) throw new Error('Failed to fetch interoceptive logs');
    return res.json();
  },

  logManualSavoring: async (text: string, date: string): Promise<void> => {
    await fetch(`${API_BASE}/api/blueprint/manual-savoring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, date })
    });
  },

  // Beliefs
  getBeliefs: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/beliefs`);
    if (!res.ok) throw new Error('Failed to fetch beliefs');
    return res.json();
  },

  createBelief: async (text: string, attributeCode?: string, confidence?: number): Promise<void> => {
    await fetch(`${API_BASE}/api/beliefs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attributeCode, confidence })
    });
  },

  updateBelief: async (id: number, text: string, confidence: number): Promise<void> => {
    await fetch(`${API_BASE}/api/beliefs/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, confidence })
    });
  },

  archiveBelief: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/beliefs/${id}/archive`, { method: 'POST' });
  },

  deleteBelief: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/beliefs/${id}`, { method: 'DELETE' });
  },

  addEvidence: async (beliefId: number, text: string, type: string = 'manual'): Promise<void> => {
    await fetch(`${API_BASE}/api/beliefs/${beliefId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type })
    });
  },

  deleteEvidence: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/evidence/${id}`, { method: 'DELETE' });
  },

  // Protocols (If-Then)
  getProtocols: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/api/protocols`);
    if (!res.ok) throw new Error('Failed to fetch protocols');
    return res.json();
  },

  createProtocol: async (trigger: string, action: string | string[], difficulty: string, attribute?: string): Promise<void> => {
    await fetch(`${API_BASE}/api/protocols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger, action, difficulty, attribute })
    });
  },

  logProtocol: async (id: number, hit: boolean): Promise<void> => {
    await fetch(`${API_BASE}/api/protocols/${id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hit })
    });
  },

  updateProtocol: async (id: number, trigger: string, action: string | string[], difficulty: string, attribute?: string): Promise<void> => {
    await fetch(`${API_BASE}/api/protocols/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, trigger, action, difficulty, attribute })
    });
  },

  archiveProtocol: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/api/protocols/${id}/archive`, { method: 'POST' });
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

  syncFinance: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/finance/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sync finance data');
    }
    return res.json();
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

  getPomoState: async (): Promise<PomodoroState> => {
    const res = await fetch(`${API_BASE}/api/focus/pomo`);
    if (!res.ok) throw new Error('Failed to fetch pomodoro state');
    return res.json();
  },

  updatePomoState: async (state: Partial<PomodoroState>): Promise<void> => {
    await fetch(`${API_BASE}/api/focus/pomo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
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
  },

  getSavoringData: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/savoring`);
    if (!res.ok) throw new Error('Failed to fetch savoring data');
    return res.json();
  }
};
