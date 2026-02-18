import { useState, useEffect } from 'react';
import { api, socket } from '../services/api';
import { 
  DailyHabits, 
  Task, 
  HealthStat, 
  FinanceData, 
  Attributes, 
  Campaign, 
  UserProfile
} from '../types';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attributes, setAttributes] = useState<Attributes>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<DailyHabits>({ _date: new Date().toISOString().split('T')[0], workout: false, read20Min: false, digitalSunset: false, socialInteraction: false, medication: false });
  const [healthStats, setHealthStats] = useState<HealthStat[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>({ 
    netWorth: '0', 
    emergencyFund: '0', 
    cashReserve: '0', 
    income: '0', 
    burnRate: '0', 
    savingsRate: '0' 
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null); // For streaks, etc.
  const [heatmap, setHeatmap] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questsData, tasksData, healthData, financeRes, campaignsRes, dailyStatsRes, heatmapRes] = await Promise.all([
        api.getQuests(),
        api.getTasks(),
        api.getHealth(),
        api.getFinance(),
        api.getCampaigns(),
        api.getDailyStats(),
        api.getHeatmap()
      ]);

      setProfile(questsData.profile);
      setAttributes(questsData.attributes);
      setTasks(tasksData);
      setHealthStats(healthData);
      setFinanceData(financeRes);
      setCampaigns(campaignsRes);
      setDailyStats(dailyStatsRes);
      setHeatmap(heatmapRes);

      const today = new Date().toISOString().split('T')[0];
      const habitsRes = await api.getHabits(today);
      setHabits(habitsRes);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket Listeners
    socket.on('habitUpdated', () => fetchData());
    socket.on('healthUpdated', () => fetchData()); // Or specific update logic
    socket.on('financeUpdated', () => fetchData());
    socket.on('questUpdated', () => fetchData());
    socket.on('tasksUpdated', () => fetchData());
    socket.on('xpGained', (data: { amount: number, attribute: string }) => {
      // Show notification if implementing notifications
      console.log(`XP Gained: +${data.amount} ${data.attribute}`);
      fetchData(); // Refresh attributes
    });

    return () => {
      socket.off('habitUpdated');
      socket.off('healthUpdated');
      socket.off('financeUpdated');
      socket.off('questUpdated');
      socket.off('tasksUpdated');
      socket.off('xpGained');
    };
  }, []);

  return {
    loading,
    profile,
    attributes,
    tasks,
    habits,
    healthStats,
    financeData,
    campaigns,
    dailyStats,
    heatmap,
    refetch: fetchData
  };
};
