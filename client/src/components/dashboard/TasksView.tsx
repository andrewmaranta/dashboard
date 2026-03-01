import React, { useState, useEffect } from 'react';
import { api, socket } from '@/services/api';
import { Task, Belief, TaskTemplate } from '@/types';
import { Trash2, Eraser, Settings2, Check, X, ShieldAlert, List, Plus, Minus, Repeat, Scroll, Bookmark, BookmarkPlus } from 'lucide-react';
import { ProtocolsView } from './ProtocolsView';
import { Toast, ToastType } from '../ui/Toast';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface TasksViewProps {
  data: {
    tasks: Task[];
  };
}

const ATTRIBUTES = ['PWR', 'DSC', 'VIT', 'KNW', 'WEL', 'SOC'];

const ATTR_COLORS: Record<string, string> = {
  PWR: 'bg-[#d68060]/10 text-[#d68060]', // Terracotta
  DSC: 'bg-[#e9c46a]/15 text-[#c7a24b]', // Gold
  VIT: 'bg-[#fb7185]/10 text-[#e11d48]', // Rose
  KNW: 'bg-[#818cf8]/10 text-[#4f46e5]', // Indigo
  WEL: 'bg-[#8da08e]/20 text-[#6e7f6f]', // Sage
  SOC: 'bg-[#fbbf24]/10 text-[#b45309]', // Amber
};

