import React from 'react';
import { X, Clock, Trash2, ChevronRight, LayoutTemplate } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slideInRight" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shadow-lg shrink-0">
           <h2 className="font-black text-white text-base flex items-center gap-2 tracking-wide">
             <Clock size={18} className="text-blue-500"/> PRODUCTION HISTORY
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-400"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm gap-3">
              <LayoutTemplate size={40} className="opacity-20"/>
              <p className="font-medium">저장된 히스토리가 없습니다.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelect(item)}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <span className="bg-blue-900/30 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-tight">
                       {item.data.storyType || 'Missing Case'}
                     </span>
                  </div>
                  <button 
                    onClick={(e) => onDelete(item.id, e)} 
                    className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900/10 transition-colors z-10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="font-bold text-slate-200 text-sm mb-1 truncate pr-6 leading-tight">{item.data.factSummary.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-4 truncate">{item.data.youtubePackage.title}</p>
                
                <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                   <span className="text-[10px] text-slate-600 font-mono">
                     {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                     LOAD PROJECT <ChevronRight size={12} />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;