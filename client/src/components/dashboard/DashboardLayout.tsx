import React, { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDarkMode } from '@/hooks/useDarkMode';
import { DailyView } from './DailyView';
import { TasksView } from './TasksView';
import { FocusView } from './FocusView';
import { HealthView } from './HealthView';
import { ProjectsView } from './ProjectsView';
import { FinanceView } from './FinanceView';
import { AttributesView } from './AttributesView';
import { Moon, Sun } from 'lucide-react';

// VS15 (\uFE0E) forces monochrome text presentation
const M = (emoji: string) => `${emoji}\uFE0E`;

const tabs = [
  { id: 'daily', label: 'Rituals', icon: M('🌿'), component: DailyView },
  { id: 'tasks', label: 'Quests', icon: M('📜'), component: TasksView },
  { id: 'focus', label: 'Quiet', icon: M('⏳'), component: FocusView },
  { id: 'health', label: 'Nurture', icon: M('🥣'), component: HealthView },
  { id: 'projects', label: 'Journeys', icon: M('⛰'), component: ProjectsView },
  { id: 'finance', label: 'Wealth', icon: M('💰'), component: FinanceView },
  { id: 'attributes', label: 'Stats', icon: M('✨'), component: AttributesView },
];

export const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const { isDark, toggle } = useDarkMode();
  const { 
    loading, 
    profile, 
    attributes, 
    tasks, 
    habits, 
    healthStats, 
    financeData, 
    campaigns, 
    dailyStats,
    heatmap
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-cozy-bg text-cozy-accent">
        <span className="noto-emoji text-6xl animate-bounce mb-4">{M('🌿')}</span>
        <span className="font-bold tracking-widest uppercase">Breathing...</span>
      </div>
    );
  }

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || DailyView;

  return (
    <div className="min-h-screen bg-cozy-bg text-cozy-text font-sans selection:bg-cozy-accent-soft/30 transition-colors duration-300">
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-cozy-panel/60 p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)]">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-cozy-accent rounded-3xl flex items-center justify-center text-white shadow-[0_6px_0_0_var(--cozy-accent-dark)]">
              <span className="text-3xl font-bold">{profile?.level || 1}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-cozy-text-dark tracking-tight">{profile?.name || 'Andrew'}</h1>
              <div className="text-cozy-accent font-bold text-lg">{profile?.class || 'Novice'}</div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end gap-3">
             <div className="flex items-center gap-4">
               <div className="text-sm font-bold text-cozy-text-dim uppercase tracking-widest">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </div>
               <button 
                 onClick={toggle}
                 className="p-2.5 bg-cozy-bg-alt rounded-2xl border-2 border-cozy-border text-cozy-accent hover:scale-110 transition-all shadow-[0_4px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1"
               >
                 {isDark ? <Sun size={20} /> : <Moon size={20} />}
               </button>
             </div>
             <div className="flex items-center gap-2 bg-cozy-bg-alt px-4 py-2 rounded-2xl border border-cozy-border">
               <span className="noto-emoji text-cozy-gold text-lg">{M('✨')}</span>
               <span className="font-bold text-cozy-accent text-sm uppercase">Phase 1 Status</span>
             </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex overflow-x-auto pb-4 gap-4 no-scrollbar justify-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all whitespace-nowrap font-bold text-sm
                  ${isActive 
                    ? 'bg-cozy-accent text-white shadow-[0_4px_0_0_var(--cozy-accent-dark)] scale-105' 
                    : 'bg-cozy-panel text-cozy-text-muted hover:bg-cozy-bg-alt border-2 border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)]'}
                `}
              >
                <span className="noto-emoji text-xl leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <main className="min-h-[500px]">
          <ActiveComponent 
            data={{ 
              profile, 
              attributes, 
              tasks, 
              habits, 
              healthStats, 
              financeData, 
              campaigns, 
              dailyStats,
              heatmap
            } as any} 
          />
        </main>

        {/* Footer */}
        <footer className="text-center py-12 opacity-40">
           <span className="noto-emoji text-2xl mb-2 block text-cozy-accent">{M('🌿')}</span>
           <p className="text-xs font-bold uppercase tracking-widest text-cozy-text-muted">OpenClaw Cozy Edition</p>
        </footer>
      </div>
    </div>
  );
};
