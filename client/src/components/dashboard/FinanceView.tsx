import React, { useState } from 'react';
import { api } from '@/services/api';
import { FinanceData } from '@/types';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface FinanceViewProps {
  data: {
    financeData: FinanceData;
  };
}

export const FinanceView: React.FC<FinanceViewProps> = ({ data }) => {
  const { financeData } = data;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<FinanceData>(financeData);

  const handleUpdate = async () => {
    try {
      await api.updateFinance(editData);
      setShowEditModal(false);
    } catch (e) { console.error(e); }
  };

  const getNumeric = (val: string) => parseInt(val?.replace(/[^0-9]/g, '') || '0');

  const efTarget = financeData.targets?.emergencyFund || 10000;
  const efCurrent = getNumeric(financeData.emergencyFund);
  const efPercent = Math.min(100, Math.round((efCurrent / efTarget) * 100));

  const cbTarget = financeData.targets?.cashBuffer || 5000;
  const cbCurrent = getNumeric(financeData.cashReserve);
  const cbPercent = Math.min(100, Math.round((cbCurrent / cbTarget) * 100));

  const financeCards = [
    { label: 'Net Worth', value: financeData.netWorth, icon: M('📈'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Safety Fund', value: financeData.emergencyFund, icon: M('🛡'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Cash Reserve', value: financeData.cashReserve, icon: M('🏦'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Harvest', value: financeData.income, icon: M('🌾'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Burn Rate', value: financeData.burnRate, icon: M('🔥'), color: 'text-cozy-warm', bg: 'bg-cozy-warm/10' },
    { label: 'Savings Rate', value: financeData.savingsRate, icon: M('🐷'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
  ];

  return (
    <div className="space-y-12 animate-pop max-w-6xl mx-auto">
      
      {/* Finance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {financeCards.map((card, idx) => {
          return (
            <div key={idx} className="bg-cozy-panel p-8 rounded-[2.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)] flex flex-col group hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-center mb-6">
                <div className={`w-14 h-14 rounded-[1.2rem] ${card.bg} flex items-center justify-center border-2 border-transparent group-hover:scale-105 transition-all`}>
                  <span className="noto-emoji text-3xl block leading-none">{card.icon}</span>
                </div>
                <div className="text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest px-3 py-1.5 rounded-full bg-cozy-bg-alt border border-cozy-border">
                  {financeData.lastUpdated || 'Recently'}
                </div>
              </div>
              <span className="text-xs text-cozy-text-dim uppercase tracking-widest font-bold mb-1">{card.label}</span>
              <span className={`text-4xl font-bold tracking-tighter ${card.color}`}>{card.value || '-'}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-cozy-border shadow-[0_15px_0_0_var(--cozy-border)] relative overflow-hidden">
        
        {/* EF Progress */}
        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-cozy-text-dark uppercase tracking-wider">Emergency Grove</span>
              <span className="text-xs font-bold text-cozy-text-dim">Target: $10,000</span>
            </div>
            <span className="text-3xl font-bold text-cozy-accent font-mono tracking-tighter">{efPercent}%</span>
          </div>
          <div className="h-6 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
            <div 
              className="h-full bg-gradient-to-r from-cozy-accent-dark to-cozy-accent rounded-full transition-all duration-2000 shadow-md"
              style={{ width: `${efPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cash Buffer Progress */}
        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-cozy-text-dark uppercase tracking-wider">Cash Reservoir</span>
              <span className="text-xs font-bold text-cozy-text-dim">Target: $5,000</span>
            </div>
            <span className="text-3xl font-bold text-cozy-warm font-mono tracking-tighter">{cbPercent}%</span>
          </div>
          <div className="h-6 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
            <div 
              className="h-full bg-gradient-to-r from-cozy-warm to-cozy-warm/80 rounded-full transition-all duration-2000 shadow-md"
              style={{ width: `${cbPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button 
          onClick={() => setShowEditModal(true)}
          className="bg-cozy-panel hover:bg-cozy-bg-alt text-cozy-accent font-bold px-10 py-5 rounded-[2rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-3"
        >
          <span className="noto-emoji text-2xl">{M('📝')}</span>
          <span>Adjust Wealth Journal</span>
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cozy-text-dark/40 backdrop-blur-sm animate-pop">
          <div className="bg-cozy-panel p-12 rounded-[3.5rem] border-2 border-cozy-accent shadow-[0_20px_0_0_var(--cozy-accent)] max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-3xl font-bold text-cozy-text-dark mb-10 text-center flex items-center justify-center gap-4">
               <span className="noto-emoji text-3xl">{M('✦')}</span> Adjust Finances
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['netWorth', 'emergencyFund', 'cashReserve', 'income', 'burnRate', 'savingsRate'].map(key => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] text-cozy-text-dim uppercase font-bold tracking-widest px-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input 
                    type="text" 
                    value={(editData as any)[key] || ''}
                    onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                    className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-5 py-4 text-cozy-accent font-bold focus:outline-none focus:border-cozy-accent transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={handleUpdate}
                className="flex-1 bg-cozy-accent text-white font-bold py-6 rounded-2xl shadow-[0_6px_0_0_var(--cozy-accent-dark)] active:shadow-none active:translate-y-1 transition-all text-xl"
              >
                Save
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-cozy-panel border-2 border-cozy-border text-cozy-text-dim font-bold py-6 rounded-2xl shadow-[0_6px_0_0_var(--cozy-border)] active:shadow-none active:translate-y-1 transition-all text-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
