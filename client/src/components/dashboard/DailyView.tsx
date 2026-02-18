import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DailyHabits } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, addWeeks } from 'date-fns';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface DailyViewProps {
  data: {
    habits: DailyHabits;
    dailyStats: any;
    heatmap: any[];
  };
}

const HABIT_METADATA: Record<string, { label: string, icon: string, color: string }> = {
  workout: { label: 'Training', icon: M('🌿'), color: 'text-emerald-500' },
  read20Min: { label: 'Reading', icon: M('📖'), color: 'text-orange-400' },
  digitalSunset: { label: 'Sunset', icon: M('🌙'), color: 'text-indigo-400' },
  socialInteraction: { label: 'Social', icon: M('🤝'), color: 'text-pink-400' },
  medication: { label: 'Health', icon: M('💊'), color: 'text-cyan-400' }
};

const HEATMAP_ROWS = [
  { key: 'workout', label: 'Workout' },
  { key: 'reading', label: 'Reading' },
  { key: 'digitalSunset', label: 'Sunset' },
  { key: 'social', label: 'Social' },
  { key: 'medication', label: 'Med' },
  { key: 'calories', label: 'Cals' },
  { key: 'protein', label: 'Prot' }
];

export const DailyView: React.FC<DailyViewProps> = ({ data }) => {
  const [habits, setHabits] = useState<DailyHabits | null>(data.habits);
  const [heatmap, setHeatmap] = useState<any[]>(data.heatmap);
  
  const [ritualDate, setRitualDate] = useState(new Date().toISOString().split('T')[0]);
  const [heatmapDate, setHeatmapDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchHabits = async () => {
      const res = await api.getHabits(ritualDate);
      setHabits(res);
    };
    fetchHabits();
  }, [ritualDate]);

  useEffect(() => {
    const fetchHeatmap = async () => {
      const res = await api.getHeatmap(heatmapDate);
      setHeatmap(res);
    };
    fetchHeatmap();
  }, [heatmapDate]);

  const toggleHabit = async (key: string) => {
    if (!habits) return;
    const newHabits = { ...habits, [key]: !habits[key] };
    setHabits(newHabits);
    try { 
      await api.toggleHabit(key, ritualDate);
      const res = await api.getHeatmap(heatmapDate);
      setHeatmap(res);
    } catch (e) { setHabits(habits); }
  };

  const changeRitualDate = (delta: number) => {
    const d = new Date(ritualDate + 'T12:00:00');
    setRitualDate(format(addDays(d, delta), 'yyyy-MM-dd'));
  };

  const changeHeatmapWeek = (delta: number) => {
    const d = new Date(heatmapDate + 'T12:00:00');
    setHeatmapDate(format(addWeeks(d, delta), 'yyyy-MM-dd'));
  };

  const getCellColor = (value: number) => {
    if (value >= 4) return 'bg-cozy-warm'; 
    if (value >= 1) return 'bg-cozy-accent'; 
    if (value === 0.5) return 'bg-cozy-border'; 
    return 'bg-cozy-bg-alt';
  };

  return (
    <div className="space-y-10 animate-pop">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* Heatmap Card */}
        <div className="lg:col-span-3 bg-cozy-panel p-10 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <h3 className="text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              <span className="noto-emoji text-cozy-gold">{M('✨')}</span>
              Weekly Rhythm
            </h3>
            
            <div className="flex items-center gap-2 bg-cozy-bg-alt rounded-2xl p-2 border-2 border-cozy-border">
              <button onClick={() => changeHeatmapWeek(-1)} className="p-1.5 hover:bg-cozy-panel rounded-xl transition-all"><ChevronLeft size={18} className="text-cozy-accent" /></button>
              <div className="relative flex items-center">
                <input 
                  type="date" 
                  value={heatmapDate} 
                  onChange={(e) => setHeatmapDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-widest px-2 pointer-events-none">
                  Week of {format(new Date(heatmapDate + 'T12:00:00'), 'MMM d')}
                </span>
              </div>
              <button onClick={() => changeHeatmapWeek(1)} className="p-1.5 hover:bg-cozy-panel rounded-xl transition-all"><ChevronRight size={18} className="text-cozy-accent" /></button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex mb-4">
              <div className="w-24"></div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="flex-1 text-center text-[10px] font-bold text-cozy-text-dim uppercase">{day}</div>
              ))}
            </div>
            
            {HEATMAP_ROWS.map(row => (
              <div key={row.key} className="flex items-center">
                <div className="w-24 text-xs font-bold text-cozy-text-muted">{row.label}</div>
                {heatmap && heatmap.length > 0 ? heatmap.map((dayData, idx) => (
                  <div key={idx} className="flex-1 flex justify-center p-1">
                    <div className={`w-10 h-10 rounded-xl transition-all duration-500 border-2 border-cozy-border/30 ${getCellColor(dayData[row.key] || 0)}`} />
                  </div>
                )) : <div className="flex-1 text-center text-cozy-border italic text-xs">Waiting for data...</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Habits Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-cozy-accent p-8 rounded-[2.5rem] text-white shadow-[0_10px_0_0_var(--cozy-accent-dark)] mb-8 relative overflow-hidden">
            <span className="noto-emoji absolute -top-4 -right-4 opacity-20 rotate-12 text-9xl">{M('📅')}</span>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3 mb-1">
                   <span className="noto-emoji">{M('🌿')}</span>
                   Daily Rituals
                </h3>
                <p className="text-cozy-bg-alt text-sm font-bold opacity-80 uppercase tracking-widest">
                  {ritualDate === new Date().toISOString().split('T')[0] ? 'Today' : format(new Date(ritualDate + 'T12:00:00'), 'EEEE')}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-white/20 rounded-xl p-1.5 backdrop-blur-sm border border-white/30">
                <button onClick={() => changeRitualDate(-1)} className="p-1 hover:bg-white/30 rounded-lg transition-all"><ChevronLeft size={16} /></button>
                <div className="relative">
                  <input 
                    type="date" 
                    value={ritualDate} 
                    onChange={(e) => setRitualDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tighter px-1 pointer-events-none">
                    {format(new Date(ritualDate + 'T12:00:00'), 'MMM d')}
                  </span>
                </div>
                <button onClick={() => changeRitualDate(1)} className="p-1 hover:bg-white/30 rounded-lg transition-all"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(HABIT_METADATA).map(key => {
              const meta = HABIT_METADATA[key];
              const isDone = !!habits?.[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleHabit(key)}
                  className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                    isDone 
                      ? 'bg-cozy-panel border-cozy-accent shadow-[0_6px_0_0_var(--cozy-accent)] -translate-y-1' 
                      : 'bg-cozy-panel border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)] hover:border-cozy-text-dim/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDone ? 'bg-cozy-accent/10' : 'bg-cozy-bg-alt'}`}>
                      <span className="noto-emoji text-2xl">{meta.icon}</span>
                    </div>
                    <span className={`font-bold text-lg ${isDone ? 'text-cozy-text' : 'text-cozy-text-muted'}`}>{meta.label}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-cozy-accent border-cozy-accent rotate-0 shadow-inner' : 'border-cozy-border rotate-12'}`}>
                    {isDone ? <span className="noto-emoji text-white text-lg font-bold">{M('✓')}</span> : <span className="noto-emoji text-cozy-border text-lg">{M('○')}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
