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

const HABIT_METADATA: Record<string, { label: string, icon: string, color: string, xpType: string, xpAmount: number }> = {
  workout: { label: 'Training', icon: M('🌿'), color: 'text-emerald-500', xpType: 'PWR', xpAmount: 10 },
  read20Min: { label: 'Reading', icon: M('📖'), color: 'text-orange-400', xpType: 'KNW', xpAmount: 10 },
  digitalSunset: { label: 'Sunset', icon: M('🌙'), color: 'text-indigo-400', xpType: 'WEL', xpAmount: 10 },
  socialInteraction: { label: 'Social', icon: M('🤝'), color: 'text-pink-400', xpType: 'SOC', xpAmount: 10 },
  medication: { label: 'Health', icon: M('💊'), color: 'text-cyan-400', xpType: 'VIT', xpAmount: 10 }
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
  
  const [ritualDate, setRitualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [heatmapDate, setHeatmapDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
    
    let note = undefined;
    
    // Cycle logic for workout
    if (key === 'workout') {
      const types = ['10k Steps', 'Cardio', 'Weightlifting', 'Rest Day'];
      const currentType = habits.workoutType;
      
      if (!habits.workout) {
        // Off -> First type
        note = types[0];
      } else {
        // Find current index
        const idx = types.indexOf(currentType || '');
        if (idx === -1 || idx === types.length - 1) {
          // Last type or unknown -> Off
          // Pass currentType to toggle it OFF
          note = currentType || 'Logged via Dashboard';
        } else {
          // Next type
          note = types[idx + 1];
        }
      }
    }

    // Optimistic update
    const newHabits = { ...habits, [key]: !habits[key] };
    // If we're just updating the note (staying ON), keep it true
    if (key === 'workout' && note && habits.workout && note !== habits.workoutType) {
        newHabits.workout = true;
        newHabits.workoutType = note;
    } else if (key === 'workout' && !habits.workout) {
        newHabits.workout = true;
        newHabits.workoutType = note;
    } else if (key === 'workout') {
        newHabits.workout = false;
        newHabits.workoutType = undefined;
    }

    setHabits(newHabits);
    try { 
      await api.toggleHabit(key, ritualDate, note);
      const res = await api.getHeatmap(heatmapDate);
      setHeatmap(res);
      // Refresh habits to get canonical state
      const fresh = await api.getHabits(ritualDate);
      setHabits(fresh);
    } catch (e) { 
        console.error(e);
        // Revert on error
        const fresh = await api.getHabits(ritualDate);
        setHabits(fresh);
    }
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
    // 0 = empty/fail
    // 0.5 = partial (for nutrition)
    // >= 1 = streak count
    
    if (value === 0) return '#f1ede3'; 
    if (value === 0.5) return '#e2ddd2'; 
    
    // Color points for every 10 days
    const colorPoints = [
      { r: 141, g: 160, b: 142 }, // 0-10: Sage Green (#8da08e)
      { r: 214, g: 128, b: 96 },  // 10: Terracotta (#d68060)
      { r: 233, g: 196, b: 106 }, // 20: Gold (#e9c46a)
      { r: 129, g: 140, b: 248 }, // 30: Indigo (#818cf8)
      { r: 251, g: 113, b: 133 }, // 40: Rose (#fb7185)
      { r: 20, g: 184, b: 166 }   // 50+: Teal (#14b8a6)
    ];

    // Determine which 10-day bracket we are in (0-4)
    const bracket = Math.min(Math.floor((value - 1) / 10), colorPoints.length - 2);
    const nextBracket = bracket + 1;
    
    // Calculate ratio within the 10-day bracket (0 to 1)
    const ratio = ((value - 1) % 10) / 10;
    
    const start = colorPoints[bracket];
    const end = colorPoints[nextBracket];
    
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-pop">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-10">
        
        {/* Heatmap Card */}
        <div className="lg:col-span-3 bg-cozy-panel p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)] overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              Weekly Rhythm
            </h3>
            
            <div className="flex items-center gap-2 bg-cozy-bg-alt rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border-2 border-cozy-border w-full sm:w-auto justify-between sm:justify-start">
              <button onClick={() => changeHeatmapWeek(-1)} className="p-1 sm:p-1.5 hover:bg-cozy-panel rounded-xl transition-all"><ChevronLeft size={18} className="text-cozy-accent" /></button>
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
              <button onClick={() => changeHeatmapWeek(1)} className="p-1 sm:p-1.5 hover:bg-cozy-panel rounded-xl transition-all"><ChevronRight size={18} className="text-cozy-accent" /></button>
            </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="min-w-[450px] space-y-2 sm:space-y-3">
              <div className="flex mb-4">
                <div className="w-20 sm:w-24"></div>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="flex-1 text-center text-[10px] font-bold text-cozy-text-dim uppercase">{day}</div>
                ))}
              </div>
              
              {HEATMAP_ROWS.map(row => (
                <div key={row.key} className="flex items-center">
                  <div className="w-20 sm:w-24 text-[10px] sm:text-xs font-bold text-cozy-text-muted">{row.label}</div>
                  {heatmap && heatmap.length > 0 ? heatmap.map((dayData, idx) => (
                    <div key={idx} className="flex-1 flex justify-center p-0.5 sm:p-1 group relative">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all duration-500 border-2 border-cozy-border/30" 
                        style={{ backgroundColor: getCellColor(dayData[row.key] || 0) }}
                      />
                      
                      {/* Tooltip for Workout Notes */}
                      {row.key === 'workout' && dayData.streaks?.workoutNote && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                          <div className="bg-cozy-text-dark text-cozy-bg px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border border-cozy-border">
                            {dayData.streaks.workoutNote}
                          </div>
                          <div className="w-2 h-2 bg-cozy-text-dark rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                        </div>
                      )}
                    </div>
                  )) : <div className="flex-1 text-center text-cozy-border italic text-xs">Waiting for data...</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Habits Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-cozy-accent p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-white shadow-[0_10px_0_0_var(--cozy-accent-dark)] mb-6 sm:mb-8 relative overflow-hidden">
            <span className="noto-emoji absolute -top-4 -right-4 opacity-20 rotate-12 text-7xl sm:text-9xl animate-float">{M('📅')}</span>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3 mb-1">
                   <span className="noto-emoji">{M('🌿')}</span>
                   Daily Rituals
                </h3>
                <p className="text-cozy-bg-alt text-[10px] sm:text-sm font-bold opacity-80 uppercase tracking-widest">
                  {ritualDate === new Date().toISOString().split('T')[0] ? 'Today' : format(new Date(ritualDate + 'T12:00:00'), 'EEEE')}
                </p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-white/20 rounded-xl p-1 sm:p-1.5 backdrop-blur-sm border border-white/30">
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

          <div className="space-y-3 sm:space-y-4">
            {Object.keys(HABIT_METADATA).map(key => {
              const meta = HABIT_METADATA[key];
              const isDone = !!habits?.[key];
              const displayLabel = (key === 'workout' && habits?.workoutType) ? habits.workoutType : meta.label;
              
              return (
                <button
                  key={key}
                  onClick={() => toggleHabit(key)}
                  className={`w-full flex items-center justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all ${
                    isDone 
                      ? 'bg-cozy-panel border-cozy-accent shadow-[0_6px_0_0_var(--cozy-accent)] -translate-y-1' 
                      : 'bg-cozy-panel border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--cozy-border)] hover:border-cozy-text-dim/30'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${isDone ? 'bg-cozy-accent/10' : 'bg-cozy-bg-alt'}`}>
                      <span className="noto-emoji text-xl sm:text-2xl">{meta.icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`font-bold text-base sm:text-lg ${isDone ? 'text-cozy-text' : 'text-cozy-text-muted'}`}>{displayLabel}</span>
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-cozy-accent/10 text-cozy-accent border border-cozy-accent/20 uppercase tracking-widest mt-1">
                        +{meta.xpAmount} {meta.xpType}
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-cozy-accent border-cozy-accent rotate-0 shadow-inner' : 'border-cozy-border rotate-12'}`}>
                    {isDone ? <span className="noto-emoji text-white text-base sm:text-lg font-bold">{M('✓')}</span> : <span className="noto-emoji text-cozy-border text-base sm:text-lg">{M('○')}</span>}
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
