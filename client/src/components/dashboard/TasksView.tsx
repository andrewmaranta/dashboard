import React, { useState } from 'react';
import { api } from '@/services/api';
import { Task } from '@/types';
import { Trash2 } from 'lucide-react';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface TasksViewProps {
  data: {
    tasks: Task[];
  };
}

const ATTRIBUTES = ['PWR', 'AGI', 'VIT', 'KNW', 'WEL', 'SOC'];

export const TasksView: React.FC<TasksViewProps> = ({ data }) => {
  const [tasks, setTasks] = useState<Task[]>(data.tasks);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedAttr, setSelectedAttr] = useState<string>('');

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      const task = await api.addTask(newTaskText, selectedAttr || undefined);
      setTasks([...tasks, task]);
      setNewTaskText('');
      setSelectedAttr('');
    } catch (e) { console.error(e); }
  };

  const handleToggleTask = async (id: number) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    try { await api.toggleTask(id); } catch (e) { setTasks(tasks); }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Discard this quest?')) return;
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="noto-emoji text-6xl text-cozy-warm mb-2 block animate-float">{M('📜')}</span>
        <h2 className="text-3xl font-bold text-cozy-text-dark">Quest Journal</h2>
        <p className="text-cozy-text-muted font-bold text-sm uppercase tracking-widest">Embark on your daily adventures</p>
      </div>

      {/* Add Task Bar */}
      <div className="bg-cozy-panel p-6 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
           <span className="noto-emoji absolute left-4 top-1/2 -translate-y-1/2 text-cozy-text-dim text-xl">{M('🔖')}</span>
           <input 
            type="text" 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Write a new quest..."
            className="w-full bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-2xl pl-12 pr-4 py-4 text-cozy-text placeholder-cozy-text-dim focus:outline-none focus:border-cozy-accent transition-colors font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={selectedAttr}
            onChange={(e) => setSelectedAttr(e.target.value)}
            className="bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-2xl px-4 py-4 text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent"
          >
            <option value="">Attribute</option>
            {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
          </select>
          
          <button 
            onClick={handleAddTask}
            className="bg-cozy-warm text-white px-8 py-4 rounded-2xl font-bold shadow-[0_4px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
          >
            <span className="noto-emoji text-xl animate-wiggle">{M('⚔')}</span>
            <span>Accept</span>
          </button>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-cozy-panel/40 border-2 border-dashed border-cozy-border p-12 rounded-[2.5rem] text-center text-cozy-text-dim font-bold">
            No active quests. Time to find a new adventure!
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`group bg-cozy-panel p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
                task.completed 
                  ? 'border-cozy-bg-alt opacity-60 shadow-none grayscale' 
                  : 'border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center gap-6 flex-1">
                <button 
                  onClick={() => handleToggleTask(task.id)} 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                    task.completed ? 'bg-cozy-accent border-cozy-accent text-white' : 'border-cozy-border text-transparent hover:border-cozy-accent'
                  }`}
                >
                  <span className="noto-emoji text-2xl">{task.completed ? M('✓') : ''}</span>
                </button>
                
                <div className="flex flex-col">
                  {task.attribute && (
                    <span className="text-[10px] font-bold text-cozy-accent uppercase tracking-widest mb-1">
                      {task.attribute} Experience
                    </span>
                  )}
                  <span className={`text-xl font-bold ${task.completed ? 'line-through text-cozy-text-dim' : 'text-cozy-text'}`}>
                    {task.text}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {task.completed && <span className="noto-emoji text-cozy-gold text-xl">{M('✨')}</span>}
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-cozy-text-dim hover:text-cozy-warm transition-all p-2 rounded-xl hover:bg-cozy-warm/10"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
