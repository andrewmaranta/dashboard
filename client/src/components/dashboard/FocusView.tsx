import React, { useEffect, useState } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { api } from '@/services/api';
import { FocusSession } from '@/types';

const M = (emoji: string) => `${emoji}\uFE0E`;

export const FocusView: React.FC = () => {
  const { state, loading, toggleTimer, resetTimer, setDuration, takeBreak, returnToWork } = usePomodoro();
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        const data = await api.getFocusHistory(start, end);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch focus history:', err);
      }
    };
    if (!loading) {
      fetchHistory();
    }
  }, [state.isRunning, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-cozy-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cozy-text-dim font-bold animate-pulse uppercase tracking-widest text-xs">Loading Focus State...</p>
      </div>
    );
  }

  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const totalDuration = state.mode === 'work' ? state.workDuration : state.breakDuration;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-12 animate-pop">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
        
        {/* Timer Card */}
        <div className="bg-cozy-panel p-6 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] sm:shadow-[0_12px_0_0_var(--cozy-border)] flex flex-col items-center relative overflow-hidden">
          <h2 className="text-xl sm:text-3xl font-bold text-cozy-text-dark mb-6 sm:mb-12 flex items-center gap-2 sm:gap-3 relative z-10">
            <span className="noto-emoji text-2xl sm:text-3xl">{state.mode === 'work' ? M('⏳') : M('🍵')}</span>
            <div className="flex flex-col items-start">
              <span>{state.mode === 'work' ? 'Time to Focus' : 'Tea Break'}</span>
              {state.mode === 'work' && (
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-400 border border-indigo-400/20 uppercase tracking-widest mt-1">
                  +15 KNW
                </span>
              )}
            </div>
          </h2>

          <div className="relative w-48 h-48 sm:w-72 sm:h-72 flex items-center justify-center z-10">
            <svg className="w-full h-full -rotate-90 transform">
              <circle cx="50%" cy="50%" r="42%" stroke="var(--cozy-bg-alt)" strokeWidth="8" className="sm:stroke-[12px]" fill="transparent" />
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke={state.mode === 'work' ? 'var(--cozy-accent)' : 'var(--cozy-warm)'}
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-1000 sm:stroke-[12px]"
                style={{ 
                  strokeDasharray: `${2 * Math.PI * (window.innerWidth < 640 ? 80 : 120)}`,
                  strokeDashoffset: `${2 * Math.PI * (window.innerWidth < 640 ? 80 : 120) * (1 - state.timeLeft / totalDuration)}`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-7xl font-bold text-cozy-text tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-cozy-text-dim mt-1 sm:mt-3 font-bold">Remaining</span>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 mt-8 sm:mt-12 relative z-10">
            <button 
              onClick={toggleTimer}
              className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all shadow-[0_4px_0_0_var(--cozy-accent-dark)] sm:shadow-[0_6px_0_0_var(--cozy-accent-dark)] active:shadow-none active:translate-y-1 ${
                state.isRunning ? 'bg-cozy-warm' : 'bg-cozy-accent text-white'
              }`}
            >
              <span className="noto-emoji text-xl sm:text-3xl text-white">{state.isRunning ? M('⏸') : M('▶')}</span>
            </button>
            
            <button 
              onClick={resetTimer}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-cozy-panel text-cozy-accent flex items-center justify-center border-2 border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)] sm:shadow-[0_6px_0_0_var(--cozy-border)] hover:bg-cozy-bg-alt active:shadow-none active:translate-y-1 transition-all"
            >
              <span className="noto-emoji text-xl sm:text-3xl">{M('🔄')}</span>
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-cozy-panel text-cozy-text-dim flex items-center justify-center border-2 border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)] sm:shadow-[0_6px_0_0_var(--cozy-border)] hover:bg-cozy-bg-alt active:shadow-none active:translate-y-1 transition-all"
            >
              <span className="noto-emoji text-xl sm:text-3xl">{M('⚙')}</span>
            </button>
          </div>

          {showSettings && (
            <div className="mt-6 sm:mt-12 w-full p-6 sm:p-8 bg-cozy-bg rounded-[1.5rem] sm:rounded-[2rem] border-2 border-cozy-border space-y-4 sm:space-y-6 animate-pop z-10">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-bold text-cozy-text-muted uppercase">Work (min)</label>
                <input 
                  type="number" 
                  value={state.workDuration / 60} 
                  onChange={(e) => setDuration('work', parseInt(e.target.value) || 0)}
                  className="bg-cozy-panel border-2 border-cozy-border rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 w-16 sm:w-20 text-center text-cozy-accent font-bold text-sm sm:text-base"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-bold text-cozy-text-muted uppercase">Break (min)</label>
                <input 
                  type="number" 
                  value={state.breakDuration / 60}
                  onChange={(e) => setDuration('break', parseInt(e.target.value) || 0)}
                  className="bg-cozy-panel border-2 border-cozy-border rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 w-16 sm:w-20 text-center text-cozy-warm font-bold text-sm sm:text-base"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 sm:space-y-8">
          {/* Break Bank */}
          <div className="bg-cozy-panel p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] sm:shadow-[0_10px_0_0_var(--cozy-border)]">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <span className="noto-emoji text-xl sm:text-2xl">{M('🍵')}</span>
              Break Bank
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[48px] sm:min-h-[64px] p-3 sm:p-4 bg-cozy-bg-alt rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border-2 border-dashed border-cozy-border items-center">
              {state.breaksEarned > 0 ? Array.from({ length: state.breaksEarned }).map((_, i) => (
                <span key={i} className="noto-emoji text-2xl sm:text-3xl">{M('🍵')}</span>
              )) : (
                <span className="text-cozy-text-dim italic text-xs sm:text-sm font-bold flex items-center gap-2 px-2 sm:px-4 py-1 sm:py-2">No breaks earned</span>
              )}
            </div>
            <button 
              onClick={state.mode === 'work' ? takeBreak : returnToWork}
              disabled={state.mode === 'work' && state.breaksEarned === 0}
              className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg ${
                state.mode === 'break'
                  ? 'bg-cozy-accent text-white shadow-[0_4px_0_0_var(--cozy-accent-dark)] sm:shadow-[0_6px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1'
                  : state.breaksEarned > 0
                  ? 'bg-cozy-warm text-white shadow-[0_4px_0_0_var(--cozy-accent-dark)] sm:shadow-[0_6px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1'
                  : 'bg-cozy-bg-alt text-cozy-text-dim cursor-not-allowed border-2 border-cozy-border'
              }`}
            >
              <span className="noto-emoji text-xl sm:text-2xl">{state.mode === 'work' ? M('🍵') : M('⏳')}</span>
              {state.mode === 'work' ? 'Have a Break' : 'Return to Work'}
            </button>
          </div>

          {/* History */}
          <div className="bg-cozy-panel p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] sm:shadow-[0_10px_0_0_var(--cozy-border)] flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
               <span className="noto-emoji text-xl sm:text-2xl">{M('📖')}</span>
               Past Focus
            </h3>
            <div className="space-y-2 sm:space-y-3 max-h-[220px] sm:max-h-[280px] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
              {history.length > 0 ? history.map((session, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 sm:p-5 bg-cozy-bg/60 rounded-[1.2rem] sm:rounded-[1.5rem] border-2 border-cozy-border/50 hover:bg-cozy-panel transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-cozy-text">{new Date(session.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-[8px] sm:text-[10px] text-cozy-text-dim uppercase font-bold tracking-widest">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 ${session.type === 'work' ? 'bg-cozy-accent/10 border-cozy-accent text-cozy-accent' : 'bg-cozy-warm/10 border-cozy-warm text-cozy-warm'}`}>
                      {session.type.toUpperCase()}
                    </span>
                    <span className="text-cozy-text-dark font-bold text-base sm:text-lg">{session.duration}m</span>
                  </div>
                </div>
              )) : <div className="p-6 sm:p-8 text-center text-cozy-text-dim italic font-bold text-sm">Empty journal.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
