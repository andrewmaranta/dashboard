import React from 'react';
import { Attributes } from '@/types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';

const M = (emoji: string) => `${emoji}\uFE0E`;

const ATTRIBUTE_METADATA: Record<string, { label: string, icon: string, color: string, bg: string, text: string }> = {
  PWR: { label: 'Power', icon: M('💪'), color: 'text-cozy-warm', bg: 'bg-cozy-warm/10', text: 'var(--cozy-warm)' },
  AGI: { label: 'Agility', icon: M('🍃'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10', text: 'var(--cozy-accent)' },
  VIT: { label: 'Vitality', icon: M('🧡'), color: 'text-rose-400', bg: 'bg-rose-400/10', text: '#fb7185' },
  KNW: { label: 'Knowledge', icon: M('📖'), color: 'text-indigo-400', bg: 'bg-indigo-400/10', text: '#818cf8' },
  WEL: { label: 'Wellness', icon: M('🧘'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: '#10b981' },
  SOC: { label: 'Social', icon: M('🤝'), color: 'text-amber-500', bg: 'bg-amber-500/10', text: '#f59e0b' }
};

export const AttributesView: React.FC<AttributesViewProps> = ({ data }) => {
  const { attributes } = data;

  const chartData = Object.keys(ATTRIBUTE_METADATA).map(key => {
    const attr = attributes[key] || { score: 10 };
    return {
      subject: key,
      A: Math.max(0, (attr.score - 10) * 10 + 20), 
      fullMark: 100,
    };
  });

  return (
    <div className="space-y-12 animate-pop max-w-5xl mx-auto pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Radar Chart Section */}
        <div className="bg-cozy-panel p-12 rounded-[4rem] border-2 border-cozy-border shadow-[0_20px_0_0_var(--cozy-border)] aspect-square flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-cozy-bg-alt/20 transition-all group-hover:bg-cozy-bg-alt/40"></div>
          
          <div className="relative z-10 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="var(--cozy-border)" strokeWidth={2} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--cozy-text-muted)', fontSize: 14, fontWeight: 'bold' }} />
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
        <div className="space-y-6">
          <div className="mb-10 text-center lg:text-left px-2">
             <h3 className="text-3xl font-bold text-cozy-text-dark">Growth Progress</h3>
             <p className="text-cozy-text-dim font-bold text-sm uppercase tracking-widest mt-2">Nurture your potential</p>
          </div>

          {Object.keys(ATTRIBUTE_METADATA).map(key => {
            const meta = ATTRIBUTE_METADATA[key];
            const attr = attributes[key] || { score: 10, xp: 0, max: 100 };
            const progress = (attr.xp / attr.max) * 100;

            return (
              <div key={key} className="bg-cozy-panel p-6 rounded-[2rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex items-center gap-6 group hover:-translate-y-1 transition-all hover:border-cozy-accent">
                <div className={`w-16 h-16 ${meta.bg} rounded-[1.3rem] border-2 border-transparent flex items-center justify-center relative group-hover:scale-105 transition-all`}>
                   <span className="noto-emoji text-4xl block leading-none">{meta.icon}</span>
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-cozy-accent rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-white dark:border-cozy-panel">
                     {attr.score}
                   </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-cozy-text tracking-tight">{meta.label}</span>
                      <span className="text-[10px] text-cozy-text-dim font-bold uppercase tracking-widest">{key} EXP</span>
                    </div>
                    <span className="text-xs font-bold text-cozy-accent font-mono">
                      {attr.xp} / {attr.max}
                    </span>
                  </div>
                  
                  <div className="h-4 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
                    <div 
                      className="h-full bg-cozy-accent rounded-full transition-all duration-2000 shadow-sm"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

interface AttributesViewProps {
  data: {
    attributes: Attributes;
  };
}
