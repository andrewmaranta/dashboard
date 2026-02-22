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
import { XPNotification } from './XPNotification';

// VS15 (\uFE0E) forces monochrome text presentation
const M = (emoji: string) => `${emoji}\uFE0E`;

const tabs = [
  { id: 'daily', label: 'Rituals', icon: M('🌿'), component: DailyView },
  { id: 'tasks', label: 'Quests', icon: M('📜'), component: TasksView },
  { id: 'focus', label: 'Quiet', icon: M('⏳'), component: FocusView },
  { id: 'health', label: 'Nurture', icon: M('🥣'), component: HealthView },
  { id: 'projects', label: 'Journeys', icon: M('⛰'), component: ProjectsView },
  { id: 'finance', label: 'Wealth', icon: M('💰'), component: FinanceView },
  { id: 'attributes', label: 'Stats', icon: M('📊'), component: AttributesView },
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
    heatmap,
    xpNotifications,
    removeXpNotification
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
      <div className="max-w-6xl mx-auto py-4 px-4 sm:py-8 sm:px-6 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 animate-blur-in">
          {/* Title and Date Column */}
          <div className="flex flex-col items-center lg:items-start gap-2 bg-cozy-panel/60 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex-1">
            <div className="flex items-center gap-4">
              <span className="noto-emoji text-4xl sm:text-5xl">{M('🌿')}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark tracking-tight">Life RPG</h1>
                <p className="text-xs sm:text-sm font-bold text-cozy-text-dim uppercase tracking-widest mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button 
                onClick={toggle}
                className="p-2 sm:p-2.5 bg-cozy-bg-alt rounded-xl sm:rounded-2xl border-2 border-cozy-border text-cozy-accent hover:scale-110 transition-all shadow-[0_4px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="px-4 py-2 bg-cozy-accent/10 rounded-xl border-2 border-cozy-accent/20 text-cozy-accent text-xs font-bold uppercase tracking-tighter">
                Phase 1 Foundation
              </div>
            </div>
          </div>

          {/* Minimalist Attributes Grid Card */}
          <div className="bg-cozy-panel/60 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex-shrink-0 lg:max-w-md w-full">
            <div className="grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-4">
              {[
                { code: 'PWR', icon: M('💪'), bg: 'bg-orange-500/10' },
                { code: 'DSC', icon: M('⚡'), bg: 'bg-yellow-500/10' },
                { code: 'VIT', icon: M('🧡'), bg: 'bg-rose-400/10' },
                { code: 'KNW', icon: M('📖'), bg: 'bg-indigo-400/10' },
                { code: 'WEL', icon: M('🧘'), bg: 'bg-emerald-500/10' },
                { code: 'SOC', icon: M('🤝'), bg: 'bg-amber-500/10' }
              ].map(attr => {
                const data = attributes?.[attr.code] || { score: 1, xp: 0, max: 100 };
                const progress = (data.xp / data.max) * 100;
                return (
                  <div key={attr.code} className="flex items-center gap-3 group" title={`${attr.code}: ${data.xp}/${data.max} XP`}>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 ${attr.bg} rounded-xl border-2 border-transparent flex items-center justify-center relative flex-shrink-0 transition-transform group-hover:scale-105`}>
                       <span className="noto-emoji text-base sm:text-lg block leading-none opacity-90">{attr.icon}</span>
                       <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cozy-accent rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm border border-white dark:border-cozy-panel">
                         {data.score}
                       </div>
                    </div>
                    
                    <div className="flex-1 min-w-[60px] sm:min-w-[100px]">
                      <div className="h-2 sm:h-2.5 w-full bg-cozy-bg-alt rounded-full overflow-hidden border border-cozy-border shadow-inner p-[1px]">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 shadow-sm"
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
        </header>

        {/* Tab Navigation */}
        <nav className="flex overflow-x-auto pb-4 gap-3 sm:gap-4 no-scrollbar justify-start md:justify-center -mx-4 px-4 sm:mx-0 sm:px-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-[1rem] sm:rounded-[1.5rem] transition-all whitespace-nowrap font-bold text-xs sm:text-sm
                  ${isActive 
                    ? 'bg-cozy-accent text-white shadow-[0_4px_0_0_var(--cozy-accent-dark)] scale-105' 
                    : 'bg-cozy-panel text-cozy-text-muted hover:bg-cozy-bg-alt border-2 border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)]'}
                `}
              >
                <span className="noto-emoji text-lg sm:text-xl leading-none">{tab.icon}</span>
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

        {/* Notifications */}
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
          {xpNotifications.map((n, idx) => (
            <div key={n.id} className="pointer-events-auto" style={{ transform: `translateY(-${idx * 10}px)` }}>
              <XPNotification 
                amount={n.amount} 
                attribute={n.attribute} 
                onClose={() => removeXpNotification(n.id)} 
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center py-12 opacity-40">
           <span className="noto-emoji text-2xl mb-2 block text-cozy-accent">{M('🌿')}</span>
           <p className="text-xs font-bold uppercase tracking-widest text-cozy-text-muted">OpenClaw Cozy Edition</p>
        </footer>
      </div>
    </div>
  );
};
