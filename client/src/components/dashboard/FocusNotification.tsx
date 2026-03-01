import React, { useEffect } from 'react';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface FocusNotificationProps {
  type: string;
  duration: number;
  onClose: () => void;
}

export const FocusNotification: React.FC<FocusNotificationProps> = ({ type, duration, onClose }) => {
  const isWork = type === 'work';
  const icon = isWork ? M('⏳') : M('🍵');
  const label = isWork ? 'Focus Session Complete' : 'Break Complete';
  const color = isWork ? 'text-cozy-accent' : 'text-emerald-500';
  const bg = isWork ? 'bg-cozy-accent/10' : 'bg-emerald-500/10';

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-slide-in-right pointer-events-auto">
      <div className="relative">
        <div className={`bg-cozy-panel p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex items-center gap-4 sm:gap-6 group transition-all hover:border-cozy-accent overflow-hidden relative`}>
          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${bg} rounded-2xl sm:rounded-3xl border-2 border-transparent flex items-center justify-center relative flex-shrink-0 z-10 overflow-hidden`}>
             <span className="noto-emoji text-2xl sm:text-4xl block leading-none relative z-10">{icon}</span>
          </div>
          
          <div className="flex flex-col relative z-10">
            <span className={`text-lg sm:text-xl font-black ${color} tracking-tight leading-tight`}>
              {label}
            </span>
            <span className="text-xs sm:text-sm font-bold text-cozy-text-dim uppercase tracking-widest mt-1">
              {duration} Minutes Logged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
