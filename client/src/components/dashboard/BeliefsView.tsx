import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Belief } from '@/types';
import { Brain, Plus, Archive, ShieldAlert, Edit2, Trash2, Check, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';

export const BeliefsView: React.FC = () => {
  const [beliefs, setBeliefs] = useState<Belief[]>([]);
  const [newBeliefText, setNewBeliefText] = useState('');
  const [confidence, setConfidence] = useState(80);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editConfidence, setEditConfidence] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Evidence State
  const [evidenceText, setEvidenceText] = useState('');
  const [addingEvidenceId, setAddingEvidenceId] = useState<number | null>(null);

  useEffect(() => {
    fetchBeliefs();
  }, []);

  const fetchBeliefs = async () => {
    try {
      const data = await api.getBeliefs();
      setBeliefs(data);
    } catch (e) { console.error(e); }
  };

  const handleCreateBelief = async () => {
    if (!newBeliefText.trim()) return;
    try {
      await api.createBelief(newBeliefText, undefined, confidence);
      setNewBeliefText('');
      setConfidence(80);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const startEditing = (b: Belief) => {
    setEditingId(b.id);
    setEditText(b.text);
    setEditConfidence(b.confidence);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.updateBelief(id, editText, editConfidence);
      setEditingId(null);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this belief?')) return;
    try {
      await api.archiveBelief(id);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this belief?')) return;
    try {
      await api.deleteBelief(id);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const handleAddEvidence = async (beliefId: number) => {
    if (!evidenceText.trim()) return;
    try {
      await api.addEvidence(beliefId, evidenceText, 'manual');
      setEvidenceText('');
      setAddingEvidenceId(null);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const handleDeleteEvidence = async (id: number) => {
    if (!confirm('Delete this evidence?')) return;
    try {
      await api.deleteEvidence(id);
      fetchBeliefs();
    } catch (e) { console.error(e); }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pop pb-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-cozy-text-dark/5 rounded-full mb-2">
          <Brain size={48} className="text-cozy-text-dark" />
        </div>
        <h2 className="text-3xl font-bold text-cozy-text-dark">Belief Revision Map</h2>
        <p className="text-cozy-text-dim font-bold text-sm uppercase tracking-widest max-w-lg mx-auto">
          Identify "Fixed Priors" and dismantle them with evidence.
        </p>
      </div>

      {/* Add New Belief */}
      <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] space-y-6">
        <div className="flex items-center gap-3 text-cozy-text-dim">
          <ShieldAlert size={20} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Identify a Limiting Belief</h3>
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            value={newBeliefText}
            onChange={(e) => setNewBeliefText(e.target.value)}
            placeholder='e.g., "I am not a disciplined person"'
            className="cozy-input !text-lg !p-4"
          />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-cozy-text-muted">How true does this feel right now? (Prior Probability)</span>
              <span className="text-xs font-bold text-cozy-accent">{confidence}%</span>
            </div>
            <input 
              type="range" min="0" max="100" step="5"
              value={confidence} 
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full h-2 bg-cozy-bg-alt rounded-lg cursor-pointer accent-cozy-accent"
            />
          </div>

          <button 
            onClick={handleCreateBelief}
            className="w-full cozy-button py-4 !bg-cozy-text-dark !shadow-[0_4px_0_0_rgba(0,0,0,0.2)]"
          >
            <Plus size={18} />
            Map This Belief
          </button>
        </div>
      </div>

      {/* Belief List */}
      <div className="grid grid-cols-1 gap-6">
        {beliefs.map(belief => {
          const isEditing = editingId === belief.id;
          const isExpanded = expandedId === belief.id;
          const shift = (belief.initial_confidence || belief.confidence) - belief.confidence;

          return (
            <div key={belief.id} className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] space-y-6 group">
              
              {/* Header / Edit Mode */}
              <div className="flex justify-between items-start gap-4">
                {isEditing ? (
                  <div className="flex-1 space-y-4">
                    <input 
                      type="text" 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="cozy-input !p-3"
                    />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-cozy-text-muted">Adjust Current Confidence</span>
                        <span className="text-xs font-bold text-cozy-accent">{editConfidence}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={editConfidence} 
                        onChange={(e) => setEditConfidence(parseInt(e.target.value))}
                        className="w-full h-2 bg-cozy-bg-alt rounded-lg cursor-pointer accent-cozy-accent"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEditing} className="cozy-button-ghost !px-4 !py-2 !text-xs">Cancel</button>
                      <button onClick={() => handleUpdate(belief.id)} className="cozy-button !px-4 !py-2 !text-xs !shadow-sm">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-cozy-text leading-tight">"{belief.text}"</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cozy-text-dim">
                          Prior: {belief.initial_confidence || belief.confidence}%
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-cozy-accent">
                          Current: {belief.confidence}%
                        </span>
                        {shift > 0 && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                            ↓ {shift}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(belief)} className="cozy-button-icon" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleArchive(belief.id)} className="cozy-button-icon hover:!text-orange-500 hover:!bg-orange-500/10" title="Archive">
                        <Archive size={16} />
                      </button>
                      <button onClick={() => handleDelete(belief.id)} className="cozy-button-icon hover:!text-red-500 hover:!bg-red-500/10" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Visualization (Always Visible) */}
              {!isEditing && (
                <div className="relative pt-4 pb-2">
                  <div className="h-4 bg-cozy-bg-alt rounded-full overflow-hidden relative border border-cozy-border">
                    {/* Initial Marker */}
                    <div 
                      className="absolute top-0 w-1 h-full bg-cozy-text-dim/50 z-20"
                      style={{ left: `${belief.initial_confidence || belief.confidence}%` }}
                      title="Initial Belief Strength"
                    />
                    {/* Current Belief */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000"
                      style={{ width: `${belief.confidence}%` }}
                    />
                  </div>
                  {/* Slider Control Hint */}
                  <p className="text-[10px] text-center text-cozy-text-dim mt-2 italic">
                    Edit to manually adjust confidence based on evidence.
                  </p>
                </div>
              )}

              {/* Evidence Section */}
              <div className="border-t-2 border-cozy-border pt-4">
                <button 
                  onClick={() => toggleExpand(belief.id)}
                  className="w-full cozy-button-ghost !justify-between !px-2 !py-1 !text-xs"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={14} />
                    Evidence Log ({belief.evidence_count || 0})
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Add Evidence Form */}
                    {addingEvidenceId === belief.id ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={evidenceText}
                          onChange={(e) => setEvidenceText(e.target.value)}
                          placeholder="What evidence counters this belief?"
                          className="cozy-input !text-xs !px-3 !py-2 flex-1"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence(belief.id)}
                        />
                        <button onClick={() => handleAddEvidence(belief.id)} className="cozy-button !px-3 !py-2 !text-xs !rounded-xl">Add</button>
                        <button onClick={() => setAddingEvidenceId(null)} className="cozy-button-icon !rounded-xl"><X size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAddingEvidenceId(belief.id)}
                        className="cozy-button-secondary !border-dashed !border-cozy-border !bg-cozy-bg-alt/50 w-full !py-2 !text-xs !text-cozy-text-dim hover:!border-cozy-accent hover:!text-cozy-accent"
                      >
                        <Plus size={14} /> Add Manual Evidence
                      </button>
                    )}

                    {belief.evidence && belief.evidence.length > 0 ? (
                      belief.evidence.map(ev => (
                        <div key={`${ev.type}-${ev.id}`} className="flex items-center gap-3 p-3 bg-cozy-bg-alt/30 rounded-xl border border-cozy-border group relative">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            ev.type === 'task' ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'
                          }`}>
                            {ev.type === 'task' ? <Check size={10} strokeWidth={4} /> : <FileText size={10} strokeWidth={3} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-cozy-text">{ev.text}</p>
                            <p className="text-[10px] text-cozy-text-dim">{new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          {ev.type !== 'task' && (
                            <button 
                              onClick={() => handleDeleteEvidence(ev.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 cozy-button-icon hover:!text-red-500 sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-cozy-text-dim italic text-center py-2">No evidence logged yet. Complete tasks linked to this belief or add notes manually.</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
