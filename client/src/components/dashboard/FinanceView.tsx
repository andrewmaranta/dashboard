import React from 'react';
import { FinanceData } from '@/types';

const M = (emoji: string) => `${emoji}\uFE0E`;

interface FinanceViewProps {
  data: {
    financeData: FinanceData;
  };
}

export const FinanceView: React.FC<FinanceViewProps> = ({ data }) => {
  const { financeData } = data;

  const formatCurrency = (val: string | undefined) => {
    if (!val) return '-';
    if (val.startsWith('$')) return val;
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const getNumeric = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.]/g, '') || '0');
  };

  const efTarget = financeData.targets?.emergencyFund || 10000;
  const efCurrent = getNumeric(financeData.emergencyFund);
  const efPercent = Math.min(100, Math.round((efCurrent / efTarget) * 100));

  const cbTarget = financeData.targets?.cashBuffer || 5000;
  const cbCurrent = getNumeric(financeData.cashReserve);
  const cbPercent = Math.min(100, Math.round((cbCurrent / cbTarget) * 100));

  const financeCards = [
    { label: 'Net Worth', value: formatCurrency(financeData.netWorth), icon: M('📈'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'NW Change', value: (financeData.netWorthChangePct || 0) >= 0 ? `+${financeData.netWorthChangePct}%` : `${financeData.netWorthChangePct}%`, icon: M('🚀'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Emergency Fund', value: formatCurrency(financeData.emergencyFund), icon: M('🛡'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Cash', value: formatCurrency(financeData.cashReserve), icon: M('🏦'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Income', value: formatCurrency(financeData.income), icon: M('🌾'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
    { label: 'Fixed Costs', value: formatCurrency(financeData.fixedCosts), icon: M('🏠'), color: 'text-cozy-warm', bg: 'bg-cozy-warm/10' },
    { label: 'Monthly Surplus', value: formatCurrency(financeData.monthlySurplus), icon: M('🌱'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Savings Rate', value: financeData.savingsRate + (financeData.savingsRate?.includes('%') ? '' : '%'), icon: M('🐷'), color: 'text-cozy-accent', bg: 'bg-cozy-accent/10' },
  ];

  return (
    <div className="space-y-6 sm:space-y-12 animate-pop max-w-6xl mx-auto pb-20">
      
      {/* Finance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {financeCards.map((card, idx) => {
          return (
            <div key={idx} className="bg-cozy-panel p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-cozy-border shadow-[0_6px_0_0_var(--cozy-border)] flex flex-col group hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 h-12 rounded-xl sm:rounded-[1.1rem] ${card.bg} flex items-center justify-center border-2 border-transparent group-hover:scale-105 transition-all`}>
                  <span className="noto-emoji text-xl sm:text-2xl block leading-none">{card.icon}</span>
                </div>
                {idx === 0 && (
                  <div className="text-[7px] sm:text-[9px] font-bold text-cozy-text-dim uppercase tracking-widest px-2 py-1 rounded-full bg-cozy-bg-alt border border-cozy-border">
                    {financeData.lastUpdated?.split('T')[0] || 'Recently'}
                  </div>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] text-cozy-text-dim uppercase tracking-widest font-black mb-1">{card.label}</span>
              <span className={`text-xl sm:text-2xl font-bold tracking-tighter ${card.color} tabular-nums`}>{card.value || '-'}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 bg-cozy-panel p-6 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-cozy-border shadow-[0_10px_0_0_var(--cozy-border)] sm:shadow-[0_15px_0_0_var(--cozy-border)] relative overflow-hidden">
        
        {/* EF Progress */}
        <div className="space-y-4 sm:space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-cozy-text-dark uppercase tracking-wider">Emergency Grove</span>
              <span className="text-[10px] sm:text-xs font-bold text-cozy-text-dim">Target: $10,000</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-cozy-accent font-mono tracking-tighter">{efPercent}%</span>
          </div>
          <div className="h-5 sm:h-6 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
            <div 
              className="h-full bg-gradient-to-r from-cozy-accent-dark to-cozy-accent rounded-full transition-all duration-2000 shadow-md"
              style={{ width: `${efPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cash Buffer Progress */}
        <div className="space-y-4 sm:space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-cozy-text-dark uppercase tracking-wider">Cash Reservoir</span>
              <span className="text-[10px] sm:text-xs font-bold text-cozy-text-dim">Target: $5,000</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-cozy-warm font-mono tracking-tighter">{cbPercent}%</span>
          </div>
          <div className="h-5 sm:h-6 w-full bg-cozy-bg-alt rounded-full overflow-hidden border-2 border-cozy-border shadow-inner p-1">
            <div 
              className="h-full bg-gradient-to-r from-cozy-warm to-cozy-warm/80 rounded-full transition-all duration-2000 shadow-md"
              style={{ width: `${cbPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Ruby's Analysis Section */}
      {financeData.notes && (
        <div className="bg-indigo-50/30 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-[0_12px_0_0_rgba(199,210,254,0.3)] dark:shadow-none animate-blur-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b-2 border-indigo-100/50 dark:border-indigo-900/30 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <span className="noto-emoji text-2xl sm:text-3xl">{M('✨')}</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">Financial Analysis</h3>
                <p className="text-[10px] sm:text-sm font-bold text-indigo-400 uppercase tracking-[0.2em]">Insights from the vault</p>
              </div>
            </div>
            
            {/* Metadata Tags */}
            <div className="flex flex-wrap gap-2">
              {financeData.notes.split('\n').filter(l => l.includes('**Period:**') || l.includes('**Last Updated:**')).map((metaLine, i) => {
                const parts = metaLine.split(':**');
                if (parts.length < 2) return null;
                const label = parts[0].replace(/\*\*/g, '').trim();
                const value = parts[1].replace(/\*\*/g, '').trim();
                return (
                  <div key={i} className="px-3 py-1.5 bg-indigo-100/50 dark:bg-indigo-900/40 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 flex items-center gap-2">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{label}</span>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <div className="space-y-6 text-cozy-text-dark dark:text-indigo-100/80 font-medium leading-relaxed text-sm sm:text-lg whitespace-pre-wrap font-sans">
              {(() => {
                const lines = financeData.notes.split('\n')
                  .filter(l => {
                      const line = l.trim();
                      return !line.startsWith('**Period:**') && 
                             !line.startsWith('**Data Source:**') && 
                             !line.startsWith('**Last Updated:**') && 
                             !line.startsWith('# ') && 
                             !line.startsWith('<!--') &&
                             !line.startsWith('-->') &&
                             !line.startsWith('- ') &&
                             !line.includes('FORMAT SPEC');
                  });
                
                // Find index of first meaningful content (not empty, not a divider)
                const firstContentIdx = lines.findIndex(l => l.trim() !== '' && !l.trim().startsWith('---'));
                const contentLines = firstContentIdx === -1 ? [] : lines.slice(firstContentIdx);

                return contentLines.map((line, i) => {
                  const trimmed = line.trim();
                  if (trimmed === '') return <div key={i} className="h-2" />;
                  if (trimmed.startsWith('## ')) {
                    return (
                      <h2 key={i} className={`text-xl sm:text-2xl font-bold text-indigo-800 dark:text-indigo-300 ${i === 0 ? 'mt-0' : 'mt-12'} mb-6 border-b-2 border-indigo-100 dark:border-indigo-900/30 pb-2 uppercase tracking-tight`}>
                        {trimmed.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith('---')) return <hr key={i} className="border-indigo-100 dark:border-indigo-900/30 my-8" />;
                  
                  // Simple inline bolding for key numbers
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={i} className="mb-4">
                      {parts.map((part, pi) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <span key={pi} className="text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 bg-indigo-100/30 dark:bg-indigo-900/20 rounded-lg">{part.replace(/\*\*/g, '')}</span>;
                        }
                        return part;
                      })}
                    </p>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
