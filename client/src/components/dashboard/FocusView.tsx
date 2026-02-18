import React, { useEffect, useState } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { api } from '@/services/api';
import { FocusSession } from '@/types';

const M = (emoji: string) => `${emoji}\uFE0E`;

export const FocusView: React.FC = () => {
  const { state, toggleTimer, resetTimer, setDuration, takeBreak } = usePomodoro();
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const data = await api.getFocusHistory(start, end);
      setHistory(data);
    };
    fetchHistory();
  }, [state.isRunning]);

  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const totalDuration = state.mode === 'work' ? state.workDuration : state.breakDuration;
  const offset = 2 * Math.PI * 90 * (1 - state.timeLeft / totalDuration);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-pop">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Timer Card */}
        <div className="bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)] flex flex-col items-center relative overflow-hidden">
          <h2 className="text-3xl font-bold text-cozy-text-dark mb-12 flex items-center gap-3 relative z-10">
            <span className="noto-emoji text-3xl">{state.mode === 'work' ? M('⏳') : M('🍵')}</span>
            {state.mode === 'work' ? 'Time to Focus' : 'Tea Break'}
          </h2>

          <div className="relative w-72 h-72 flex items-center justify-center z-10">
            <svg className="w-full h-full -rotate-90 transform">
              <circle cx="144" cy="144" r="90" stroke="var(--cozy-bg-alt)" strokeWidth="12" fill="transparent" />
              <circle
                cx="144"
                cy="144"
                r="90"
                stroke={state.mode === 'work' ? 'var(--cozy-accent)' : 'var(--cozy-warm)'}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-bold text-cozy-text tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-cozy-text-dim mt-3 font-bold">Remaining</span>
            </div>
          </div>

          <div className="flex gap-6 mt-12 relative z-10">
            <button 
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-[0_6px_0_0_var(--cozy-accent-dark)] active:shadow-none active:translate-y-1 ${
                state.isRunning ? 'bg-cozy-warm' : 'bg-cozy-accent text-white'
              }`}
            >
              <span className="noto-emoji text-3xl text-white">{state.isRunning ? M('⏸') : M('▶')}</span>
            </button>
            
            <button 
              onClick={resetTimer}
              className="w-20 h-20 rounded-3xl bg-cozy-panel text-cozy-accent flex items-center justify-center border-2 border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] hover:bg-cozy-bg-alt active:shadow-none active:translate-y-1 transition-all"
            >
              <span className="noto-emoji text-3xl">{M('🔄')}</span>
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-20 h-20 rounded-3xl bg-cozy-panel text-cozy-text-dim flex items-center justify-center border-2 border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] hover:bg-cozy-bg-alt active:shadow-none active:translate-y-1 transition-all"
            >
              <span className="noto-emoji text-3xl">{M('⚙')}</span>
            </button>
          </div>

          {showSettings && (
            <div className="mt-12 w-full p-8 bg-cozy-bg rounded-[2rem] border-2 border-cozy-border space-y-6 animate-pop z-10">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-cozy-text-muted uppercase">Work (min)</label>
                <input 
                  type="number" 
                  defaultValue={state.workDuration / 60} 
                  onChange={(e) => setDuration('work', parseInt(e.target.value) || 25)}
                  className="bg-cozy-panel border-2 border-cozy-border rounded-xl px-4 py-2 w-20 text-center text-cozy-accent font-bold"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-cozy-text-muted uppercase">Break (min)</label>
                <input 
                  type="number" 
                  defaultValue={state.breakDuration / 60}
                  onChange={(e) => setDuration('break', parseInt(e.target.value) || 5)}
                  className="bg-cozy-panel border-2 border-cozy-border rounded-xl px-4 py-2 w-20 text-center text-cozy-warm font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Break Bank */}
          <div className="bg-cozy-panel p-10 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)]">
            <h3 className="text-2xl font-bold text-cozy-text-dark mb-6 flex items-center gap-3">
              <span className="noto-emoji text-2xl">{M('🍵')}</span>
              Break Bank
            </h3>
            <div className="flex flex-wrap gap-3 min-h-[64px] p-4 bg-cozy-bg-alt rounded-3xl mb-8 border-2 border-dashed border-cozy-border items-center">
              {state.breaksEarned > 0 ? Array.from({ length: state.breaksEarned }).map((_, i) => (
                <span key={i} className="noto-emoji text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{M('🍵')}</span>
              )) : (
                <span className="text-cozy-text-dim italic text-sm font-bold flex items-center gap-2 px-4 py-2">No tea earned yet. Time to focus!</span>
              )}
            </div>
            <button 
              onClick={takeBreak}
              disabled={state.breaksEarned === 0 || state.mode === 'break'}
              className={`w-full py-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg ${
                state.breaksEarned > 0 && state.mode !== 'break'
                  ? 'bg-cozy-warm text-white shadow-[0_6px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1'
                  : 'bg-cozy-bg-alt text-cozy-text-dim cursor-not-allowed border-2 border-cozy-border'
              }`}
            >
              <span className="noto-emoji text-2xl">{M('🍵')}</span>
              Have a Break
            </button>
          </div>

          {/* History */}
          <div className="bg-cozy-panel p-10 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)] flex-1">
            <h3 className="text-2xl font-bold text-cozy-text-dark mb-6 flex items-center gap-3">
               <span className="noto-emoji text-2xl">{M('📖')}</span>
               Past Focus
            </h3>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-4 custom-scrollbar">
              {history.length > 0 ? history.map((session, idx) => (
                <div key={idx} className="flex justify-between items-center p-5 bg-cozy-bg/60 rounded-[1.5rem] border-2 border-cozy-border/50 hover:bg-cozy-panel transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-cozy-text">{new Date(session.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-[10px] text-cozy-text-dim uppercase font-bold tracking-widest">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border-2 ${session.type === 'work' ? 'bg-cozy-accent/10 border-cozy-accent text-cozy-accent' : 'bg-cozy-warm/10 border-cozy-warm text-cozy-warm'}`}>
                      {session.type.toUpperCase()}
                    </span>
                    <span className="text-cozy-text-dark font-bold text-lg">{session.duration}m</span>
                  </div>
                </div>
              )) : <div className="p-8 text-center text-cozy-text-dim italic font-bold">No history recorded.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
