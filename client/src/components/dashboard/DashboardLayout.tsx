import React, { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDarkMode } from '@/hooks/useDarkMode';
import { DailyView } from './DailyView';
import { TasksView } from './TasksView';
import { HealthView } from './HealthView';
import { ProjectsView } from './ProjectsView';
import { AttributesView } from './AttributesView';
import { BeliefsView } from './BeliefsView';
import { ToolsView } from './ToolsView';
import { Moon, Sun, Mic } from 'lucide-react';
import { XPNotification } from './XPNotification';
import { LevelUpNotification } from './LevelUpNotification';
import { FocusNotification } from './FocusNotification';
import { DensityUpdateModal } from './DensityUpdateModal';
import { OpenClawChat } from './OpenClawChat';

// VS15 (\uFE0E) forces monochrome text presentation
const M = (emoji: string) => `${emoji}\uFE0E`;

const tabs = [
  { id: 'daily', label: 'Rituals', icon: M('🌿'), component: DailyView },
  { id: 'tasks', label: 'Quests', icon: M('📜'), component: TasksView },
  { id: 'tools', label: 'Tools', icon: M('🛠'), component: ToolsView },
  { id: 'beliefs', label: 'Beliefs', icon: M('🧠'), component: BeliefsView },
  { id: 'health', label: 'Nurture', icon: M('🌱'), component: HealthView },
  { id: 'projects', label: 'Journeys', icon: M('⛰'), component: ProjectsView },
  { id: 'attributes', label: 'Stats', icon: M('📊'), component: AttributesView },
];

const getStatColor = (val: number) => {
  if (val === 0) return 'bg-cozy-bg-alt';
  if (val < 3) return 'bg-red-500';
  if (val < 5) return 'bg-orange-500';
  if (val < 7) return 'bg-yellow-500';
  if (val < 9) return 'bg-lime-500';
  return 'bg-emerald-500';
};

