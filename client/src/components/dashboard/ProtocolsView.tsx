import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Settings2, Trash2, Check, X, Plus, ArrowRight } from 'lucide-react';

const ATTRIBUTES = ['PWR', 'DSC', 'VIT', 'KNW', 'WEL', 'SOC'];

export const ProtocolsView: React.FC = () => {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
  const [trigger, setTrigger] = useState('');
  const [actions, setActions] = useState<string[]>(['']);
  const [difficulty, setDifficulty] = useState('medium');
  const [attribute, setAttribute] = useState('DSC');

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTrigger, setEditTrigger] = useState('');
  const [editActions, setEditActions] = useState<string[]>(['']);
  const [editDifficulty, setEditDifficulty] = useState('medium');
  const [editAttribute, setEditAttribute] = useState('DSC');

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      const data = await api.getProtocols();
      setProtocols(data);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    const validActions = actions.filter(a => a.trim());
    if (!trigger.trim() || validActions.length === 0) return;
    try {
      await api.createProtocol(trigger, validActions, difficulty, attribute);
      setTrigger('');
      setActions(['']);
      setShowAdd(false);
      fetchProtocols();
    } catch (e) { console.error(e); }
  };

  const handleLog = async (id: number, hit: boolean) => {
    try {
      await api.logProtocol(id, hit);
      fetchProtocols();
    } catch (e) { console.error(e); }
  };

  const parseActions = (actionVal: any): string[] => {
    if (!actionVal) return [''];
    try {
      const parsed = JSON.parse(actionVal);
      return Array.isArray(parsed) ? parsed : [actionVal];
    } catch (e) {
      return [actionVal];
    }
  };

  const startEditing = (p: any) => {
    setEditingId(p.id);
    setEditTrigger(p.trigger);
    setEditActions(parseActions(p.action));
    setEditDifficulty(p.difficulty);
    setEditAttribute(p.attribute);
  };

  const handleUpdate = async (id: number) => {
    const validActions = editActions.filter(a => a.trim());
    try {
      await api.updateProtocol(id, editTrigger, validActions, editDifficulty, editAttribute);
      setEditingId(null);
      fetchProtocols();
    } catch (e) { console.error(e); }
  };

  const handleAddActionStep = (isEdit: boolean) => {
    if (isEdit) setEditActions([...editActions, '']);
    else setActions([...actions, '']);
  };

  const handleRemoveActionStep = (index: number, isEdit: boolean) => {
    if (isEdit) {
      if (editActions.length > 1) {
        setEditActions(editActions.filter((_, i) => i !== index));
      }
    } else {
      if (actions.length > 1) {
        setActions(actions.filter((_, i) => i !== index));
      }
    }
  };

  const handleActionChange = (index: number, value: string, isEdit: boolean) => {
    if (isEdit) {
      const newActions = [...editActions];
      newActions[index] = value;
      setEditActions(newActions);
    } else {
      const newActions = [...actions];
      newActions[index] = value;
      setActions(newActions);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this protocol?')) return;
    try {
      await api.archiveProtocol(id);
      fetchProtocols();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-xl font-bold text-cozy-text-dark">Habit Protocols</h3>
          <p className="text-xs text-cozy-text-dim font-bold uppercase tracking-widest">If-Then Implementation Intentions</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cozy-bg-alt hover:bg-cozy-accent hover:text-white text-cozy-text-dim p-2 rounded-xl transition-all"
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <div className="bg-cozy-panel p-6 rounded-2xl border-2 border-dashed border-cozy-border space-y-4 animate-pop">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-cozy-text-dim uppercase">If (Trigger)</label>
              <input 
                type="text" 
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g. I finish dinner"
                className="w-full bg-cozy-bg-alt/50 dark:bg-black/20 border-2 border-cozy-border rounded-xl px-4 py-3 text-sm font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-cozy-text-dim uppercase">Then (Actions)</label>
                <button 
                  onClick={() => handleAddActionStep(false)}
                  className="text-[10px] font-bold text-cozy-accent hover:underline flex items-center gap-1"
                >
                  <Plus size={10} /> Add Step
                </button>
              </div>
              <div className="space-y-2">
                {actions.map((act, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={act}
                      onChange={(e) => handleActionChange(idx, e.target.value, false)}
                      placeholder={`Step ${idx + 1}`}
                      className="flex-1 bg-cozy-bg-alt/50 dark:bg-black/20 border-2 border-cozy-border rounded-xl px-4 py-2 text-sm font-bold text-cozy-text dark:text-white focus:outline-none focus:border-cozy-accent transition-colors"
                    />
                    {actions.length > 1 && (
                      <button onClick={() => handleRemoveActionStep(idx, false)} className="text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl px-3 py-2 text-xs font-bold text-cozy-text dark:text-white"
            >
              <option value="easy">Easy (10 XP)</option>
              <option value="medium">Medium (25 XP)</option>
              <option value="hard">Hard (50 XP)</option>
            </select>
            <select 
              value={attribute} 
              onChange={(e) => setAttribute(e.target.value)}
              className="bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl px-3 py-2 text-xs font-bold text-cozy-text dark:text-white"
            >
              {ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button 
              onClick={handleCreate}
              className="flex-1 bg-cozy-accent text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-all"
            >
              Create Protocol
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {protocols.length === 0 && !showAdd && (
          <div className="text-center py-12 text-cozy-text-dim italic font-bold">
            No protocols defined. Add an "If-Then" rule to automate your habits.
          </div>
        )}

        {protocols.map(p => {
          const isEditing = editingId === p.id;

          return (
            <div key={p.id} className="bg-cozy-panel p-5 rounded-[1.5rem] border-2 border-cozy-border shadow-sm group">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={editTrigger} 
                      onChange={(e) => setEditTrigger(e.target.value)}
                      className="bg-cozy-bg-alt dark:bg-black/20 border-2 border-cozy-border rounded-xl p-2 font-bold text-cozy-text dark:text-white"
                    />
                    <div className="space-y-2">
                       {editActions.map((act, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            value={act} 
                            onChange={(e) => handleActionChange(idx, e.target.value, true)}
                            className="flex-1 bg-cozy-bg-alt/50 dark:bg-black/20 border-2 border-cozy-border rounded-xl p-2 font-bold text-cozy-text dark:text-white"
                          />
                          <button onClick={() => handleRemoveActionStep(idx, true)} className="text-red-400"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button 
                        onClick={() => handleAddActionStep(true)}
                        className="text-[10px] font-bold text-cozy-accent hover:underline flex items-center gap-1"
                      >
                        <Plus size={10} /> Add Step
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-cozy-text-dim">Cancel</button>
                    <button onClick={() => handleUpdate(p.id)} className="px-4 py-2 bg-cozy-accent text-white rounded-xl text-xs font-bold">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-cozy-bg-alt text-cozy-text-dim`}>
                        {p.attribute} • {p.difficulty}
                      </span>
                      <div className="flex-1 h-[2px] bg-cozy-border/50"></div>
                      <span className="text-[10px] font-bold text-cozy-accent">
                        Logged: {p.hits || 0} times
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-bold text-cozy-text">
                      <span className="text-cozy-accent">IF</span>
                      <span className="bg-cozy-bg-alt/50 dark:bg-black/20 px-3 py-1 rounded-lg border border-cozy-border/50">{p.trigger}</span>
                      <ArrowRight size={16} className="text-cozy-text-dim" />
                      <span className="text-cozy-accent">THEN</span>
                      <div className="flex flex-col gap-1">
                        {parseActions(p.action).map((act, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {parseActions(p.action).length > 1 && <span className="text-[10px] text-cozy-text-dim">{idx + 1}.</span>}
                            <span className="bg-cozy-bg-alt/50 dark:bg-black/20 px-3 py-1 rounded-lg border border-cozy-border/50">{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => handleLog(p.id, true)}
                      className="flex-1 md:flex-none py-3 px-6 bg-cozy-accent/10 text-cozy-accent hover:bg-cozy-accent hover:text-white border-2 border-cozy-accent/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={18} strokeWidth={3} />
                      Log Action
                    </button>
                    
                    <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(p)} className="text-cozy-text-dim hover:text-cozy-accent"><Settings2 size={16} /></button>
                      <button onClick={() => handleArchive(p.id)} className="text-cozy-text-dim hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
