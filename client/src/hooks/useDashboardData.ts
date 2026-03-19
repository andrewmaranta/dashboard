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

let globalAudio: HTMLAudioElement | null = null;
let lastTTSStartedAt = 0; // Tracks when ANY TTS started to prevent stutter

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attributes, setAttributes] = useState<Attributes>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<DailyHabits>({ _date: new Date().toISOString().split('T')[0], workout: false, yoga: false, digitalSunset: false, socialInteraction: false, medication: false });
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
  const [xpNotifications, setXpNotifications] = useState<{ id: string, amount: number, attribute: string }[]>([]);
  const [levelUpNotifications, setLevelUpNotifications] = useState<{ id: string, attribute: string, name: string, newLevel: number }[]>([]);
  const [focusNotifications, setFocusNotifications] = useState<{ id: string, type: string, duration: number }[]>([]);
  const [stateLogs, setStateLogs] = useState<any[]>([]);

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [questsData, tasksData, healthData, financeRes, campaignsRes, dailyStatsRes, heatmapRes, logsRes] = await Promise.all([
        api.getQuests(),
        api.getTasks(),
        api.getHealth(),
        api.getFinance(),
        api.getCampaigns(),
        api.getDailyStats(),
        api.getHeatmap(),
        api.getStateLogs(undefined, thirtyDaysAgo.toISOString())
      ]);

      setProfile(questsData.profile);
      setAttributes(questsData.attributes);
      setTasks(tasksData);
      setHealthStats(healthData);
      setFinanceData(financeRes);
      setCampaigns(campaignsRes);
      setDailyStats(dailyStatsRes);
      setHeatmap(heatmapRes);
      setStateLogs(logsRes);

      const today = new Date().toISOString().split('T')[0];
      const habitsRes = await api.getHabits(today);
      setHabits(habitsRes);

      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    // Socket Listeners
    socket.on('habitUpdated', () => fetchData());
    socket.on('healthUpdated', () => fetchData()); // Or specific update logic
    socket.on('financeUpdated', () => fetchData());
    socket.on('questsUpdated', () => fetchData());
    socket.on('goalsUpdated', () => fetchData());
    socket.on('targetsUpdated', () => fetchData());
    socket.on('healthStatsUpdated', () => fetchData());
    socket.on('sleepUpdated', () => fetchData());
    socket.on('tasksUpdated', () => fetchData());
    socket.on('xpGainedV2', (data: { amount: number, attribute: string }) => {
      setXpNotifications(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...data }]);
      fetchData(); // Refresh attributes
    });

    socket.on('levelUp', (data: { attribute: string, name: string, newLevel: number }) => {
      setLevelUpNotifications(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...data }]);
      fetchData(); // Refresh attributes
    });

    socket.on('focusSessionComplete', (data: { type: string, duration: number }) => {
      setFocusNotifications(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...data }]);
    });

    socket.on('ttsPlay', (data: { url: string, text?: string }) => {
      console.log('TTS Broadcast Received:', data.text || 'Playing audio...');
      
      const isAutoDetected = data.text === 'Auto-detected new voice file' || !data.text;
      const now = Date.now();
      
      // Prevent stuttering: 
      // If we just started ANY TTS message within the last 15 seconds,
      // ignore any auto-detected/textless broadcasts as they are likely duplicates.
      const timeSinceLast = now - lastTTSStartedAt;
      if (isAutoDetected && (timeSinceLast < 15000)) {
        console.log(`[TTS] Ignoring redundant/auto audio to prevent stutter. Last TTS was ${timeSinceLast/1000}s ago.`);
        return;
      }
      
      // Always update timestamp to track any playback session
      lastTTSStartedAt = now;

      if (globalAudio) {
        globalAudio.pause();
        globalAudio.currentTime = 0;
      }
      globalAudio = new Audio(data.url);
      globalAudio.play().catch(err => {
        console.warn('Autoplay blocked or playback error:', err);
      });
    });

    return () => {
      socket.off('habitUpdated');
      socket.off('healthUpdated');
      socket.off('financeUpdated');
      socket.off('questsUpdated');
      socket.off('goalsUpdated');
      socket.off('targetsUpdated');
      socket.off('healthStatsUpdated');
      socket.off('sleepUpdated');
      socket.off('tasksUpdated');
      socket.off('xpGainedV2');
      socket.off('levelUp');
      socket.off('focusSessionComplete');
      socket.off('ttsPlay');
    };
  }, []);

  const removeXpNotification = (id: string) => {
    setXpNotifications(prev => prev.filter(n => n.id !== id));
  };

  const removeLevelUpNotification = (id: string) => {
    setLevelUpNotifications(prev => prev.filter(n => n.id !== id));
  };

  const removeFocusNotification = (id: string) => {
    setFocusNotifications(prev => prev.filter(n => n.id !== id));
  };

  const stopAudio = () => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.removeAttribute('src');
      globalAudio.load();
      globalAudio = null;
    }
    // As a fallback, stop any rogue audio elements on the page
    document.querySelectorAll('audio').forEach(a => {
      a.pause();
      a.removeAttribute('src');
      a.load();
    });
  };

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
    xpNotifications,
    levelUpNotifications,
    focusNotifications,
    stateLogs,
    removeXpNotification,
    removeLevelUpNotification,
    removeFocusNotification,
    stopAudio,
    refetch: fetchData
  };
};
