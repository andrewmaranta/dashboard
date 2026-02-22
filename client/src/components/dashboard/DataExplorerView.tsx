import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Database, Search, ChevronDown } from 'lucide-react';

const M = (emoji: string) => `${emoji}\uFE0E`;

export const DataExplorerView: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.getTables();
        setTables(res);
        if (res.length > 0) setSelectedTable(res[0]);
      } catch (e) { console.error(e); }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.getTableData(selectedTable);
        setData(res);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [selectedTable]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-6 sm:space-y-10 animate-pop">
      {/* Header / Table Selector */}
      <div className="bg-cozy-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] sm:shadow-[0_12px_0_0_var(--cozy-border)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cozy-bg-alt rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 border-cozy-border text-cozy-accent">
              <Database size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-cozy-text-dark">Data Vault</h3>
              <p className="text-[10px] sm:text-sm font-bold text-cozy-text-dim uppercase tracking-widest leading-tight">Raw Database Explorer</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 appearance-none font-bold text-sm sm:text-base text-cozy-text-dark focus:outline-none focus:border-cozy-accent transition-all cursor-pointer shadow-[0_4px_0_0_var(--cozy-border)]"
            >
              {tables.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-cozy-accent pointer-events-none w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Table Display */}
      <div className="bg-cozy-panel p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-cozy-border shadow-[0_8px_0_0_var(--cozy-border)] sm:shadow-[0_12px_0_0_var(--cozy-border)] overflow-hidden">
        {loading ? (
          <div className="h-60 sm:h-80 flex flex-col items-center justify-center opacity-30">
            <span className="noto-emoji text-4xl sm:text-6xl animate-bounce mb-4">{M('⏳')}</span>
            <span className="text-lg sm:text-xl font-bold">Unlocking Vault...</span>
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar sm:custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-separate border-spacing-y-2 sm:border-spacing-y-3">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-4 sm:px-6 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest border-b-2 border-cozy-bg-alt whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="group hover:bg-cozy-bg-alt/50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-4 sm:px-6 py-3 sm:py-4 bg-cozy-bg/40 first:rounded-l-xl last:rounded-r-xl sm:first:rounded-l-2xl sm:last:rounded-r-2xl border-y-2 border-cozy-border/10 group-hover:border-cozy-border/30 font-bold text-xs sm:text-sm text-cozy-text whitespace-nowrap">
                        {row[col] === null ? <span className="opacity-20 italic">null</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-60 sm:h-80 flex flex-col items-center justify-center opacity-30">
            <Search size={48} className="mb-4 sm:mb-6 sm:w-16 sm:h-16" />
            <span className="text-lg sm:text-xl font-bold italic">This table is currently empty...</span>
          </div>
        )}
      </div>
    </div>
  );
};