export const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'daily');
  const [isDensityModalOpen, setIsDensityModalOpen] = useState(false);
  const [isDictationModeOpen, setIsDictationModeOpen] = useState(() => {
    // Auto-open on Android (often used for quick voice input)
    return /Android/i.test(navigator.userAgent);
  });
  const { isDark, toggle } = useDarkMode();

  // Global hotkey to open Dictation Mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.metaKey) {
        setIsDictationModeOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('activeTab', tabId);
  };
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
    levelUpNotifications,
    focusNotifications,
    stateLogs,
    removeXpNotification,
    removeLevelUpNotification,
    removeFocusNotification,
    stopAudio,
    refetch
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
        <header className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 animate-blur-in relative z-[110]">
          {/* Title and Date Column */}
          <div className="flex flex-col items-center lg:items-start gap-2 bg-cozy-panel/60 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex-1 relative overflow-hidden">
            {/* Header Action Bar - Responsive positioning */}
            <div className="flex lg:absolute lg:top-6 lg:right-6 gap-2 mb-6 lg:mb-0 w-full lg:w-auto justify-end z-10">
              <button 
                onClick={() => setIsDictationModeOpen(!isDictationModeOpen)}
                title="Toggle Dictation Mode"
                className={`p-2.5 rounded-xl sm:rounded-2xl border-2 border-cozy-border transition-all shadow-[0_4px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 ${
                  isDictationModeOpen 
                    ? 'bg-cozy-accent text-white border-cozy-accent shadow-[0_4px_0_0_rgba(235,94,85,0.4)]' 
                    : 'bg-cozy-bg-alt text-cozy-accent'
                }`}
              >
                <Mic size={20} />
              </button>
              <button 
                onClick={toggle}
                title="Toggle Theme"
                className="p-2.5 bg-cozy-bg-alt rounded-xl sm:rounded-2xl border-2 border-cozy-border text-cozy-accent hover:scale-110 transition-all shadow-[0_4px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full justify-center lg:justify-start">
              <span className="noto-emoji text-4xl sm:text-5xl flex-shrink-0">{M('🧭')}</span>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark tracking-tight truncate">Life Tracker</h1>
                <p className="text-[10px] sm:text-sm font-bold text-cozy-text-dim uppercase tracking-widest mt-1 truncate">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Trait Density Grid */}
          <div 
            className="bg-cozy-panel/60 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex-shrink-0 lg:max-w-md w-full relative group cursor-pointer hover:border-cozy-accent transition-colors"
            onClick={() => setIsDensityModalOpen(true)}
            title="Update Trait Densities"
          >
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-cozy-accent text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest pointer-events-none">
              Update
            </div>
            <div className="grid grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-4">
              {[
                { code: 'PWR', icon: M('💪') },
                { code: 'DSC', icon: M('⚒') },
                { code: 'VIT', icon: M('🧡') },
                { code: 'KNW', icon: M('📖') },
                { code: 'WEL', icon: M('🧘') },
                { code: 'SOC', icon: M('🤝') }
              ].map(attr => {
                const logs = stateLogs ? stateLogs.filter((l: any) => l.attribute_code === attr.code) : [];
                const total = logs.reduce((sum: number, l: any) => sum + l.value, 0);
                const mean = logs.length > 0 ? total / logs.length : 0;

                const stat = attributes ? attributes[attr.code] : null;
                const level = stat?.score || 1;
                const xp = stat?.xp || 0;
                const max = stat?.max || 100;
                const xpPercentage = Math.min(100, Math.max(0, (xp / max) * 100));

                return (
                  <div key={attr.code} className="flex items-center gap-3 group" title={`Level ${level} • ${xp}/${max} XP • 30-Day Mean: ${mean.toFixed(1)}/10`}>
                    <div className="relative flex-shrink-0 transition-transform group-hover:scale-105">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 bg-cozy-bg-alt rounded-xl border-2 border-white dark:border-white/50 flex items-center justify-center shadow-sm`}>
                         <span className="noto-emoji text-base sm:text-lg block leading-none opacity-90">{attr.icon}</span>
                      </div>
                      {/* Level Badge */}
                      <div className="absolute -top-1.5 -right-1.5 bg-cozy-accent text-white text-[8px] sm:text-[9px] font-black rounded-full w-[18px] h-[18px] flex items-center justify-center border-2 border-white dark:border-cozy-panel shadow-sm leading-none">
                        {level}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col gap-1">
                      <div className="flex justify-between items-end leading-none">
                        <span className="text-[8px] font-bold text-cozy-text-dim uppercase tracking-widest">{xp}/{max} XP</span>
                        <span className="text-[9px] font-bold text-cozy-text-dim tabular-nums tracking-tighter">
                          {mean > 0 ? mean.toFixed(1) : '-'} / 10
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="h-2 sm:h-2.5 w-full bg-cozy-bg-alt rounded-full overflow-hidden border border-cozy-border shadow-inner p-[1px]">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${getStatColor(mean)}`}
                            style={{ width: `${(mean / 10) * 100}%` }}
                          ></div>
                        </div>
                        <div className="h-1 sm:h-1.5 w-full bg-cozy-bg-alt/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cozy-accent rounded-full transition-all duration-1000"
                            style={{ width: `${xpPercentage}%` }}
                          ></div>
                        </div>
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
                onClick={() => handleTabChange(tab.id)}
                className={`
                  px-4 py-3 sm:px-6 sm:py-4 rounded-[1.2rem] sm:rounded-[1.8rem] whitespace-nowrap text-xs sm:text-sm
                  ${isActive 
                    ? 'cozy-button !scale-105' 
                    : 'cozy-button-secondary !bg-cozy-panel !border-cozy-border hover:!border-cozy-accent/30'}
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
              finance: financeData, 
              financeData, 
              campaigns, 
              dailyStats,
              heatmap
            } as any} 
          />
        </main>

        {/* Notifications */}
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
          {levelUpNotifications.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <LevelUpNotification 
                attribute={n.attribute} 
                name={n.name}
                newLevel={n.newLevel}
                onClose={() => removeLevelUpNotification(n.id)} 
              />
            </div>
          ))}

          {focusNotifications.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <FocusNotification 
                type={n.type} 
                duration={n.duration}
                onClose={() => removeFocusNotification(n.id)} 
              />
            </div>
          ))}

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

        {isDensityModalOpen && (
          <DensityUpdateModal 
            stateLogs={stateLogs} 
            onClose={() => setIsDensityModalOpen(false)} 
            onUpdated={refetch} 
          />
        )}

        <OpenClawChat 
          isOpen={isDictationModeOpen} 
          onClose={() => setIsDictationModeOpen(false)} 
          stopAudio={stopAudio}
        />

        {/* Footer */}
        <footer className="text-center py-12 opacity-40">
           <span className="noto-emoji text-2xl mb-2 block text-cozy-accent">{M('🌿')}</span>
           <p className="text-xs font-bold uppercase tracking-widest text-cozy-text-muted">OpenClaw Cozy Edition</p>
        </footer>
      </div>
    </div>
  );
};
