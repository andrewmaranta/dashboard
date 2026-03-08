import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Sparkles, Star, Zap, Award } from 'lucide-react';

const M = (emoji: string) => `${emoji}\uFE0E`;

export const HighlightReelView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.getSavoringData();
      setData(res);
    } catch (e) { console.error(e); } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-cozy-text-dim">Loading your highlights...</div>;
  }

  return (
    <div className="space-y-8 animate-pop max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-cozy-gold/10 rounded-full mb-2">
          <Star size={48} className="text-cozy-gold fill-cozy-gold" />
        </div>
        <h2 className="text-3xl font-bold text-cozy-text-dark">Enactive Mastery Reel</h2>
        <p className="text-cozy-text-dim font-bold text-sm uppercase tracking-widest max-w-lg mx-auto">
          Combat negative priors by reviewing your successes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hard Completed Quests */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Award className="text-cozy-accent" size={24} />
            <h3 className="text-xl font-bold text-cozy-text-dark">Mastery Moments</h3>
          </div>
          {data?.completedTasks?.length > 0 ? (
            data.completedTasks.map((task: any) => (
              <div key={task.id} className="bg-cozy-panel p-5 rounded-2xl border-2 border-cozy-border shadow-sm flex items-start gap-4">
                <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  task.difficulty === 'epic' ? 'bg-purple-500/20 text-purple-600' : 'bg-orange-500/20 text-orange-600'
                }`}>
                  {task.difficulty === 'epic' ? M('🔥') : M('⚡')}
                </div>
                <div>
                  <p className="font-bold text-cozy-text">{task.text}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-cozy-text-dim mt-2">
                    {new Date(task.completed_at).toLocaleDateString()} • {task.attribute} • {task.difficulty}
                  </p>
                </div>
              </div>
            ))
          ) : (
             <div className="p-6 border-2 border-dashed border-cozy-border rounded-2xl text-center">
               <p className="text-sm font-bold text-cozy-text-dim italic">No hard/epic quests completed recently.</p>
             </div>
          )}
        </div>

        {/* Streaks */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6 px-2">
              <Zap className="text-cozy-gold" size={24} />
              <h3 className="text-xl font-bold text-cozy-text-dark">Top Consistencies</h3>
            </div>
            {data?.topStreaks?.length > 0 ? (
              data.topStreaks.map((streak: any, idx: number) => (
                <div key={idx} className="bg-cozy-panel p-4 rounded-2xl border-2 border-cozy-border flex justify-between items-center">
                  <div className="flex flex-col">
                     <span className="font-bold text-sm text-cozy-text">{streak.name}</span>
                     <span className="text-[10px] uppercase font-bold tracking-widest text-cozy-text-dim">{streak.category}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-cozy-gold/10 px-3 py-1.5 rounded-xl border border-cozy-gold/30">
                    <span className="noto-emoji text-sm">{M('🔥')}</span>
                    <span className="font-bold text-cozy-gold">{streak.streak}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 border-2 border-dashed border-cozy-border rounded-2xl text-center">
                 <p className="text-sm font-bold text-cozy-text-dim italic">No major streaks active.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Gratitude Logs (Three Good Things) */}
      <div className="space-y-6 pt-6 border-t-2 border-cozy-border">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 bg-cozy-gold/10 rounded-xl text-cozy-gold">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cozy-text-dark">Savoring the Good</h3>
            <p className="text-xs font-bold text-cozy-text-dim uppercase tracking-widest mt-1">Daily Gratitude & Positive Evidence</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.gratitudeLogs?.length > 0 ? (
            data.gratitudeLogs.map((log: any) => (
              <div key={log.id} className="bg-cozy-panel p-5 rounded-2xl border-2 border-cozy-gold/30 shadow-sm flex items-start gap-4 group hover:border-cozy-gold/60 transition-colors">
                <div className="w-10 h-10 bg-cozy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border border-cozy-gold/20 group-hover:scale-110 transition-transform">
                  <span className="noto-emoji">{M('✨')}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-cozy-text leading-relaxed italic">
                    "{log.text}"
                  </p>
                  <p className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest mt-3">
                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 border-2 border-dashed border-cozy-border rounded-[2rem] text-center space-y-3 opacity-50">
              <span className="noto-emoji text-3xl">{M('✨')}</span>
              <p className="text-sm font-bold text-cozy-text-dim italic">No gratitude logs found yet. Start logging from the Rituals tab.</p>
            </div>
          )}
        </div>
      </div>

      {/* High-Mood/Energy Moments */}
      <div className="space-y-6 pt-6 border-t-2 border-cozy-border">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cozy-text-dark">Peak Energy States</h3>
            <p className="text-xs font-bold text-cozy-text-dim uppercase tracking-widest mt-1">Activities That Radiate Happiness</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {data?.highMoodStates?.length > 0 ? (
            data.highMoodStates.map((state: any) => (
              <div key={state.id} className="bg-cozy-panel px-4 py-3 rounded-2xl border-2 border-rose-500/30 flex items-center gap-4 hover:border-rose-500/60 transition-colors">
                <div className="w-8 h-8 bg-rose-500/10 rounded-xl flex items-center justify-center font-bold text-rose-600 text-xs">
                  {state.value}/10
                </div>
                <div>
                  <p className="text-xs font-bold text-cozy-text leading-tight">
                    {state.context || 'Unknown Activity'} 
                  </p>
                  <p className="text-[9px] font-bold text-cozy-text-dim uppercase tracking-widest mt-1">
                    {state.social_context || 'Alone'} • {new Date(state.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full p-6 border-2 border-dashed border-cozy-border rounded-2xl text-center opacity-50">
              <p className="text-sm font-bold text-cozy-text-dim italic">No high-energy moments logged yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Pattern Recognition */}
      <div className="space-y-4 pt-6 border-t-2 border-cozy-border">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cozy-text-dark">OpenClaw Deep Insights</h3>
            <p className="text-xs font-bold text-cozy-text-dim uppercase tracking-widest mt-1">AI-Powered Pattern Recognition</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data?.aiInsights?.length > 0 ? (
            data.aiInsights.map((insight: any) => (
              <div key={insight.id} className="bg-cozy-panel p-5 sm:p-6 rounded-[1.5rem] border-2 border-indigo-500/30 shadow-[0_4px_0_0_rgba(99,102,241,0.15)] flex items-start gap-4 hover:border-indigo-500/60 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border border-indigo-500/20">
                  <span className="noto-emoji">{M(insight.icon || '✨')}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-cozy-text-dark leading-tight">{insight.title}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-sm text-cozy-text-muted leading-relaxed font-medium">
                    {insight.description}
                  </p>
                  <p className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest pt-2">
                    {new Date(insight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 border-2 border-dashed border-cozy-border rounded-[2rem] text-center space-y-3">
              <Sparkles className="mx-auto text-cozy-text-dim opacity-50" size={32} />
              <p className="text-sm font-bold text-cozy-text-dim italic">Awaiting OpenClaw analysis. Insights will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};