export const TasksView: React.FC<TasksViewProps> = ({ data }) => {
  const { tasks } = data;
  const [view, setView] = useState<'quests' | 'protocols'>('quests');
  const [beliefs, setBeliefs] = useState<Belief[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  
  // Creation State
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedAttr, setSelectedAttr] = useState<string>('DSC');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [selectedBelief, setSelectedBelief] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [ifThen, setIfThen] = useState('');
  
  // Ladder Creation (New Task)
  const [ladderSteps, setLadderSteps] = useState<{ text: string, completed: boolean, distress: number }[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [newStepDistress, setNewStepDistress] = useState(1);

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editAttr, setEditAttr] = useState('DSC');
  const [editDiff, setEditDiff] = useState('medium');
  const [editBelief, setEditBelief] = useState<number | null>(null);
  const [editIfThen, setEditIfThen] = useState('');
  
  // Ladder Editing (Existing Task)
  const [editSteps, setEditSteps] = useState<{ text: string, completed: boolean, distress: number }[]>([]);
  const [editStepText, setEditStepText] = useState('');
  const [editStepDistress, setEditStepDistress] = useState(1);

  useEffect(() => {
    fetchBeliefs();
    fetchTemplates();

    socket.on('templatesUpdated', (newTemplates: TaskTemplate[]) => {
      setTemplates(newTemplates);
    });

    return () => {
      socket.off('templatesUpdated');
    };
  }, []);

  const fetchBeliefs = async () => {
    try {
      const data = await api.getBeliefs();
      setBeliefs(data);
    } catch (e) { console.error(e); }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (e) { console.error(e); }
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setLadderSteps([...ladderSteps, { text: newStepText, completed: false, distress: newStepDistress }]);
    setNewStepText('');
    setNewStepDistress(1);
  };

  const handleAddEditStep = () => {
    if (!editStepText.trim()) return;
    setEditSteps([...editSteps, { text: editStepText, completed: false, distress: editStepDistress }]);
    setEditStepText('');
    setEditStepDistress(1);
  };

  const removeStep = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditSteps(editSteps.filter((_, i) => i !== index));
    } else {
      setLadderSteps(ladderSteps.filter((_, i) => i !== index));
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      await api.addTask(newTaskText, selectedAttr, difficulty, ifThen, selectedBelief || undefined, ladderSteps);
      setNewTaskText('');
      setDifficulty('medium');
      setSelectedBelief(null);
      setLadderSteps([]);
      setIfThen('');
      setShowOptions(false);
    } catch (e) { console.error(e); }
  };

  const handleToggleTask = async (id: number) => {
    try { 
      await api.toggleTask(id); 
    } catch (e) { console.error(e); }
  };

  const handleToggleStep = async (task: Task, stepIndex: number) => {
    const updatedSteps = [...(task.steps || [])];
    updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;
    try {
      await api.updateTask(task.id, task.text, task.attribute, task.difficulty, task.if_then, task.belief_id, updatedSteps);
    } catch (e) { console.error(e); }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    setEditAttr(task.attribute || '');
    setEditDiff(task.difficulty || 'medium');
    setEditBelief(task.belief_id || null);
    setEditSteps(task.steps || []);
    setEditIfThen(task.if_then || '');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditSteps([]);
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !editTaskText.trim()) return;
    try {
      await api.updateTask(editingTaskId, editTaskText, editAttr || undefined, editDiff, editIfThen, editBelief || undefined, editSteps);
      setEditingTaskId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Discard this quest?')) return;
    try {
      await api.deleteTask(id);
      if (editingTaskId === id) setEditingTaskId(null);
    } catch (e) { console.error(e); }
  };

  const handleClearCompleted = async () => {
    try {
      await api.archiveCompleted();
    } catch (e) { console.error(e); }
  };

  const handleSaveAsTemplate = async (task: Task) => {
    try {
      await api.addTemplate(
        task.text, 
        task.attribute, 
        task.difficulty, 
        task.if_then, 
        task.belief_id, 
        task.steps?.map(s => ({ ...s, completed: false }))
      );
      setToast({ message: 'Quest saved as template!', type: 'success' });
    } catch (e) { 
      console.error(e); 
      setToast({ message: 'Failed to save template', type: 'error' });
    }
  };

  const handleApplyTemplate = (template: TaskTemplate) => {
    setNewTaskText(template.text);
    setSelectedAttr(template.attribute || 'DSC');
    setDifficulty(template.difficulty || 'medium');
    setSelectedBelief(template.belief_id || null);
    setLadderSteps(template.steps?.map(s => ({ ...s, completed: false })) || []);
    setShowTemplates(false);
    setShowOptions(true);
  };

  const handleDeleteTemplate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this template?')) return;
    try {
      await api.deleteTemplate(id);
    } catch (e) { console.error(e); }
  };

  // Sort tasks: Active first, Completed last
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const hasCompleted = tasks.some(t => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pop pb-12 relative">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Sub-Nav Toggle */}
      <div className="flex justify-center">
        <div className="bg-cozy-panel p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] flex flex-wrap justify-center gap-1 sm:gap-2">
          <button 
            onClick={() => setView('quests')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              view === 'quests' 
                ? 'bg-cozy-accent text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Scroll size={16} />
            Daily Quests
          </button>
          <button 
            onClick={() => setView('protocols')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              view === 'protocols' 
                ? 'bg-cozy-gold text-white shadow-lg scale-105' 
                : 'text-cozy-text-muted hover:bg-cozy-bg-alt'
            }`}
          >
            <Repeat size={16} />
            If-Then Protocols
          </button>
        </div>
      </div>

      {view === 'protocols' && <ProtocolsView />}

      {view === 'quests' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="text-xl font-bold text-cozy-text-dark">Quest Journal</h3>
              <p className="text-xs text-cozy-text-dim font-bold uppercase tracking-widest">Embark on your daily adventures</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className={`flex items-center gap-2 px-4 py-2 bg-cozy-panel border-2 border-cozy-border rounded-xl text-xs font-bold transition-all shadow-sm active:shadow-none active:translate-y-1 ${
                  showTemplates 
                    ? 'border-cozy-accent text-cozy-accent' 
                    : 'text-cozy-text-muted hover:border-cozy-accent hover:text-cozy-accent cursor-pointer'
                }`}
              >
                <Bookmark size={14} />
                Templates
              </button>
              <button 
                onClick={handleClearCompleted}
                disabled={!hasCompleted}
                className={`flex items-center gap-2 px-4 py-2 bg-cozy-panel border-2 border-cozy-border rounded-xl text-xs font-bold transition-all shadow-sm active:shadow-none active:translate-y-1 ${
                  hasCompleted 
                    ? 'text-cozy-text-muted hover:border-cozy-accent hover:text-cozy-accent cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Eraser size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Templates Panel */}
          {showTemplates && (
            <div className="bg-cozy-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-cozy-border shadow-[0_4px_0_0_var(--cozy-border)] animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-cozy-text-dark uppercase tracking-widest">Saved Templates</h4>
                <button onClick={() => setShowTemplates(false)} className="text-cozy-text-dim hover:text-cozy-accent"><X size={16} /></button>
              </div>
              {templates.length === 0 ? (
                <p className="text-xs text-cozy-text-dim italic text-center py-4">No templates saved yet. Mark a quest as a template to see it here!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="flex items-center gap-3 p-3 bg-cozy-bg-alt/30 border-2 border-transparent hover:border-cozy-accent/30 rounded-xl text-left transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${ATTR_COLORS[tpl.attribute || ''] || 'bg-cozy-accent/10 text-cozy-accent'}`}>
                        {tpl.attribute}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-cozy-text truncate">{tpl.text}</div>
                        <div className="text-[10px] text-cozy-text-dim uppercase">{tpl.difficulty}</div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-cozy-text-dim hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Task Bar */}
          <div className="bg-cozy-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
              <div className="flex-1 w-full relative">
                 <span className="noto-emoji absolute left-4 top-1/2 -translate-y-1/2 text-cozy-text-dim text-lg sm:text-xl">{M('🔖')}</span>
                 <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Write a new quest..."
                  className="w-full bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl sm:rounded-2xl pl-11 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base text-cozy-text dark:text-white placeholder-cozy-text-dim focus:outline-none focus:border-cozy-accent transition-colors font-bold"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              
              <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="flex-1 md:flex-none bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-base text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent appearance-none text-center"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select 
                  value={selectedAttr}
                  onChange={(e) => setSelectedAttr(e.target.value)}
                  className="flex-1 md:flex-none bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-base text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent appearance-none text-center"
                >
                  {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                </select>
                
                <button 
                  onClick={handleAddTask}
                  className="flex-1 md:flex-none bg-cozy-warm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-[0_4px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <span className="noto-emoji text-lg sm:text-xl animate-wiggle">{M('⚔')}</span>
                  <span className="hidden sm:inline text-sm sm:text-base">Accept</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs font-bold text-cozy-text-dim hover:text-cozy-accent transition-colors flex items-center gap-2 w-full justify-center py-2"
              >
                {showOptions ? <X size={14} /> : <Settings2 size={14} />}
                {showOptions ? 'Collapse Options' : 'Add Beliefs & Ladders'}
              </button>

              {showOptions && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-4 pt-2 border-t border-dashed border-cozy-border/50">
                  {/* Belief Linking */}
                  {beliefs.length > 0 && (
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-cozy-text-dim" />
                      <select
                        value={selectedBelief || ''}
                        onChange={(e) => setSelectedBelief(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl p-2 text-xs font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent"
                      >
                        <option value="">-- Does this challenge a limiting belief? --</option>
                        {beliefs.map(b => (
                          <option key={b.id} value={b.id}>{b.text}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ladder Builder */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cozy-text-dim uppercase tracking-widest">
                      <List size={14} />
                      Behavioral Stepladder
                    </div>
                    {ladderSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-cozy-bg-alt/20 p-2 rounded-lg">
                        <span className="text-xs font-bold text-cozy-text flex-1">{idx + 1}. {step.text}</span>
                        <span className="text-[10px] font-bold text-cozy-accent bg-cozy-accent/10 px-2 py-0.5 rounded-full">Distress: {step.distress}/10</span>
                        <button onClick={() => removeStep(idx)} className="text-cozy-text-dim hover:text-red-500"><X size={12} /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        placeholder="Add micro-step..."
                        className="flex-1 bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl px-3 py-2 text-xs font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                      />
                      <div className="flex items-center gap-1 bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl px-2">
                        <button onClick={() => setNewStepDistress(Math.max(1, newStepDistress - 1))} className="p-1 hover:text-cozy-accent"><Minus size={10} /></button>
                        <span className="text-xs font-bold w-4 text-center">{newStepDistress}</span>
                        <button onClick={() => setNewStepDistress(Math.min(10, newStepDistress + 1))} className="p-1 hover:text-cozy-accent"><Plus size={10} /></button>
                      </div>
                      <button onClick={handleAddStep} className="px-3 py-2 bg-cozy-bg-alt/50 hover:bg-cozy-accent hover:text-white border-2 border-dashed border-cozy-border rounded-xl text-xs font-bold transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quest List */}
          <div className="space-y-3 sm:space-y-4">
            {sortedTasks.map(task => {
              const isEditing = editingTaskId === task.id;
              const taskDifficulty = task.difficulty || 'medium';
              const xpAmount = taskDifficulty === 'hard' ? 50 : taskDifficulty === 'medium' ? 25 : 10;
              const linkedBelief = beliefs.find(b => b.id === task.belief_id);
              const stepsCompleted = task.steps?.filter(s => s.completed).length || 0;
              const totalSteps = task.steps?.length || 0;
              const ladderProgress = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;
              
              return (
                <div 
                  key={task.id} 
                  className={`group bg-cozy-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col items-stretch gap-4 ${
                    task.completed 
                      ? 'border-cozy-bg-alt opacity-60 shadow-none grayscale' 
                      : isEditing 
                        ? 'border-cozy-accent shadow-[0_8px_0_0_var(--cozy-accent-dark)] scale-[1.02]'
                        : 'border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] hover:-translate-y-1'
                  }`}
                >
                  {isEditing ? (
                    /* Edit Mode UI */
                    <div className="flex flex-col gap-4 w-full animate-pop">
                      <input 
                        type="text"
                        value={editTaskText}
                        onChange={(e) => setEditTaskText(e.target.value)}
                        className="w-full bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-accent/30 rounded-xl px-4 py-2 text-base font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent"
                        autoFocus
                      />
                      
                      {beliefs.length > 0 && (
                        <select
                          value={editBelief || ''}
                          onChange={(e) => setEditBelief(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl p-2 text-xs font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent"
                        >
                          <option value="">-- No Linked Belief --</option>
                          {beliefs.map(b => (
                            <option key={b.id} value={b.id}>Challenges: {b.text}</option>
                          ))}
                        </select>
                      )}

                      {/* Edit Ladder */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-cozy-text-dim uppercase tracking-widest">
                          Edit Ladder Steps
                        </div>
                        {editSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-cozy-bg-alt/20 p-2 rounded-lg">
                            <span className="text-xs font-bold text-cozy-text flex-1">{idx + 1}. {step.text}</span>
                            <span className="text-[10px] font-bold text-cozy-accent bg-cozy-accent/10 px-2 py-0.5 rounded-full">Distress: {step.distress}</span>
                            <button onClick={() => removeStep(idx, true)} className="text-cozy-text-dim hover:text-red-500"><X size={12} /></button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editStepText}
                            onChange={(e) => setEditStepText(e.target.value)}
                            placeholder="Add step..."
                            className="flex-1 bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl px-3 py-2 text-xs font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddEditStep()}
                          />
                          <div className="flex items-center gap-1 bg-cozy-bg-alt/30 dark:bg-black/20 border-2 border-dashed border-cozy-border rounded-xl px-2">
                            <button onClick={() => setEditStepDistress(Math.max(1, editStepDistress - 1))} className="p-1 hover:text-cozy-accent"><Minus size={10} /></button>
                            <span className="text-xs font-bold w-4 text-center">{editStepDistress}</span>
                            <button onClick={() => setEditStepDistress(Math.min(10, editStepDistress + 1))} className="p-1 hover:text-cozy-accent"><Plus size={10} /></button>
                          </div>
                          <button onClick={handleAddEditStep} className="px-3 py-2 bg-cozy-bg-alt/50 hover:bg-cozy-accent hover:text-white border-2 border-dashed border-cozy-border rounded-xl text-xs font-bold transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dashed border-cozy-border">
                        <select 
                          value={editDiff}
                          onChange={(e) => setEditDiff(e.target.value)}
                          className="bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-lg px-3 py-1.5 text-xs font-bold text-cozy-accent outline-none"
                        >
                          <option value="easy">Easy (10 XP)</option>
                          <option value="medium">Medium (25 XP)</option>
                          <option value="hard">Hard (50 XP)</option>
                        </select>
                        <select 
                          value={editAttr}
                          onChange={(e) => setEditAttr(e.target.value)}
                          className="bg-cozy-bg-alt/50 border-2 border-cozy-border rounded-lg px-3 py-1.5 text-xs font-bold text-cozy-accent outline-none"
                        >
                          {ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        
                        <div className="flex items-center gap-2 ml-auto">
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-cozy-text-dim hover:text-cozy-warm transition-all"
                            title="Delete quest"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="h-6 w-[2px] bg-cozy-border mx-1" />
                          <button 
                            onClick={cancelEditing}
                            className="flex items-center gap-2 px-4 py-2 text-cozy-text-muted hover:text-cozy-text font-bold text-xs"
                          >
                            <X size={16} /> Cancel
                          </button>
                          <button 
                            onClick={handleUpdateTask}
                            className="flex items-center gap-2 px-6 py-2 bg-cozy-accent text-white rounded-xl font-bold text-xs shadow-[0_4px_0_0_var(--cozy-accent-dark)] active:translate-y-1 active:shadow-none transition-all"
                          >
                            <Check size={16} /> Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode UI */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 sm:gap-6 w-full">
                        <button 
                          onClick={() => handleToggleTask(task.id)} 
                          className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border-2 transition-all ${
                            task.completed ? 'bg-cozy-accent border-cozy-accent text-white' : 'border-cozy-border text-transparent hover:border-cozy-accent'
                          }`}
                        >
                          <span className="noto-emoji text-xl sm:text-2xl">{task.completed ? M('✓') : ''}</span>
                        </button>
                        
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                            <span className={`text-[10px] sm:text-[11px] cozy-tag uppercase leading-none ${
                              ATTR_COLORS[task.attribute || ''] || 'bg-cozy-accent/10 text-cozy-accent'
                            }`}>
                              {`+${xpAmount} ${task.attribute && task.attribute !== '0' ? task.attribute : 'XP'}`}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] cozy-tag uppercase leading-none ${
                              taskDifficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 
                              taskDifficulty === 'medium' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-green-500/10 text-green-600'
                            }`}>
                              {taskDifficulty}
                            </span>
                            {linkedBelief && (
                              <span className="text-[9px] sm:text-[10px] bg-purple-500/10 text-purple-500 cozy-tag uppercase leading-none flex items-center gap-1">
                                <ShieldAlert size={8} /> Belief Challenge
                              </span>
                            )}
                          </div>
                          <span className={`text-base sm:text-xl font-bold truncate ${task.completed ? 'line-through text-cozy-text-dim' : 'text-cozy-text'}`}>
                            {task.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 self-end sm:self-center">
                          {!task.completed && (
                            <button 
                              onClick={() => handleSaveAsTemplate(task)}
                              className="sm:opacity-0 sm:group-hover:opacity-100 text-cozy-text-dim hover:text-cozy-gold transition-all p-2 rounded-xl hover:bg-cozy-gold/10"
                              title="Save as Template"
                            >
                              <BookmarkPlus size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => startEditing(task)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 text-cozy-text-dim hover:text-cozy-accent transition-all p-2 rounded-xl hover:bg-cozy-accent/10"
                            title="Edit Quest"
                          >
                            <Settings2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Ladder View (If Steps Exist) */}
                      {totalSteps > 0 && !task.completed && (
                        <div className="ml-11 sm:ml-16 bg-cozy-bg-alt/30 rounded-xl p-3 border border-cozy-border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest flex items-center gap-1">
                              <List size={10} /> Progress
                            </span>
                            <span className="text-[10px] font-bold text-cozy-accent">{Math.round(ladderProgress)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-cozy-bg rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-cozy-accent transition-all duration-500" style={{ width: `${ladderProgress}%` }}></div>
                          </div>
                          <div className="space-y-1.5">
                            {task.steps?.map((step, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleToggleStep(task, idx)}
                                className={`w-full flex items-center gap-3 text-left p-1.5 rounded-lg transition-colors ${
                                  step.completed ? 'opacity-50' : 'hover:bg-cozy-bg'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  step.completed ? 'bg-cozy-accent border-cozy-accent text-white' : 'border-cozy-text-dim'
                                }`}>
                                  {step.completed && <Check size={10} strokeWidth={4} />}
                                </div>
                                <span className={`text-xs font-bold ${step.completed ? 'line-through text-cozy-text-dim' : 'text-cozy-text'}`}>
                                  {step.text}
                                </span>
                                <span className="ml-auto text-[9px] font-bold text-cozy-text-dim bg-cozy-bg px-1.5 py-0.5 rounded">
                                  {step.distress}/10
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
