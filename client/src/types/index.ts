export interface DailyHabits {
  _date: string;
  workout: boolean;
  workoutType?: string;
  read20Min: boolean;
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
  targets?: {
    emergencyFund: number;
    cashBuffer: number;
  };
  lastUpdated?: string;
}

export interface AttributeStat {
  code: string; // 'PWR', 'AGI', etc.
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
    habitStreaks?: { name: string; streak: number }[];
    [key: string]: any;
  };
  finance: FinanceData;
  campaigns: Campaign[];
}
