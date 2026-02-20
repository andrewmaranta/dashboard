import React from 'react';
import { Campaign } from '@/types';

const M = (emoji: string) => `${emoji}\uFE0E`;

const getProjectIcon = (name: string, attribute: string) => {
  const n = name.toLowerCase();
  if (n.includes('strength')) return M('🏋');
  if (n.includes('body')) return M('⚖');
  if (n.includes('financial')) return M('💰');
  if (n.includes('knowledge')) return M('📚');
  if (n.includes('mental')) return M('🧘');
  if (n.includes('social')) return M('🤝');
  
  switch (attribute) {
    case 'PWR': return M('⚔');
    case 'AGI': return M('🏹');
    case 'VIT': return M('🛡');
    case 'KNW': return M('📜');
    case 'WEL': return M('🧡');
    case 'SOC': return M('💬');
    default: return M('⛺');
  }
};

interface ProjectsViewProps {
  data: {
    campaigns: Campaign[];
  };
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ data }) => {
  const { campaigns } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-pop">
      {campaigns.length > 0 ? campaigns.map((project, idx) => (
        <div key={idx} className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)] flex flex-col group hover:-translate-y-2 transition-all hover:border-cozy-accent">
          
          {/* Project Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="noto-emoji text-sm text-cozy-accent">{M('⛰')}</span>
                <span className="text-[10px] font-bold text-cozy-accent uppercase tracking-widest">{project.attribute} Journey</span>
              </div>
              <h3 className="text-2xl font-bold text-cozy-text-dark group-hover:text-cozy-accent transition-colors leading-tight">
                {project.name}
              </h3>
            </div>
            <div className="bg-cozy-bg-alt p-4 rounded-[1.5rem] border-2 border-cozy-border group-hover:bg-cozy-accent/10 group-hover:border-cozy-accent transition-all">
              <span className="noto-emoji text-3xl text-cozy-accent group-hover:scale-110 transition-transform block leading-none">
                {getProjectIcon(project.name, project.attribute)}
              </span>
            </div>
          </div>

          <p className="text-sm text-cozy-text-muted mb-8 leading-relaxed line-clamp-3 italic font-bold">
            "{project.description}"
          </p>

          <div className="mt-auto space-y-4">
            <h4 className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest flex items-center gap-3 mb-4">
              <span className="noto-emoji">{M('🧭')}</span> Milestones
            </h4>
            <div className="space-y-3">
              {project.milestones.map((milestone, mIdx) => (
                <div key={mIdx} className="flex items-center gap-4 p-4 bg-cozy-bg/60 rounded-2xl border-2 border-cozy-border/50 hover:bg-cozy-panel transition-all">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${milestone.completed ? 'bg-cozy-accent border-cozy-accent' : 'border-cozy-border'}`}>
                    {milestone.completed && <span className="noto-emoji text-white text-xs font-bold">{M('✓')}</span>}
                  </div>
                  <span className={`text-sm font-bold ${milestone.completed ? 'text-cozy-text-dim line-through' : 'text-cozy-text'}`}>
                    {milestone.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-10 pt-6 border-t-2 border-cozy-bg-alt">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest">Adventure Progress</span>
              <span className="text-sm font-bold text-cozy-accent">
                {Math.round((project.milestones.filter(m => m.completed).length / project.milestones.length) * 100)}%
              </span>
            </div>
            <div className="h-4 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
              <div 
                className="h-full bg-cozy-accent transition-all duration-2000 ease-out shadow-[0_0_10px_rgba(141,160,142,0.4)] rounded-full"
                style={{ width: `${(project.milestones.filter(m => m.completed).length / project.milestones.length) * 100}%` }}
              ></div>
            </div>
          </div>

        </div>
      )) : (
        <div className="col-span-full h-80 flex flex-col items-center justify-center opacity-30">
          <span className="noto-emoji text-8xl mb-6">{M('⛰')}</span>
          <span className="text-2xl italic font-bold text-cozy-text-muted">No active journeys found...</span>
        </div>
      )}
    </div>
  );
};
