import React, { useState } from 'react';
import { api } from '@/services/api';
import { Task } from '@/types';
import { Trash2, Eraser } from 'lucide-react';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface TasksViewProps {
  data: {
    tasks: Task[];
  };
}

const ATTRIBUTES = ['PWR', 'DSC', 'VIT', 'KNW', 'WEL', 'SOC'];

export const TasksView: React.FC<TasksViewProps> = ({ data }) => {
  const { tasks } = data;
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedAttr, setSelectedAttr] = useState<string>('');

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      await api.addTask(newTaskText, selectedAttr || undefined);
      setNewTaskText('');
      setSelectedAttr('');
    } catch (e) { console.error(e); }
  };

  const handleToggleTask = async (id: number) => {
    try { 
      await api.toggleTask(id); 
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Discard this quest?')) return;
    try {
      await api.deleteTask(id);
    } catch (e) { console.error(e); }
  };

  const handleClearCompleted = async () => {
    try {
      await api.archiveCompleted();
    } catch (e) { console.error(e); }
  };

  // Sort tasks: Active first, Completed last
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const hasCompleted = tasks.some(t => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-pop">
      
      {/* Header */}
      <div className="relative text-center space-y-4">
        <div className="flex flex-col items-center">
          <span className="noto-emoji text-4xl sm:text-6xl text-cozy-warm mb-2 block animate-float">{M('📜')}</span>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-cozy-text-dark flex items-center justify-center gap-2 sm:gap-3">
              Quest Journal
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-cozy-accent/10 text-cozy-accent border border-cozy-accent/20 uppercase tracking-widest">
                +10 XP
              </span>
            </h2>
            
            <button 
              onClick={handleClearCompleted}
              disabled={!hasCompleted}
              className={`flex items-center gap-2 px-4 py-2 bg-cozy-panel border-2 border-cozy-border rounded-xl text-xs font-bold transition-all shadow-[0_4px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 z-20 ${
                hasCompleted 
                  ? 'text-cozy-text-muted hover:border-cozy-accent hover:text-cozy-accent cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title="Archive completed tasks from view"
            >
              <Eraser size={14} />
              Clear Completed
            </button>
          </div>
          <p className="text-cozy-text-muted font-bold text-[10px] sm:text-sm uppercase tracking-widest mt-2">Embark on your daily adventures</p>
        </div>
      </div>

      {/* Add Task Bar */}
      <div className="bg-cozy-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
        <div className="flex-1 w-full relative">
           <span className="noto-emoji absolute left-4 top-1/2 -translate-y-1/2 text-cozy-text-dim text-lg sm:text-xl">{M('🔖')}</span>
           <input 
            type="text" 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Write a new quest..."
            className="w-full bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-xl sm:rounded-2xl pl-11 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base text-cozy-text placeholder-cozy-text-dim focus:outline-none focus:border-cozy-accent transition-colors font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
        </div>
        
        <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
          <select 
            value={selectedAttr}
            onChange={(e) => setSelectedAttr(e.target.value)}
            className="flex-1 md:flex-none bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-base text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent appearance-none text-center"
          >
            <option value="">Attr</option>
            {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
          </select>
          
          <button 
            onClick={handleAddTask}
            className="flex-1 md:flex-none bg-cozy-warm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-[0_4px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <span className="noto-emoji text-lg sm:text-xl animate-wiggle">{M('⚔')}</span>
            <span className="text-sm sm:text-base">Accept</span>
          </button>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3 sm:space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="bg-cozy-panel/40 border-2 border-dashed border-cozy-border p-8 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] text-center text-cozy-text-dim font-bold text-sm sm:text-base">
            No active quests. Time to find a new adventure!
          </div>
        ) : (
          sortedTasks.map(task => (
            <div 
              key={task.id} 
              className={`group bg-cozy-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all flex items-center justify-between gap-3 ${
                task.completed 
                  ? 'border-cozy-bg-alt opacity-60 shadow-none grayscale' 
                  : 'border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                <button 
                  onClick={() => handleToggleTask(task.id)} 
                  className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border-2 transition-all ${
                    task.completed ? 'bg-cozy-accent border-cozy-accent text-white' : 'border-cozy-border text-transparent hover:border-cozy-accent'
                  }`}
                >
                  <span className="noto-emoji text-xl sm:text-2xl">{task.completed ? M('✓') : ''}</span>
                </button>
                
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-cozy-accent/10 text-cozy-accent border border-cozy-accent/20 uppercase tracking-widest mt-0.5 sm:mt-1">
                      {`+10 ${task.attribute && task.attribute !== '0' ? task.attribute : 'XP'}`}
                    </span>
                  </div>
                  <span className={`text-base sm:text-xl font-bold truncate ${task.completed ? 'line-through text-cozy-text-dim' : 'text-cozy-text'}`}>
                    {task.text}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 text-cozy-text-dim hover:text-cozy-warm transition-all p-2 rounded-xl hover:bg-cozy-warm/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

