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
    case 'DSC': return M('⚒');
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 animate-pop">
      {campaigns.length > 0 ? campaigns.map((project, idx) => (
        <div key={idx} className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-col group hover:-translate-y-2 transition-all hover:border-cozy-accent">
          
          {/* Project Header */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <span className="noto-emoji text-[10px] sm:text-sm text-cozy-accent">{M('⛰')}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-cozy-accent uppercase tracking-widest">{project.attribute} Journey</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark group-hover:text-cozy-accent transition-colors leading-tight truncate">
                {project.name}
              </h3>
            </div>
            <div className="bg-cozy-bg-alt p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] border-2 border-cozy-border group-hover:bg-cozy-accent/10 group-hover:border-cozy-accent transition-all flex-shrink-0">
              <span className="noto-emoji text-2xl sm:text-3xl text-cozy-accent group-hover:scale-110 transition-transform block leading-none">
                {getProjectIcon(project.name, project.attribute)}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cozy-text-muted mb-6 sm:mb-8 leading-relaxed line-clamp-3 italic font-bold">
            "{project.description}"
          </p>

          <div className="mt-auto space-y-3 sm:space-y-4">
            <h4 className="text-[8px] sm:text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <span className="noto-emoji">{M('🧭')}</span> Milestones
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {project.milestones.map((milestone, mIdx) => (
                <div key={mIdx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-cozy-bg/60 rounded-xl sm:rounded-2xl border-2 border-cozy-border/50 hover:bg-cozy-panel transition-all">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center border-2 transition-all flex-shrink-0 ${milestone.completed ? 'bg-cozy-accent border-cozy-accent' : 'border-cozy-border'}`}>
                    {milestone.completed && <span className="noto-emoji text-white text-[10px] sm:text-xs font-bold">{M('✓')}</span>}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold ${milestone.completed ? 'text-cozy-text-dim line-through' : 'text-cozy-text'}`}>
                    {milestone.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 sm:mt-10 pt-4 sm:pt-6 border-t-2 border-cozy-bg-alt">
            <div className="flex justify-between items-center mb-2 sm:mb-3 px-1">
              <span className="text-[8px] sm:text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest">Adventure Progress</span>
              <span className="text-xs sm:text-sm font-bold text-cozy-accent">
                {Math.round((project.milestones.filter(m => m.completed).length / project.milestones.length) * 100)}%
              </span>
            </div>
            <div className="h-3 sm:h-4 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-0.5 sm:p-1">
              <div 
                className="h-full bg-cozy-accent transition-all duration-2000 ease-out shadow-[0_0_10px_rgba(141,160,142,0.4)] rounded-full"
                style={{ width: `${(project.milestones.filter(m => m.completed).length / project.milestones.length) * 100}%` }}
              ></div>
            </div>
          </div>

        </div>
      )) : (
        <div className="col-span-full h-80 flex flex-col items-center justify-center text-cozy-text-muted opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-default">
          <span className="noto-emoji text-8xl mb-6 animate-float">{M('⛰')}</span>
          <span className="text-2xl font-bold">The map is blank.</span>
          <span className="text-sm font-bold text-cozy-text-dim mt-2 tracking-widest uppercase">Time to choose a destination.</span>
        </div>
      )}
    </div>
  );
};
