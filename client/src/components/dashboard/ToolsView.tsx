import React, { useState } from 'react';
import { FocusView } from './FocusView';
import { Zap } from 'lucide-react';

export const ToolsView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'focus'>('focus');

  const handleToolChange = (tool: 'focus') => {
    setActiveTool(tool);
    localStorage.setItem('activeTool', tool);
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-pop max-w-5xl mx-auto pb-8 sm:pb-12">
      
      {/* Sub-Nav Toggle */}
      <div className="flex justify-center">
        <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-wrap justify-center gap-1 sm:gap-2">
          <button 
            onClick={() => handleToolChange('focus')}
            className={`
              px-4 py-2 sm:px-6 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm
              ${activeTool === 'focus' ? 'cozy-button !scale-105' : 'cozy-button-ghost'}
            `}
          >
            <Zap size={16} />
            Focus Timer
          </button>
        </div>
      </div>

      {/* Tool Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTool === 'focus' && <FocusView />}
      </div>
    </div>
  );
};
