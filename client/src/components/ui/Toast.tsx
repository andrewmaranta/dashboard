import React, { useEffect } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check size={18} className="text-white" />,
    error: <X size={18} className="text-white" />,
    info: <Info size={18} className="text-white" />,
    warning: <AlertTriangle size={18} className="text-white" />
  };

  const colors = {
    success: 'bg-emerald-500 border-emerald-600',
    error: 'bg-red-500 border-red-600',
    info: 'bg-blue-500 border-blue-600',
    warning: 'bg-amber-500 border-amber-600'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-2 animate-in slide-in-from-top-2 fade-in duration-300 ${colors[type]}`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-sm font-bold text-white">{message}</p>
      <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};
