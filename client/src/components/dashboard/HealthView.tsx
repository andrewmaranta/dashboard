import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { HealthStat, Meal, BloodPressureData, SleepEntry } from '@/types';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, BarChart, Bar, Cell, ComposedChart
} from 'recharts';
import { ChevronLeft, Star, Activity } from 'lucide-react';
import { format, addDays } from 'date-fns';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface HealthViewProps {
  data: {
    healthStats: HealthStat[];
  };
}

export const HealthView: React.FC<HealthViewProps> = ({ data }) => {
  const { healthStats } = data;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [bpData, setBpData] = useState<BloodPressureData | null>(null);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showBPModal, setShowBPModal] = useState(false);
  const [weight, setWeight] = useState(healthStats[healthStats.length - 1]?.weight || 0);
  const [bodyFat, setBodyFat] = useState(healthStats[healthStats.length - 1]?.bodyFat || 0);
  
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(3);

  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(60);
  const [bpNotes, setBpNotes] = useState('');

  const latest = healthStats[healthStats.length - 1] || { weight: '-', bodyFat: '-' };

  useEffect(() => {
    const fetchMeals = async () => {
      const data = await api.getMeals(selectedDate);
      setMeals(data);
    };
    fetchMeals();
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

  return (
    <div className="space-y-10 animate-pop">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Combined Weight & Body Fat Card */}
        <div className="lg:col-span-2 bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex justify-around items-center group hover:-translate-y-1 transition-transform">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-2">Weight</span>
            <div className="flex items-center gap-2">
              <span className="noto-emoji text-2xl">{M('⚖')}</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.weight}</span>
            </div>
          </div>
          <div className="w-0.5 h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-2">Body Fat</span>
            <div className="flex items-center gap-2">
              <span className="noto-emoji text-2xl">{M('💧')}</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.bodyFat}</span>
            </div>
          </div>
        </div>

        {/* Daily Nutrition Summary */}
        <div className="lg:col-span-3 bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex justify-around items-center group hover:-translate-y-1 transition-transform">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-2">Calories</span>
            <div className="flex items-center gap-2">
              <span className="noto-emoji text-2xl">{M('🔥')}</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{totalCals}</span>
            </div>
          </div>
          <div className="w-0.5 h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-2">Protein</span>
            <div className="flex items-center gap-2">
              <span className="noto-emoji text-2xl">{M('⚡')}</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{totalProtein}<small className="text-sm">g</small></span>
            </div>
          </div>
          <div className="w-0.5 h-12 bg-cozy-bg-alt"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-2">Fiber</span>
            <div className="flex items-center gap-2">
              <span className="noto-emoji text-2xl">{M('🌾')}</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{totalFiber}<small className="text-sm">g</small></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)] relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              <span className="noto-emoji text-2xl animate-float">{M('🧡')}</span>
              Weight Journey
            </h3>
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 bg-cozy-accent text-white font-bold rounded-2xl border-2 border-cozy-accent-dark shadow-[0_4px_0_0_var(--cozy-accent-dark)] hover:shadow-[0_2px_0_0_var(--cozy-accent-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all text-sm flex items-center gap-2"
            >
              Log Weight
            </button>
          </div>
          <div className="h-[360px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={healthStats}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cozy-accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--cozy-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
                />
                <YAxis 
                  yAxisId="left"
                  domain={['dataMin - 5', 'dataMax + 5']} 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  stroke="var(--cozy-warm)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1.5rem', boxShadow: '0 8px 0 0 var(--cozy-border)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--cozy-text-dim)', marginBottom: '4px', fontWeight: 'bold', fontSize: '10px' }}
                  formatter={(value: any, name: any) => [
                    value, 
                    name === 'weight' ? 'Weight (lbs)' : 'Body Fat (%)'
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px', color: 'var(--cozy-text-muted)' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  name="weight"
                  stroke="var(--cozy-accent)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={2000}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bodyFat"
                  name="bodyFat"
                  stroke="var(--cozy-warm)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--cozy-warm)', strokeWidth: 2, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={2000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)] flex flex-col">
          <div className="flex flex-col mb-8 gap-4">
            <h3 className="text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              <span className="noto-emoji text-2xl">{M('🥣')}</span>
              Nourishment
            </h3>
            
            <div className="flex items-center bg-cozy-bg-alt rounded-2xl p-1.5 border-2 border-cozy-border w-full justify-between">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-cozy-panel rounded-xl transition-all"><ChevronLeft size={18} className="text-cozy-accent" /></button>
              
              <div className="relative flex-1 flex items-center justify-center">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-xs font-bold text-cozy-text-muted uppercase tracking-widest pointer-events-none whitespace-nowrap">
                  {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : format(new Date(selectedDate + 'T12:00:00'), 'MMMM d, yyyy')}
                </span>
              </div>
              
              <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-cozy-panel rounded-xl transition-all rotate-180"><ChevronLeft size={18} className="text-cozy-accent" /></button>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
            {meals.length > 0 ? meals.map((meal, idx) => (
              <div key={idx} className="bg-cozy-bg/60 p-5 rounded-[2rem] border-2 border-cozy-border/50 flex justify-between items-center group hover:bg-cozy-panel hover:-translate-y-0.5 transition-all">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-cozy-text">{meal.item}</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    <span className="text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-2 bg-cozy-panel px-3 py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-xs">{M('🥣')}</span> {meal.calories}</span>
                    <span className="text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-2 bg-cozy-panel px-3 py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-xs">{M('💪')}</span> {meal.protein}g</span>
                    <span className="text-[10px] uppercase font-bold text-cozy-text-dim flex items-center gap-2 bg-cozy-panel px-3 py-1 rounded-full border border-cozy-border"><span className="noto-emoji text-xs">{M('🌾')}</span> {meal.fiber || 0}g</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-56 opacity-30">
                <span className="noto-emoji text-6xl mb-4">{M('🥣')}</span>
                <span className="font-bold text-cozy-text-muted italic text-center">No meals found for this day</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleep Graph Section */}
      <div className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)]">
        <div className="flex justify-between items-center mb-10">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              <span className="noto-emoji text-2xl animate-float">{M('🌙')}</span>
              Sleep & Dreams
            </h3>
            <span className="text-sm font-bold text-indigo-400/80">
              Last night: {sleepHistory[0]?.hours || '-'} hrs
            </span>
          </div>
          <button 
            onClick={() => setShowSleepModal(true)}
            className="px-6 py-3 bg-indigo-400 text-white font-bold rounded-2xl border-2 border-indigo-500 shadow-[0_4px_0_0_#6366f1] hover:bg-indigo-500 hover:shadow-[0_2px_0_0_#6366f1] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all text-sm flex items-center gap-2"
          >
            Log Sleep
          </button>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...sleepHistory].reverse()}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--cozy-text-dim)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
              />
              <YAxis 
                stroke="var(--cozy-text-dim)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1.5rem', boxShadow: '0 8px 0 0 var(--cozy-border)' }}
                cursor={{ fill: 'var(--cozy-bg-alt)', opacity: 0.4 }}
              />
              <Bar 
                dataKey="hours" 
                radius={[10, 10, 0, 0]}
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
        <div className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-bold text-cozy-text-dark flex items-center gap-3">
              <span className="noto-emoji text-2xl">{M('🩸')}</span>
              Blood Pressure History
            </h3>
            <button 
              onClick={() => setShowBPModal(true)}
              className="px-6 py-3 bg-cozy-warm text-white font-bold rounded-2xl border-2 border-red-500 shadow-[0_4px_0_0_#ef4444] hover:shadow-[0_2px_0_0_#ef4444] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all text-sm flex items-center gap-2"
            >
              Log Reading
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...bpData.history].reverse()}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--cozy-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => format(new Date(val + 'T12:00:00'), 'MMM d')}
                />
                <YAxis 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[40, 180]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1.5rem', boxShadow: '0 8px 0 0 var(--cozy-border)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--cozy-text-dim)', marginBottom: '4px', fontWeight: 'bold', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px', color: 'var(--cozy-text-muted)' }} />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="var(--cozy-warm)" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'var(--cozy-warm)', strokeWidth: 2, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke="var(--cozy-accent)" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'var(--cozy-accent)', strokeWidth: 2, stroke: 'var(--cozy-panel)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
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
          <div className="bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-cozy-accent shadow-[0_20px_0_0_var(--cozy-accent)] max-w-sm w-full">
            <h3 className="text-2xl font-bold text-cozy-text-dark mb-10 text-center">Update Health Stats</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Weight (lbs)</label>
                <input 
                  type="number" step="0.1" value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent text-2xl transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Body Fat (%)</label>
                <input 
                  type="number" step="0.1" value={bodyFat}
                  onChange={(e) => setBodyFat(parseFloat(e.target.value))}
                  className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 text-cozy-warm font-bold focus:outline-none focus:border-cozy-warm text-2xl transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={handleUpdateStats}
                className="flex-1 bg-cozy-accent text-white font-bold py-5 rounded-2xl shadow-[0_6px_0_0_var(--cozy-accent-dark)] active:shadow-none active:translate-y-1 transition-all"
              >
                Save
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-cozy-panel border-2 border-cozy-border text-cozy-text-dim font-bold py-5 rounded-2xl shadow-[0_6px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Sleep Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-indigo-400 shadow-[0_20px_0_0_#818cf8] max-w-sm w-full">
            <h3 className="text-2xl font-bold text-cozy-text-dark mb-10 text-center">Log Night's Rest</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Hours Slept</label>
                <input 
                  type="number" step="0.5" value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 text-indigo-400 font-bold focus:outline-none focus:border-indigo-400 text-2xl transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Quality (1-5)</label>
                <div className="flex justify-between items-center bg-cozy-bg-alt p-4 rounded-2xl border-2 border-cozy-border">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button 
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${sleepQuality === q ? 'bg-indigo-400 text-white shadow-lg' : 'text-cozy-text-dim hover:bg-white'}`}
                    >
                      <Star size={18} fill={sleepQuality >= q ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={handleUpdateSleep}
                className="flex-1 bg-indigo-400 text-white font-bold py-5 rounded-2xl shadow-[0_6px_0_0_#6366f1] active:shadow-none active:translate-y-1 transition-all"
              >
                Save
              </button>
              <button 
                onClick={() => setShowSleepModal(false)}
                className="flex-1 bg-cozy-panel border-2 border-cozy-border text-cozy-text-dim font-bold py-5 rounded-2xl shadow-[0_6px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Blood Pressure Modal */}
      {showBPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-cozy-warm shadow-[0_20px_0_0_var(--cozy-warm)] max-w-sm w-full">
            <h3 className="text-2xl font-bold text-cozy-text-dark mb-10 text-center flex items-center justify-center gap-3">
              <Activity className="text-cozy-warm" />
              Log Pressure
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="space-y-3 flex-1">
                  <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Systolic</label>
                  <input 
                    type="number" value={systolic}
                    onChange={(e) => setSystolic(parseInt(e.target.value))}
                    className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-4 py-4 text-cozy-warm font-bold focus:outline-none focus:border-cozy-warm text-2xl transition-colors text-center"
                  />
                </div>
                <div className="space-y-3 flex-1">
                  <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Diastolic</label>
                  <input 
                    type="number" value={diastolic}
                    onChange={(e) => setDiastolic(parseInt(e.target.value))}
                    className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-4 py-4 text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent text-2xl transition-colors text-center"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Pulse (BPM)</label>
                <input 
                  type="number" value={pulse}
                  onChange={(e) => setPulse(parseInt(e.target.value))}
                  className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 text-cozy-text-dark font-bold focus:outline-none focus:border-cozy-border text-2xl transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">Notes (Optional)</label>
                <input 
                  type="text" value={bpNotes}
                  onChange={(e) => setBpNotes(e.target.value)}
                  placeholder="e.g. After coffee"
                  className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 text-cozy-text font-bold focus:outline-none focus:border-cozy-border transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={handleUpdateBP}
                className="flex-1 bg-cozy-warm text-white font-bold py-5 rounded-2xl shadow-[0_6px_0_0_#ef4444] active:shadow-none active:translate-y-1 transition-all"
              >
                Save
              </button>
              <button 
                onClick={() => setShowBPModal(false)}
                className="flex-1 bg-cozy-panel border-2 border-cozy-border text-cozy-text-dim font-bold py-5 rounded-2xl shadow-[0_6px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
