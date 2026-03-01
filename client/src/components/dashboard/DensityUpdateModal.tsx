import React, { useState } from 'react';
import { api } from '@/services/api';
import { X, Plus, Minus } from 'lucide-react';

const M = (emoji: string) => `${emoji}\uFE0E`;

const ATTRIBUTES = [
  { code: 'PWR', label: 'Power', icon: M('💪'), color: 'text-orange-500' },
  { code: 'DSC', label: 'Discipline', icon: M('⚒'), color: 'text-yellow-500' },
  { code: 'VIT', label: 'Vitality', icon: M('🧡'), color: 'text-rose-400' },
  { code: 'KNW', label: 'Knowledge', icon: M('📖'), color: 'text-indigo-400' },
  { code: 'WEL', label: 'Wellness', icon: M('🧘'), color: 'text-emerald-500' },
  { code: 'SOC', label: 'Social', icon: M('🤝'), color: 'text-amber-500' }
];

interface DensityUpdateModalProps {
  onClose: () => void;
  onUpdated: () => void;
  stateLogs: any[];
}

export const DensityUpdateModal: React.FC<DensityUpdateModalProps> = ({ onClose, onUpdated, stateLogs }) => {
  const [densities, setDensities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ATTRIBUTES.forEach(attr => {
      const logs = stateLogs ? stateLogs.filter((l: any) => l.attribute_code === attr.code) : [];
      if (logs.length > 0) {
        const total = logs.reduce((sum: number, l: any) => sum + l.value, 0);
        initial[attr.code] = Math.round(total / logs.length) || 5;
      } else {
        initial[attr.code] = 5;
      }
    });
    return initial;
  });
  
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adjustValue = (code: string, delta: number) => {
    setDensities(prev => ({
      ...prev,
      [code]: Math.max(1, Math.min(10, (prev[code] || 5) + delta))
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const promises = ATTRIBUTES.map(attr => 
        // Sending default values for location and socialContext as we've removed them from UI
        api.logState(attr.code, densities[attr.code], context, 'Home', 'Alone') 
      );
      await Promise.all(promises);
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to update densities", error);
      alert("Failed to update densities.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-cozy-bg/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-cozy-panel w-full max-w-lg rounded-[2rem] border-2 border-cozy-border shadow-[0_20px_0_0_var(--cozy-border)] overflow-hidden animate-pop"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark">Update Trait Densities</h3>
              <p className="text-xs sm:text-sm font-bold text-cozy-text-dim uppercase tracking-widest mt-1">Log your current state</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-cozy-bg-alt rounded-full text-cozy-text-muted hover:text-cozy-text-dark hover:bg-cozy-border transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {ATTRIBUTES.map(attr => (
              <div key={attr.code} className="flex items-center justify-between bg-cozy-bg-alt/50 p-2 sm:p-3 rounded-2xl border border-cozy-border/50">
                <div className="flex items-center gap-3 pl-2">
                  <span className="noto-emoji text-2xl">{attr.icon}</span>
                  <span className={`font-bold ${attr.color}`}>{attr.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => adjustValue(attr.code, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-cozy-panel border-2 border-cozy-border rounded-xl text-cozy-text-muted hover:text-cozy-accent active:scale-95 transition-all shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-bold text-lg font-mono text-cozy-text-dark">{densities[attr.code]}</span>
                  <button 
                    onClick={() => adjustValue(attr.code, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-cozy-panel border-2 border-cozy-border rounded-xl text-cozy-text-muted hover:text-cozy-accent active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-widest px-2">Context & Comments</label>
            <textarea 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What's driving your current state? (Optional)"
              className="w-full h-20 bg-cozy-panel dark:bg-black/20 border-2 border-cozy-border rounded-xl px-4 py-3 text-sm text-cozy-text dark:text-white font-bold focus:outline-none focus:border-cozy-accent transition-colors resize-none"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-cozy-accent text-white py-4 rounded-xl font-bold shadow-[0_4px_0_0_var(--cozy-accent-dark)] hover:opacity-90 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
          >
            {isSubmitting ? 'Logging States...' : 'Update Densities'}
          </button>
        </div>
      </div>
    </div>
  );
};