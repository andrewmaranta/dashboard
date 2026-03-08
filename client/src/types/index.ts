export interface DailyHabits {
  _date: string;
  workout: boolean;
  workoutType?: string;
  yoga: boolean;
  digitalSunset: boolean;
  socialInteraction: boolean;
  medication: boolean;
  [key: string]: boolean | string | number | undefined;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  attribute?: string;
  created_at?: string;
  difficulty?: string;
  if_then?: string;
  belief_id?: number;
  suds_before?: number;
  suds_after?: number;
  steps?: { text: string; completed: boolean; distress: number }[];
}

export interface TaskTemplate {
  id: number;
  text: string;
  attribute?: string;
  difficulty?: string;
  if_then?: string;
  belief_id?: number;
  steps?: { text: string; completed: boolean; distress: number }[];
  created_at?: string;
}

export interface Belief {
  id: number;
  text: string;
  attribute_code?: string;
  confidence: number;
  initial_confidence?: number;
  created_at: string;
  evidence_count?: number;
  evidence?: { id: number; text: string; created_at: string; type: 'task' | 'manual' | 'habit' | 'metric' }[];
}

export interface HealthStat {
  date: string;
  weight: number;
  bodyFat: number;
}

export interface Meal {
  id?: number;
  item: string;
  calories: number;
  protein: number;
  fiber?: number;
  date: string;
}

export interface FinanceData {
  netWorth: string;
  emergencyFund: string;
  cashReserve: string;
  income: string;
  burnRate: string;
  savingsRate: string;
  fixedCosts?: string;
  monthlySurplus?: string;
  netWorthChangePct?: number;
  notes?: string;
  targets?: {
    emergencyFund: number;
    cashBuffer: number;
  };
  lastUpdated?: string;
}

export interface AttributeStat {
  code: string; // 'PWR', 'DSC', etc.
  name?: string;
  score: number;
  xp: number;
  max: number; // xp_max
}

export interface Attributes {
  [key: string]: AttributeStat;
}

export interface Milestone {
  title: string;
  completed: boolean;
}

export interface Campaign {
  id?: number;
  name: string;
  description: string;
  attribute: string;
  milestones: Milestone[];
}

export interface FocusSession {
  timestamp: string;
  type: 'work' | 'break';
  duration: number;
}

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  workDuration: number;
  breakDuration: number;
  breaksEarned: number;
  lastTick?: string;
}

export interface BloodPressureReading {
  id?: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes?: string;
}

export interface BloodPressureData {
  history: BloodPressureReading[];
  stats: {
    avgSystolic: number;
    avgDiastolic: number;
    avgPulse: number;
    totalReadings: number;
  };
  latest: BloodPressureReading;
}

export interface SleepEntry {
  id?: number;
  date: string;
  hours: number;
  quality: number;
  notes?: string;
}

export interface HabitStreak {
  id: string;
  name: string;
  streak: number;
  active: boolean;
  safetyUsed: boolean;
}

export interface UserProfile {
  name: string;
  class: string;
  level: number;
}

export interface DashboardData {
  profile: UserProfile;
  attributes: Attributes;
  tasks: Task[];
  health: HealthStat[];
  dailyStats: {
    calories: number;
    protein: number;
    fiber: number;
    habitStreaks?: HabitStreak[];
    [key: string]: any;
  };
  finance: FinanceData;
  campaigns: Campaign[];
}
