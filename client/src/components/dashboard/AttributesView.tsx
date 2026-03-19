import React from 'react';
import { api } from '@/services/api';
import { Attributes, HealthStat, Task, DailyHabits, FinanceData } from '@/types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import { Lightbulb, Database, Activity, Coins, Star } from 'lucide-react';
import { DataExplorerView } from './DataExplorerView';
import { FinanceView } from './FinanceView';
import { HighlightReelView } from './HighlightReelView';

const M = (emoji: string) => `${emoji}\uFE0E`;

const ATTRIBUTE_METADATA: Record<string, { label: string, icon: string, color: string, bg: string, text: string }> = {
  PWR: { label: 'Power', icon: M('💪'), color: 'text-orange-500', bg: 'bg-orange-500/10', text: '#f97316' },
  DSC: { label: 'Discipline', icon: M('⚒'), color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: '#eab308' },
  VIT: { label: 'Vitality', icon: M('🧡'), color: 'text-rose-400', bg: 'bg-rose-400/10', text: '#fb7185' },
  KNW: { label: 'Knowledge', icon: M('📖'), color: 'text-indigo-400', bg: 'bg-indigo-400/10', text: '#818cf8' },
  WEL: { label: 'Wellness', icon: M('🧘'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: '#10b981' },
  SOC: { label: 'Social', icon: M('🤝'), color: 'text-amber-500', bg: 'bg-amber-500/10', text: '#f59e0b' }
};

const ATTRIBUTE_DESCRIPTIONS: Record<string, { theme: string, covers: string[], examples: string[] }> = {
  PWR: {
    theme: 'Physical strength, endurance, and athletic capacity.',
    covers: ['Structured exercise and workouts', 'Strength training', 'Cardio and endurance', 'Physical challenges'],
    examples: ['Weightlifting session', 'Running, cycling, swimming', 'Bodyweight workouts', 'Sports participation']
  },
  DSC: {
    theme: 'Self-governance, life maintenance, and follow-through.',
    covers: ['Financial management', 'Home maintenance and cleaning', 'Administrative tasks', 'Consistency in boring-but-necessary tasks'],
    examples: ['Budgeting', 'Cleaning and organizing', 'Doing laundry or dishes', 'Paying bills on time']
  },
  VIT: {
    theme: 'Bodily health, nutrition, and medical self-care.',
    covers: ['Nutrition and eating habits', 'Medical adherence', 'Body metrics (weight, BP)', 'Preventive care'],
    examples: ['Logging meals', 'Taking medication', 'Weighing in', 'Blood pressure checks']
  },
  KNW: {
    theme: 'Intellectual growth, learning, and focused work.',
    covers: ['Reading and studying', 'Deep focus sessions', 'Skill acquisition', 'Creative/technical projects'],
    examples: ['Reading 20+ minutes', 'Pomodoro/focus sessions', 'Learning a new skill', 'Writing or coding']
  },
  WEL: {
    theme: 'Mental health, recovery, and psychological boundaries.',
    covers: ['Sleep quality', 'Stress management', 'Digital boundaries', 'Mindfulness and meditation'],
    examples: ['Getting adequate sleep', 'Digital sunset (off screens)', 'Meditation or breathwork', 'Journaling']
  },
  SOC: {
    theme: 'Relationships, community, and social connection.',
    covers: ['Intentional social interaction', 'Relationship maintenance', 'Community participation', 'Communication skills'],
    examples: ['Meeting friends/family', 'Calling someone to catch up', 'Attending social events', 'Active listening']
  }
};

interface AttributesViewProps {
  data: {
    attributes: Attributes;
    healthStats: HealthStat[];
    tasks: Task[];
    habits: DailyHabits;
    finance: FinanceData;
  };
}

export const AttributesView: React.FC<AttributesViewProps> = ({ data }) => {
  const { attributes, finance } = data;
  const [insights, setInsights] = React.useState<any[]>([]);
  const [view, setView] = React.useState<'stats' | 'insights' | 'vault' | 'density' | 'wealth' | 'savor'>('stats');
  const [selectedAttr, setSelectedAttr] = React.useState<string | null>(null);
  const [stateLogs, setStateLogs] = React.useState<any[]>([]);
  
  const [timeframe, setTimeframe] = React.useState<'1M' | '6M' | '1Y'>('1M');

  React.useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.getInsights();
        setInsights(res);
      } catch (e) { console.error(e); }
    };
    fetchInsights();
  }, []);

  React.useEffect(() => {
    if (view === 'density' || selectedAttr) {
      fetchStateLogs();
    }
  }, [view, selectedAttr, timeframe]);

  const fetchStateLogs = async () => {
    try {
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === '1M') startDate.setMonth(now.getMonth() - 1);
      else if (timeframe === '6M') startDate.setMonth(now.getMonth() - 6);
      else if (timeframe === '1Y') startDate.setFullYear(now.getFullYear() - 1);
      
      const logs = await api.getStateLogs(selectedAttr || undefined, startDate.toISOString());
      setStateLogs(logs);
    } catch (e) { console.error(e); }
  };

  const chartData = Object.keys(ATTRIBUTE_METADATA).map(key => {
    const attr = attributes[key] || { score: 1 };
    return {
      subject: key,
      A: Math.max(0, (attr.score - 1) * 10 + 20), 
      fullMark: 100,
    };
  });

  return (
    <div className="space-y-8 sm:space-y-12 animate-pop max-w-5xl mx-auto pb-8 sm:pb-12">
      
      {/* Sub-Nav Toggle */}
      <div className="flex justify-center">
        <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-wrap justify-center gap-1 sm:gap-2">
          <button 
            onClick={() => setView('stats')}
            className={`
              px-4 py-2 sm:px-6 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm
              ${view === 'stats' ? 'cozy-button !scale-105' : 'cozy-button-ghost'}
            `}
          >
            <Activity size={16} />
            Stats
          </button>
          <button 
            onClick={() => setView('density')}
            className={`
              px-4 py-2 sm:px-6 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm
              ${view === 'density' ? 'cozy-button !bg-cozy-gold !shadow-[0_4px_0_0_#dcb346] !scale-105' : 'cozy-button-ghost'}
            `}
          >
            <Database size={16} />
            Density
          </button>
          <button 
            onClick={() => setView('wealth')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] active:translate-y-1 flex items-center gap-2 ${
              view === 'wealth' 
                ? 'bg-emerald-500 text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Coins size={16} />
            Wealth
          </button>
          <button 
            onClick={() => setView('savor')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] active:translate-y-1 flex items-center gap-2 ${
              view === 'savor' 
                ? 'bg-cozy-gold text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Star size={16} />
            Savor
          </button>
          <button 
            onClick={() => setView('insights')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] active:translate-y-1 flex items-center gap-2 ${
              view === 'insights' 
                ? 'bg-cozy-accent text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Lightbulb size={16} />
            Insights
          </button>
          <button 
            onClick={() => setView('vault')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] active:translate-y-1 flex items-center gap-2 ${
              view === 'vault' 
                ? 'bg-cozy-accent text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Database size={16} />
            Vault
          </button>
        </div>
      </div>

      {view === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          {/* Radar Chart Section */}
          <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] aspect-square flex items-center justify-center relative overflow-hidden group max-w-md mx-auto w-full">
            <div className="absolute inset-0 bg-cozy-bg-alt/20 transition-all group-hover:bg-cozy-bg-alt/40"></div>
            
            <div className="relative z-10 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="var(--cozy-border)" strokeWidth={2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--cozy-text-muted)', fontSize: 12, fontWeight: 'bold' }} />
                  <Radar
                    name="Attributes"
                    dataKey="A"
                    stroke="var(--cozy-accent)"
                    strokeWidth={4}
                    fill="var(--cozy-accent)"
                    fillOpacity={0.2}
                    animationDuration={1500}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-6 sm:mb-10 text-center lg:text-left px-2">
               <h3 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark">Growth Progress</h3>
               <p className="text-cozy-text-dim font-bold text-[10px] sm:text-sm uppercase tracking-widest mt-1 sm:mt-2">Nurture your potential</p>
            </div>

            {Object.keys(ATTRIBUTE_METADATA).map(key => {
              const meta = ATTRIBUTE_METADATA[key];
              const attr = attributes[key] || { score: 1, xp: 0, max: 100 };
              const progress = (attr.xp / attr.max) * 100;

              return (
                <div 
                  key={key} 
                  onClick={() => setSelectedAttr(key)}
                  className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex items-center gap-4 sm:gap-6 group hover:-translate-y-1 transition-all hover:border-cozy-accent cursor-pointer active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${meta.bg} rounded-xl sm:rounded-[1.3rem] border-2 border-transparent flex items-center justify-center relative group-hover:scale-105 transition-all flex-shrink-0`}>
                     <span className="noto-emoji text-2xl sm:text-4xl block leading-none">{meta.icon}</span>
                     <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 bg-cozy-accent rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-lg border-2 border-white dark:border-cozy-panel">
                       {attr.score}
                     </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-end px-1">
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-bold text-cozy-text tracking-tight">{meta.label}</span>
                        <span className="text-[8px] sm:text-[10px] text-cozy-text-dim font-bold uppercase tracking-widest">{key} EXP</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-cozy-accent font-mono">
                        {attr.xp}/{attr.max}
                      </span>
                    </div>
                    
                    <div className="h-3 sm:h-4 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-0.5 sm:p-1">
                      <div 
                        className="h-full rounded-full transition-all duration-2000 shadow-sm"
                        style={{ 
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #8da08e 0%, #e9c46a 50%, #d68060 100%)',
                          backgroundSize: `${100 * (100/Math.max(progress, 1))}% 100%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'density' && (
        <div className="animate-pop space-y-8">
          <div className="mb-6 sm:mb-10 text-center px-2 flex flex-col items-center gap-4">
             <div>
               <h3 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark">Trait Distributions</h3>
               <p className="text-cozy-text-dim font-bold text-[10px] sm:text-sm uppercase tracking-widest mt-1 sm:mt-2 italic">
                 Personality as a density distribution of states ({stateLogs.length} logs)
               </p>
             </div>
             
             <div className="bg-cozy-panel p-1 rounded-xl border border-cozy-border inline-flex">
               {(['1M', '6M', '1Y'] as const).map(tf => (
                 <button
                   key={tf}
                   onClick={() => setTimeframe(tf)}
                   className={`
                     px-3 py-1 rounded-lg text-xs
                     ${timeframe === tf ? 'cozy-button !shadow-sm !py-1' : 'cozy-button-ghost !py-1'}
                   `}
                 >
                   {tf}
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.keys(ATTRIBUTE_METADATA).map(key => {
              const meta = ATTRIBUTE_METADATA[key];
              const logs = stateLogs.filter(l => l.attribute_code === key);
              
              // Calculate Real-Time Mean (Whole Trait Theory)
              const totalIntensity = logs.reduce((sum, log) => sum + log.value, 0);
              const meanIntensity = logs.length > 0 ? (totalIntensity / logs.length).toFixed(1) : '-.-';
              
              // Histogram Logic
              const buckets = new Array(11).fill(0);
              logs.forEach(l => buckets[l.value]++);
              const maxBucket = Math.max(...buckets, 1);

              return (
                <div key={key} className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="noto-emoji text-2xl">{meta.icon}</span>
                      <span className="text-lg font-bold text-cozy-text-dark">{meta.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-black text-cozy-text-dim uppercase tracking-widest">Current Mean</span>
                      <span className="block text-lg font-bold text-cozy-accent">{meanIntensity} <span className="text-xs text-cozy-text-muted">/ 10</span></span>
                    </div>
                  </div>

                  <div className="h-32 flex items-end gap-1 px-2 border-b-2 border-cozy-border pb-1 relative">
                    {buckets.slice(1).map((val, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-sm transition-all cursor-help group relative z-10 min-h-[4px] ${
                          val > 0 ? 'bg-cozy-accent hover:bg-cozy-accent-dark' : 'bg-cozy-bg-alt/50 hover:bg-cozy-bg-alt'
                        }`}
                        style={{ height: `${val > 0 ? (val / maxBucket) * 100 : 0}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cozy-text-dark text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 shadow-lg">
                          {val} logs at intensity {i+1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-cozy-text-dim uppercase tracking-tighter px-1">
                    <span>Low Intensity</span>
                    <span>High Intensity</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'wealth' && <FinanceView data={{ financeData: finance }} />}
      {view === 'savor' && <HighlightReelView />}

      {view === 'insights' && (
        <div className="animate-pop">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-2">
            <div className="p-2 sm:p-3 bg-cozy-gold/10 rounded-xl sm:rounded-2xl border-2 border-cozy-gold/20 text-cozy-gold animate-float">
              <Lightbulb size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark">Growth Insights</h3>
              <p className="text-cozy-text-dim font-bold text-[10px] sm:text-sm uppercase tracking-widest mt-1">Patterns from your journey</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {insights.map((insight, idx) => (
              <div key={idx} className={`bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-sm hover:border-cozy-accent transition-all group`}>
                <div className="flex items-start gap-4 sm:gap-6">
                   <div className={`w-12 h-12 sm:w-16 sm:h-16 ${insight.icon === '⏳' ? 'bg-cozy-warm/10 text-cozy-warm' : 'bg-cozy-accent/10 text-cozy-accent'} rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                     <span className="noto-emoji text-2xl sm:text-3xl">{M(insight.icon)}</span>
                   </div>
                   <div>
                     <h4 className="text-base sm:text-lg font-bold text-cozy-text-dark mb-1 sm:mb-2">{insight.title}</h4>
                     <p className="text-xs sm:text-sm text-cozy-text-muted leading-relaxed italic" dangerouslySetInnerHTML={{ 
                       __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                     }} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'vault' && <DataExplorerView />}

      {/* Attribute Detail Modal */}
      {selectedAttr && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-cozy-bg/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedAttr(null)}
        >
          <div 
            className="bg-cozy-panel w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] border-2 border-cozy-border shadow-[0_20px_0_0_var(--cozy-border)] overflow-hidden animate-pop"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
              {/* Header */}
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 ${ATTRIBUTE_METADATA[selectedAttr].bg} rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center`}>
                  <span className="noto-emoji text-4xl sm:text-5xl">{ATTRIBUTE_METADATA[selectedAttr].icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark">{ATTRIBUTE_METADATA[selectedAttr].label}</h3>
                  <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${ATTRIBUTE_METADATA[selectedAttr].color}`}>
                    Attribute Dimension
                  </p>
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-cozy-text-dim">Focus</h4>
                <p className="text-sm sm:text-base text-cozy-text italic font-bold leading-relaxed">
                  "{ATTRIBUTE_DESCRIPTIONS[selectedAttr].theme}"
                </p>
              </div>

              <button 
                onClick={() => setSelectedAttr(null)}
                className="w-full cozy-button py-4 sm:py-5 mt-4 text-sm sm:text-base"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
