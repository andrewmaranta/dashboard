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
    <div className="space-y-10 animate-pop">
      {/* Header / Table Selector */}
      <div className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cozy-bg-alt rounded-3xl flex items-center justify-center border-2 border-cozy-border text-cozy-accent">
              <Database size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-cozy-text-dark">Data Vault</h3>
              <p className="text-sm font-bold text-cozy-text-dim uppercase tracking-widest">Raw Database Explorer</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-cozy-bg-alt border-2 border-cozy-border rounded-2xl px-6 py-4 appearance-none font-bold text-cozy-text-dark focus:outline-none focus:border-cozy-accent transition-all cursor-pointer shadow-[0_4px_0_0_var(--cozy-border)]"
            >
              {tables.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-cozy-accent pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {/* Table Display */}
      <div className="bg-cozy-panel p-10 rounded-[3rem] border-2 border-cozy-border shadow-[0_12px_0_0_var(--cozy-border)] overflow-hidden">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center opacity-30">
            <span className="noto-emoji text-6xl animate-bounce mb-4">{M('⏳')}</span>
            <span className="text-xl font-bold">Unlocking Vault...</span>
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-4 text-[10px] font-bold text-cozy-text-dim uppercase tracking-widest border-b-2 border-cozy-bg-alt">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="group hover:bg-cozy-bg-alt/50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-4 bg-cozy-bg/40 first:rounded-l-2xl last:rounded-r-2xl border-y-2 border-cozy-border/10 group-hover:border-cozy-border/30 font-bold text-sm text-cozy-text whitespace-nowrap">
                        {row[col] === null ? <span className="opacity-20 italic">null</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center opacity-30">
            <Search size={64} className="mb-6" />
            <span className="text-xl font-bold italic">This table is currently empty...</span>
          </div>
        )}
      </div>
    </div>
  );
};
