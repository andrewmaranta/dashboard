import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { HealthStat, Meal, BloodPressureData, SleepEntry } from '@/types';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar, Cell, ComposedChart
} from 'recharts';
import { ChevronLeft, Star, Activity, Plus, Minus } from 'lucide-react';
import { format, addDays } from 'date-fns';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface HealthViewProps {
  data: {
    healthStats: HealthStat[];
  };
}

const NumberStepper = ({ value, onChange, step = 1, min = 0, max = 999, color = 'text-cozy-text', suffix = '' }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onChange(val);
  };

  return (
    <div className="flex items-center gap-2 bg-cozy-bg-alt/50 border-2 border-transparent rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 w-full focus-within:border-[var(--cozy-accent)] transition-colors">
      <button onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))} className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-cozy-bg/50 transition-colors ${color}`}><Minus size={16} className="sm:w-5 sm:h-5" /></button>
      <div className="flex-1 flex items-center justify-center">
        <input 
          type="number" 
          value={value} 
          onChange={handleChange}
          step={step}
          className={`font-bold text-xl sm:text-2xl ${color} bg-transparent text-center w-full focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        {suffix && <span className="text-xs font-bold text-cozy-text-dim ml-1">{suffix}</span>}
      </div>
      <button onClick={() => onChange(Math.min(max, Number((value + step).toFixed(1))))} className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-cozy-bg/50 transition-colors ${color}`}><Plus size={16} className="sm:w-5 sm:h-5" /></button>
    </div>
  );
};

export const HealthView: React.FC<HealthViewProps> = ({ data }) => {
  const { healthStats } = data;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workoutToday, setWorkoutToday] = useState(false);
  const [bpData, setBpData] = useState<BloodPressureData | null>(null);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showBPModal, setShowBPModal] = useState(false);
  
  // Stats State
  const [weight, setWeight] = useState(healthStats[healthStats.length - 1]?.weight || 0);
  const [bodyFat, setBodyFat] = useState(healthStats[healthStats.length - 1]?.bodyFat || 0);
  
  // Sleep State
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(3);

  // BP State
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(60);
  const [bpNotes, setBpNotes] = useState('');

  const latest = healthStats[healthStats.length - 1] || { weight: '-', bodyFat: '-' };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsData, habitsData] = await Promise.all([
          api.getMeals(selectedDate),
          api.getHabits(selectedDate)
        ]);
        setMeals(mealsData);
        setWorkoutToday(!!habitsData?.workout);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    const fetchBP = async () => {
      try {
        const data = await api.getBloodPressure();
        setBpData(data);
      } catch (e) { console.error(e); }
    };
    const fetchSleep = async () => {
      try {
        const data = await api.getSleep();
        setSleepHistory(data);
      } catch (e) { console.error(e); }
    };
    fetchBP();
    fetchSleep();
  }, []);

  const handleUpdateSleep = async () => {
    try {
      await api.updateSleep(sleepHours, sleepQuality);
      const data = await api.getSleep();
      setSleepHistory(data);
      setShowSleepModal(false);
    } catch (e) { console.error(e); }
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    setSelectedDate(format(addDays(d, delta), 'yyyy-MM-dd'));
  };

  const handleUpdateStats = async () => {
    try {
      await api.updateHealthStats(weight, bodyFat);
      setShowEditModal(false);
    } catch (e) { console.error(e); }
  };

  const handleUpdateBP = async () => {
    try {
      await api.logBloodPressure({ systolic, diastolic, pulse, notes: bpNotes });
      const data = await api.getBloodPressure();
      setBpData(data);
      setShowBPModal(false);
    } catch (e) { console.error(e); }
  };

  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFiber = meals.reduce((sum, m) => sum + (m.fiber || 0), 0);

  const targetCals = workoutToday ? 1700 : 1500;
  const targetProtein = 150;

  return (
    <div className="space-y-6 sm:space-y-10 animate-pop">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-8">
        <div className="lg:col-span-2 bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex justify-around items-center group hover:-translate-y-1 transition-transform">
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1 sm:mb-2">Weight</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="noto-emoji text-xl sm:text-2xl">{M('⚖')}</span>
              <span className="text-xl sm:text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.weight}</span>
            </div>
          </div>
          <div className="w-0.5 h-10 sm:h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1 sm:mb-2">Body Fat</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="noto-emoji text-xl sm:text-2xl">{M('💧')}</span>
              <span className="text-xl sm:text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.bodyFat}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex justify-around items-center group hover:-translate-y-1 transition-transform">
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1 sm:mb-2">Calories</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="noto-emoji text-xl sm:text-2xl">{M('🔥')}</span>
              <span className={`text-xl sm:text-3xl font-bold tracking-tighter ${totalCals > targetCals ? 'text-cozy-warm' : 'text-cozy-accent'}`}>
                {totalCals} <span className="text-sm text-cozy-text-dim font-medium tracking-normal">/ {targetCals}</span>
              </span>
            </div>
          </div>
          <div className="w-0.5 h-10 sm:h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1 sm:mb-2">Protein</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="noto-emoji text-xl sm:text-2xl">{M('⚡')}</span>
              <span className={`text-xl sm:text-3xl font-bold tracking-tighter ${totalProtein >= targetProtein ? 'text-cozy-accent' : 'text-cozy-warm'}`}>
                {totalProtein}<small className="text-xs sm:text-sm">g</small> <span className="text-sm text-cozy-text-dim font-medium tracking-normal">/ {targetProtein}g</span>
              </span>
            </div>
          </div>
          <div className="w-0.5 h-10 sm:h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1 sm:mb-2">Fiber</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="noto-emoji text-xl sm:text-2xl">{M('🌾')}</span>
              <span className={`text-xl sm:text-3xl font-bold tracking-tighter ${totalFiber >= 30 ? 'text-cozy-accent' : 'text-cozy-warm'}`}>{totalFiber}<small className="text-xs sm:text-sm">g</small></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 sm:mb-10 relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark flex items-center gap-2 sm:gap-3">
              <span className="noto-emoji text-xl sm:text-2xl animate-float">{M('🧡')}</span>
              Weight Journey
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--cozy-stat-vitality)]/10 text-[var(--cozy-stat-vitality)] border border-[var(--cozy-stat-vitality)]/20 uppercase tracking-widest ml-1 sm:ml-2">
                +10 VIT
              </span>
            </h3>
            <button 
              onClick={() => setShowEditModal(true)}
              className="cozy-button px-4 py-2 sm:px-6 sm:py-3 !bg-[var(--cozy-stat-vitality)] !shadow-[0_4px_0_0_#d97746] text-xs sm:text-sm"
            >
              Log
            </button>
          </div>
          <div className="h-[250px] sm:h-[360px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={healthStats}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cozy-stat-vitality)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--cozy-stat-vitality)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
                />
                <YAxis 
                  yAxisId="left"
                  domain={['dataMin - 5', 'dataMax + 5']} 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  stroke="var(--cozy-stat-power)" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1rem', boxShadow: '0 4px 0 0 var(--cozy-border)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                  labelStyle={{ color: 'var(--cozy-text-dim)', marginBottom: '2px', fontWeight: 'bold', fontSize: '8px' }}
                  formatter={(value: any, name: any) => [
                    value, 
                    name === 'weight' ? 'Weight' : 'Body Fat'
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold', fontSize: '10px', color: 'var(--cozy-text-muted)' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  name="weight"
                  stroke="var(--cozy-stat-vitality)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={2000}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bodyFat"
                  name="bodyFat"
                  stroke="var(--cozy-stat-power)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--cozy-stat-power)', strokeWidth: 1.5, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={2000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-col">
          <div className="flex flex-col mb-6 sm:mb-8 gap-4">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark flex items-center gap-2 sm:gap-3">
              <span className="noto-emoji text-xl sm:text-2xl">{M('🥣')}</span>
              Nourishment
            </h3>
            
            <div className="flex items-center bg-cozy-bg-alt rounded-xl sm:rounded-2xl p-1.5 border-2 border-cozy-border w-full justify-between hover:border-cozy-accent/50 transition-colors">
              <button onClick={() => changeDate(-1)} className="cozy-button-icon !p-1 sm:!p-1.5 !rounded-xl !bg-transparent hover:!bg-cozy-panel"><ChevronLeft size={18} className="text-cozy-accent" /></button>
              
              <div className="relative flex-1 flex items-center justify-center">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-[10px] sm:text-xs font-bold text-cozy-text-muted uppercase tracking-widest pointer-events-none whitespace-nowrap">
                  {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : format(new Date(selectedDate + 'T12:00:00'), 'MMM d, yyyy')}
                </span>
              </div>
              
              <button onClick={() => changeDate(1)} className="cozy-button-icon !p-1 sm:!p-1.5 !rounded-xl !bg-transparent hover:!bg-cozy-panel rotate-180"><ChevronLeft size={18} className="text-cozy-accent" /></button>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto max-h-[300px] sm:max-h-[400px] pr-2 sm:pr-4 custom-scrollbar">
            {meals.length > 0 ? meals.map((meal, idx) => (
              <div key={idx} className="bg-cozy-bg/60 p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] border-2 border-cozy-border/50 flex justify-between items-center group hover:bg-cozy-panel hover:-translate-y-0.5 transition-all">
                <div className="flex flex-col min-w-0">
                  <span className="text-base sm:text-lg font-bold text-cozy-text truncate">{meal.item}</span>
                  <div className="flex flex-wrap gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 mt-1 sm:mt-2">
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-1 sm:gap-2 bg-cozy-panel px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-[10px] sm:text-xs">{M('🥣')}</span> {meal.calories}</span>
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-1 sm:gap-2 bg-cozy-panel px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-[10px] sm:text-xs">{M('💪')}</span> {meal.protein}g</span>
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-1 sm:gap-2 bg-cozy-panel px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-[10px] sm:text-xs">{M('🌾')}</span> {meal.fiber || 0}g</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-40 sm:h-56 opacity-30">
                <span className="noto-emoji text-4xl sm:text-6xl mb-2 sm:mb-4">{M('🥣')}</span>
                <span className="font-bold text-[10px] sm:text-sm text-cozy-text-muted italic text-center">Empty plate...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleep Graph Section */}
      <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem]">
        <div className="flex justify-between items-center mb-6 sm:mb-10">
          <div className="flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark flex items-center gap-2 sm:gap-3">
              <span className="noto-emoji text-xl sm:text-2xl animate-float">{M('🌙')}</span>
              Sleep & Dreams
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--cozy-stat-knowledge)]/10 text-[var(--cozy-stat-knowledge)] border border-[var(--cozy-stat-knowledge)]/20 uppercase tracking-widest ml-1 sm:ml-2">
                +10 WEL
              </span>
            </h3>
            <span className="text-[10px] sm:text-sm font-bold text-[var(--cozy-stat-knowledge)]/80">
              Last night: {sleepHistory[0]?.hours || '-'} hrs
            </span>
          </div>
          <button 
            onClick={() => setShowSleepModal(true)}
            className="cozy-button px-4 py-2 sm:px-6 sm:py-3 !bg-[var(--cozy-stat-knowledge)] !shadow-[0_4px_0_0_#818cf8] text-xs sm:text-sm"
          >
            Log
          </button>
        </div>
        <div className="h-[200px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...sleepHistory].reverse()}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--cozy-text-dim)" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
              />
              <YAxis 
                stroke="var(--cozy-text-dim)" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1rem', boxShadow: '0 4px 0 0 var(--cozy-border)' }}
                cursor={{ fill: 'var(--cozy-bg-alt)', opacity: 0.4 }}
                labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="hours" 
                radius={[6, 6, 0, 0]}
                fill="var(--cozy-accent)"
              >
                {[...sleepHistory].reverse().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.quality >= 4 ? 'var(--cozy-accent)' : entry.quality >= 3 ? '#818cf8' : 'var(--cozy-warm)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Blood Pressure Section */}
      {bpData && bpData.history && (
        <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem]">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark flex items-center gap-2 sm:gap-3">
              <span className="noto-emoji text-xl sm:text-2xl">{M('🩸')}</span>
              Heart Rate
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-cozy-accent/10 text-cozy-accent border border-cozy-accent/20 uppercase tracking-widest ml-1 sm:ml-2">
                +10 VIT
              </span>
            </h3>
            <button 
              onClick={() => setShowBPModal(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-cozy-warm text-white font-bold rounded-xl sm:rounded-2xl border-2 border-red-500 shadow-[0_4px_0_0_#ef4444] hover:shadow-[0_2px_0_0_#ef4444] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              Log
            </button>
          </div>
          <div className="h-[200px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...bpData.history].reverse()}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
                />
                <YAxis 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[40, 180]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1rem', boxShadow: '0 4px 0 0 var(--cozy-border)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                  labelStyle={{ color: 'var(--cozy-text-dim)', marginBottom: '2px', fontWeight: 'bold', fontSize: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold', fontSize: '10px', color: 'var(--cozy-text-muted)' }} />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="var(--cozy-warm)" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: 'var(--cozy-warm)', strokeWidth: 1.5, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke="var(--cozy-accent)" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: 'var(--cozy-accent)', strokeWidth: 1.5, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Edit Stats Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-8 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-cozy-accent shadow-[0_10px_0_0_var(--cozy-accent)] max-w-[320px] sm:max-w-sm w-full">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark mb-6 sm:mb-10 text-center">Health Stats</h3>
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Weight (lbs)</label>
                <NumberStepper value={weight} onChange={setWeight} step={0.1} color="text-cozy-accent" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Body Fat (%)</label>
                <NumberStepper value={bodyFat} onChange={setBodyFat} step={0.1} color="text-cozy-warm" suffix="%" />
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-12">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 cozy-button-secondary py-3 sm:py-5"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStats}
                className="flex-[2] cozy-button py-3 sm:py-5"
              >
                Save Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Sleep Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-8 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-indigo-400 shadow-[0_10px_0_0_#818cf8] max-w-[320px] sm:max-w-sm w-full">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark mb-6 sm:mb-10 text-center">Log Sleep</h3>
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Hours Slept</label>
                <NumberStepper value={sleepHours} onChange={setSleepHours} step={0.5} color="text-indigo-400" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Quality (1-5)</label>
                <div className="flex justify-between items-center bg-cozy-bg-alt dark:bg-black/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-cozy-border">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button 
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${sleepQuality === q ? 'bg-indigo-400 text-white shadow-lg' : 'text-cozy-text-dim hover:bg-cozy-bg/50'}`}
                    >
                      <Star size={16} className="sm:w-4.5 sm:h-4.5" fill={sleepQuality >= q ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-12">
              <button 
                onClick={() => setShowSleepModal(false)}
                className="flex-1 cozy-button-secondary py-3 sm:py-5"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSleep}
                className="flex-[2] cozy-button py-3 sm:py-5 !bg-[var(--cozy-stat-knowledge)] !shadow-[0_4px_0_0_#818cf8]"
              >
                Save Sleep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Blood Pressure Modal */}
      {showBPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-8 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-cozy-warm shadow-[0_10px_0_0_var(--cozy-warm)] max-w-[320px] sm:max-w-sm w-full">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark mb-6 sm:mb-10 text-center flex items-center justify-center gap-2 sm:gap-3">
              <Activity className="text-cozy-warm" />
              Log Pressure
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3 flex-1">
                  <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Systolic</label>
                  <NumberStepper value={systolic} onChange={setSystolic} step={1} color="text-cozy-warm" />
                </div>
                <div className="space-y-2 sm:space-y-3 flex-1">
                  <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Diastolic</label>
                  <NumberStepper value={diastolic} onChange={setDiastolic} step={1} color="text-cozy-accent" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Pulse (BPM)</label>
                <NumberStepper value={pulse} onChange={setPulse} step={1} color="text-cozy-text-dark" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[10px] sm:text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Notes</label>
                <input 
                  type="text" value={bpNotes}
                  onChange={(e) => setBpNotes(e.target.value)}
                  placeholder="e.g. After coffee"
                  className="cozy-input"
                />
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-12">
              <button 
                onClick={() => setShowBPModal(false)}
                className="flex-1 cozy-button-secondary py-3 sm:py-5"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateBP}
                className="flex-[2] cozy-button py-3 sm:py-5 !bg-[var(--cozy-warm)] !shadow-[0_4px_0_0_#d97746]"
              >
                Save Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
