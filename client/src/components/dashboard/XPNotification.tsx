import React, { useEffect } from 'react';

const M = (emoji: string) => `${emoji}\uFE0E`;

const ATTRIBUTE_METADATA: Record<string, { label: string, icon: string, color: string, bg: string }> = {
  PWR: { label: 'Power', icon: M('💪'), color: 'text-orange-500', bg: 'bg-orange-500/10' },
  DSC: { label: 'Discipline', icon: M('⚡'), color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  VIT: { label: 'Vitality', icon: M('🧡'), color: 'text-rose-400', bg: 'bg-rose-400/10' },
  KNW: { label: 'Knowledge', icon: M('📖'), color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  WEL: { label: 'Wellness', icon: M('🧘'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  SOC: { label: 'Social', icon: M('🤝'), color: 'text-amber-500', bg: 'bg-amber-500/10' }
};

interface XPNotificationProps {
  amount: number;
  attribute: string;
  onClose: () => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({ amount, attribute, onClose }) => {
  const meta = ATTRIBUTE_METADATA[attribute] || { label: attribute, icon: M('✨'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' };
  
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-slide-in-right pointer-events-auto">
      <div className="relative">
        <div className={`bg-cozy-panel p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex items-center gap-4 sm:gap-6 group transition-all hover:border-cozy-accent overflow-hidden relative`}>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
          
          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${meta.bg} rounded-2xl sm:rounded-3xl border-2 border-transparent flex items-center justify-center relative flex-shrink-0 z-10 overflow-hidden`}>
             <span className="noto-emoji text-2xl sm:text-4xl block leading-none relative z-10">{meta.icon}</span>
             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 font-sans">
            <span className="text-3xl sm:text-4xl font-bold text-cozy-text-dark tabular-nums tracking-tighter">
              +{amount}
            </span>
            <span className={`text-lg sm:text-xl font-bold ${meta.color}`}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Particle Burst Effect (In Front) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className={`absolute w-2 h-2 rounded-full bg-current opacity-0 animate-particle-burst shadow-[0_0_8px_currentColor]`}
              style={{
                color: attribute === 'DSC' ? '#fcc419' : `var(--cozy-${meta.color.split('-')[1]})`,
                animationDelay: `${(i % 3) * 0.05}s`,
                top: '50%',
                left: '50%',
                '--tw-translate-x': `${Math.cos(i * 30 * Math.PI / 180) * (80 + Math.random() * 40)}px`,
                '--tw-translate-y': `${Math.sin(i * 30 * Math.PI / 180) * (80 + Math.random() * 40)}px`,
              } as any}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
