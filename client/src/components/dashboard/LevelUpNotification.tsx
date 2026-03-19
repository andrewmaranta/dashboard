import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const M = (emoji: string) => `${emoji}\uFE0E`;

const ATTRIBUTE_METADATA: Record<string, { label: string, icon: string, color: string, bg: string }> = {
  PWR: { label: 'Power', icon: M('💪'), color: 'text-orange-500', bg: 'bg-orange-500/10' },
  DSC: { label: 'Discipline', icon: M('⚡'), color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  VIT: { label: 'Vitality', icon: M('🧡'), color: 'text-rose-400', bg: 'bg-rose-400/10' },
  KNW: { label: 'Knowledge', icon: M('📖'), color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  WEL: { label: 'Wellness', icon: M('🧘'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  SOC: { label: 'Social', icon: M('🤝'), color: 'text-amber-500', bg: 'bg-amber-500/10' }
};

interface LevelUpNotificationProps {
  attribute: string;
  name: string;
  newLevel: number;
  onClose: () => void;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ attribute, name, newLevel, onClose }) => {
  const meta = ATTRIBUTE_METADATA[attribute] || { label: name, icon: M('✨'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' };
  
  useEffect(() => {
    // Fire confetti burst!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#8da08e', '#d68060', '#e9c46a']
    });

    const timer = setTimeout(onClose, 6000); // Level up lasts longer
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-slide-in-right pointer-events-auto">
      <div className="relative">
        <div className={`bg-cozy-panel p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-4 border-cozy-accent shadow-[0_12px_0_0_var(--cozy-accent-dark)] flex flex-col items-center gap-4 group transition-all overflow-hidden relative min-w-[280px]`}>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-cozy-accent font-black text-xs uppercase tracking-[0.3em] animate-pulse">LEVEL UP!</span>
            <div className={`w-20 h-20 sm:w-24 sm:h-24 ${meta.bg} rounded-3xl sm:rounded-[2.5rem] border-2 border-cozy-accent flex items-center justify-center relative z-10 overflow-hidden`}>
               <span className="noto-emoji text-4xl sm:text-5xl block leading-none relative z-10">{meta.icon}</span>
            </div>
          </div>
          
          <div className="text-center space-y-1 relative z-10">
            <h3 className={`text-2xl sm:text-3xl font-black ${meta.color} uppercase`}>
              {meta.label}
            </h3>
            <p className="text-cozy-text-dark font-bold text-lg sm:text-xl">
              Now Level <span className="text-cozy-accent text-2xl sm:text-3xl tabular-nums">{newLevel}</span>
            </p>
          </div>
        </div>

        {/* Big Burst Effect */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className={`absolute w-3 h-3 rounded-full bg-cozy-accent opacity-0 animate-particle-burst shadow-[0_0_12px_var(--cozy-accent)]`}
              style={{
                animationDelay: `${(i % 5) * 0.05}s`,
                top: '50%',
                left: '50%',
                '--tw-translate-x': `${Math.cos(i * 18 * Math.PI / 180) * (120 + Math.random() * 60)}px`,
                '--tw-translate-y': `${Math.sin(i * 18 * Math.PI / 180) * (120 + Math.random() * 60)}px`,
              } as any}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
