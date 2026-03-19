import React, { useState, useEffect } from 'react';
import { api, socket } from '@/services/api';
import { Task, Belief, TaskTemplate } from '@/types';
import { Trash2, Eraser, Settings2, Check, X, ShieldAlert, List, Plus, Minus, Repeat, Scroll, Bookmark, BookmarkPlus } from 'lucide-react';
import { ProtocolsView } from './ProtocolsView';
import { Toast, ToastType } from '../ui/Toast';
import confetti from 'canvas-confetti';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface TasksViewProps {
  data: {
    tasks: Task[];
  };
}

const ATTRIBUTES = ['PWR', 'DSC', 'VIT', 'KNW', 'WEL', 'SOC'];

const ATTR_COLORS: Record<string, string> = {
  PWR: 'bg-[var(--cozy-stat-power)]/10 text-[var(--cozy-stat-power)]',
  DSC: 'bg-[var(--cozy-stat-discipline)]/15 text-[var(--cozy-stat-discipline)]',
  VIT: 'bg-[var(--cozy-stat-vitality)]/10 text-[var(--cozy-stat-vitality)]',
  KNW: 'bg-[var(--cozy-stat-knowledge)]/10 text-[var(--cozy-stat-knowledge)]',
  WEL: 'bg-[var(--cozy-stat-wellness)]/20 text-[var(--cozy-stat-wellness)]',
  SOC: 'bg-[var(--cozy-stat-social)]/10 text-[var(--cozy-stat-social)]',
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

  // SUDS Modal State
  const [sudsModalTask, setSudsModalTask] = useState<Task | null>(null);
  const [sudsBefore, setSudsBefore] = useState(50);
  const [sudsAfter, setSudsAfter] = useState(50);

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

    const handleToggleTask = async (task: Task) => {
      if (!task.completed) {
        setSudsModalTask(task);
        setSudsBefore(50);
        setSudsAfter(50);
        return;
      }
  
      try {
        await api.toggleTask(task.id);
      } catch (e) { console.error(e); }
    };
  
    const handleSudsSubmit = async () => {
      if (!sudsModalTask) return;
      try {
        await api.toggleTask(sudsModalTask.id, sudsBefore, sudsAfter);
        
        // Delight: Celebrate hard/epic quests with a subtle confetti burst
        if (sudsModalTask.difficulty === 'epic' || sudsModalTask.difficulty === 'hard') {
          confetti({
            particleCount: sudsModalTask.difficulty === 'epic' ? 80 : 40,
            spread: 60,
            origin: { y: 0.9 },
            colors: ['#8da08e', '#d68060', '#e9c46a'],
            disableForReducedMotion: true
          });
        }
        
        setSudsModalTask(null);
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
        <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-wrap justify-center gap-1 sm:gap-2">
          <button 
            onClick={() => setView('quests')}
            className={`
              px-4 py-2 sm:px-6 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm
              ${view === 'quests' ? 'cozy-button !scale-105' : 'cozy-button-ghost'}
            `}
          >
            <Scroll size={16} />
            Daily Quests
          </button>
          <button 
            onClick={() => setView('protocols')}
            className={`
              px-4 py-2 sm:px-6 sm:py-3 rounded-[1.2rem] sm:rounded-[1.5rem] text-xs sm:text-sm
              ${view === 'protocols' ? 'cozy-button !bg-cozy-gold !shadow-[0_4px_0_0_#dcb346] !scale-105' : 'cozy-button-ghost'}
            `}
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
                className={`
                  rounded-xl text-xs px-4 py-2
                  ${showTemplates 
                    ? 'cozy-button !bg-transparent !text-cozy-accent !border-cozy-accent !shadow-none' 
                    : 'cozy-button-secondary !bg-cozy-panel !border-cozy-border hover:!border-cozy-accent/30'}
                `}
              >
                <Bookmark size={14} />
                Templates
              </button>
              <button 
                onClick={handleClearCompleted}
                disabled={!hasCompleted}
                className={`
                  rounded-xl text-xs px-4 py-2
                  ${hasCompleted 
                    ? 'cozy-button-secondary !bg-cozy-panel !border-cozy-border hover:!border-red-200 hover:!text-red-500' 
                    : 'opacity-50 cursor-not-allowed cozy-button-ghost hover:!bg-transparent'}
                `}
              >
                <Eraser size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Templates Panel */}
          {showTemplates && (
            <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-cozy-text-dark uppercase tracking-widest">Saved Templates</h4>
                <button onClick={() => setShowTemplates(false)} className="text-cozy-text-dim hover:text-cozy-accent"><X size={16} /></button>
              </div>
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                  <span className="noto-emoji text-3xl mb-3 animate-float">{M('🗂')}</span>
                  <p className="text-sm font-bold text-cozy-text-muted">No templates saved yet.</p>
                  <p className="text-[10px] text-cozy-text-dim font-bold uppercase tracking-widest mt-1">Mark a quest as a template to use it here.</p>
                </div>
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
                        className="cozy-button-icon hover:!text-red-500 sm:opacity-0 group-hover:opacity-100"
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
          <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
              <div className="flex-1 w-full relative">
                 <span className="noto-emoji absolute left-4 top-1/2 -translate-y-1/2 text-cozy-text-dim text-lg sm:text-xl">{M('🔖')}</span>
                 <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Write a new quest..."
                  className="cozy-input pl-11 sm:pl-12"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              
              <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="cozy-input md:w-32 text-center !px-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select 
                  value={selectedAttr}
                  onChange={(e) => setSelectedAttr(e.target.value)}
                  className="cozy-input md:w-32 text-center !px-2"
                >
                  {ATTRIBUTES.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                </select>
                
                <button 
                  onClick={handleAddTask}
                  className="flex-1 md:flex-none cozy-button px-6 sm:px-8 py-3 sm:py-4 !bg-[var(--cozy-warm)] !shadow-[0_4px_0_0_#d97746]"
                >
                  <span className="noto-emoji text-lg sm:text-xl animate-wiggle">{M('⚔')}</span>
                  <span className="hidden sm:inline text-sm sm:text-base">Accept</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="cozy-button-ghost w-full py-2 text-xs"
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
                                              className="cozy-input !text-base"
                                              autoFocus
                                            />                      
                      {beliefs.length > 0 && (
                        <select
                          value={editBelief || ''}
                          onChange={(e) => setEditBelief(e.target.value ? parseInt(e.target.value) : null)}
                          className="cozy-input !text-xs !py-2"
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
                            className="cozy-input !text-xs !py-2 flex-1"
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
                            className="cozy-button-icon hover:!text-red-500 hover:!bg-red-500/10"
                            title="Delete quest"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="h-6 w-[2px] bg-cozy-border mx-1" />
                          <button 
                            onClick={cancelEditing}
                            className="flex items-center gap-2 cozy-button-ghost"
                          >
                            <X size={16} /> Cancel
                          </button>
                          <button 
                            onClick={handleUpdateTask}
                            className="flex items-center gap-2 cozy-button px-4 py-2"
                          >
                            <Check size={16} /> Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode UI */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 sm:gap-6 w-full">
                        <button 
                          onClick={() => handleToggleTask(task)} 
                          role="checkbox"
                          aria-checked={!!task.completed}
                          aria-label={`Toggle task: ${task.text}`}
                          className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center border-2 transition-all duration-200 active:scale-90 ${
                            task.completed ? 'bg-cozy-accent border-cozy-accent text-white shadow-[0_0_12px_rgba(141,160,142,0.4)]' : 'border-cozy-border text-transparent hover:border-cozy-accent hover:bg-cozy-accent/5'
                          }`}
                        >
                          <span className={`noto-emoji text-xl sm:text-2xl transition-transform duration-300 ${task.completed ? 'scale-100' : 'scale-0'}`}>{M('✓')}</span>
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

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 self-end sm:self-center">
                          {!task.completed && (
                            <button 
                              onClick={() => handleSaveAsTemplate(task)}
                              className="sm:opacity-0 sm:group-hover:opacity-100 cozy-button-icon hover:!text-cozy-gold hover:!bg-cozy-gold/10"
                              title="Save as Template"
                            >
                              <BookmarkPlus size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => startEditing(task)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 cozy-button-icon"
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

      {/* SUDS Tracking Modal */}
      {sudsModalTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-cozy-panel p-6 sm:p-8 rounded-3xl border-2 border-cozy-border max-w-sm w-full shadow-2xl animate-pop">
            <h3 className="text-xl font-bold mb-2">Track Comfort (SUDS)</h3>
            <p className="text-sm text-cozy-text-dim mb-6">
              Rate your distress or anxiety level before and after this activity (0 = completely calm, 100 = maximum panic).
            </p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="flex justify-between text-sm font-bold mb-2 text-cozy-text">
                  <span>Before Task</span>
                  <span className="text-cozy-accent">{sudsBefore}</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={sudsBefore} 
                  onChange={(e) => setSudsBefore(parseInt(e.target.value))}
                  className="w-full accent-cozy-accent"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-bold mb-2 text-cozy-text">
                  <span>After Task</span>
                  <span className="text-cozy-accent">{sudsAfter}</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={sudsAfter} 
                  onChange={(e) => setSudsAfter(parseInt(e.target.value))}
                  className="w-full accent-cozy-accent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSudsModalTask(null)}
                className="flex-1 py-3 rounded-xl font-bold border-2 border-cozy-border text-cozy-text hover:bg-cozy-bg-alt transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSudsSubmit}
                className="flex-1 py-3 rounded-xl font-bold border-2 border-cozy-accent bg-cozy-accent text-white shadow-[0_4px_0_0_var(--cozy-accent-dark)] active:shadow-none active:translate-y-1 transition-all"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
