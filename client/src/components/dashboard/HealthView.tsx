import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { HealthStat, Meal } from '@/types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ChevronLeft } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [weight, setWeight] = useState(healthStats[healthStats.length - 1]?.weight || 0);
  const [bodyFat, setBodyFat] = useState(healthStats[healthStats.length - 1]?.bodyFat || 0);

  const latest = healthStats[healthStats.length - 1] || { weight: '-', bodyFat: '-' };

  useEffect(() => {
    const fetchMeals = async () => {
      const data = await api.getMeals(selectedDate);
      setMeals(data);
    };
    fetchMeals();
  }, [selectedDate]);

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

  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFiber = meals.reduce((sum, m) => sum + (m.fiber || 0), 0);

  return (
    <div className="space-y-10 animate-pop">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Weight Card */}
        <div className="bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex justify-between items-center group hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cozy-bg-alt rounded-3xl flex items-center justify-center border-2 border-cozy-border group-hover:bg-cozy-accent group-hover:border-cozy-accent transition-all text-cozy-accent group-hover:text-white">
              <span className="noto-emoji text-3xl">{M('⚖')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1">Body Weight</span>
              <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.weight} <span className="text-sm font-bold text-cozy-text-dim">lbs</span></span>
            </div>
          </div>
          <button onClick={() => setShowEditModal(true)} className="p-4 bg-cozy-bg-alt hover:bg-cozy-accent/10 rounded-2xl border-2 border-cozy-border text-cozy-text-dim hover:text-cozy-accent transition-all">
             <span className="noto-emoji text-xl">{M('📝')}</span>
          </button>
        </div>

        {/* Body Fat Card */}
        <div className="bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex items-center group hover:-translate-y-1 transition-transform gap-6">
          <div className="w-16 h-16 bg-cozy-bg-alt rounded-3xl flex items-center justify-center border-2 border-cozy-border group-hover:bg-cozy-warm group-hover:border-cozy-warm transition-all text-cozy-warm group-hover:text-white">
            <span className="noto-emoji text-3xl">{M('💧')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-cozy-text-dim uppercase tracking-widest font-bold mb-1">Body Fat</span>
            <span className="text-3xl font-bold text-cozy-text-dark tracking-tighter">{latest.bodyFat} <span className="text-sm font-bold text-cozy-text-dim">%</span></span>
          </div>
        </div>

        {/* Daily Nutrition Summary */}
        <div className="lg:col-span-2 bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex justify-around items-center group hover:-translate-y-1 transition-transform">
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
          <h3 className="text-2xl font-bold text-cozy-text-dark mb-10 flex items-center gap-3 relative z-10">
            <span className="noto-emoji text-2xl">{M('🧡')}</span>
            Weight Journey
          </h3>
          <div className="h-[360px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthStats}>
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
                  domain={['dataMin - 5', 'dataMax + 5']} 
                  stroke="var(--cozy-text-dim)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--cozy-panel)', border: '2px solid var(--cozy-border)', borderRadius: '1.5rem', boxShadow: '0 8px 0 0 var(--cozy-border)' }}
                  itemStyle={{ color: 'var(--cozy-accent)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--cozy-text-dim)', marginBottom: '4px', fontWeight: 'bold', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="var(--cozy-accent)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={2000}
                />
              </AreaChart>
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
    </div>
  );
};
