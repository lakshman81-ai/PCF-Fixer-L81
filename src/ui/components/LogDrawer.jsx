import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';

export function LogDrawer() {
  const { state } = useAppContext();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand on Error or Warning
  useEffect(() => {
      if (state.log && state.log.length > 0) {
          const lastLog = state.log[state.log.length - 1];
          if (lastLog.type === 'Error' || lastLog.type === 'Warning') {
              setExpanded(true);
          }
      }
  }, [state.log]);

  const logs = [...state.log].reverse().slice(0, 25);

  const getColor = (type) => {
      if (type === 'ERROR') return 'text-red-400';
      if (type === 'WARNING') return 'text-yellow-300';
      if (type === 'APPLIED/FIX' || type === 'FIX' || type === 'APPLIED') return 'text-[#00ff88]';
      return 'text-slate-200';
  };

  return (
      <div className={`absolute bottom-0 left-0 right-0 bg-[#0B1120] border-t border-slate-700/50 transition-all duration-300 z-30 font-mono ${expanded ? 'h-48' : 'h-8'}`}>
          <div
              className="w-full h-8 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800/50"
              onClick={() => setExpanded(!expanded)}
          >
              <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-200 font-bold tracking-widest">{expanded ? '▼' : '▲'} 3D TOPO LOG</span>
                  <span className="bg-slate-700/80 text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">{state.log.length}</span>
                  {!expanded && state.log.length > 0 && (
                      <div className="flex items-center gap-4 ml-8 font-bold text-xs tracking-wider">
                          <span className="text-slate-500 w-[110px] truncate">{state.log[state.log.length-1].stage || 'SYS'}</span>
                          <span className={`${getColor(state.log[state.log.length-1].type.toUpperCase())} w-[90px]`}>{state.log[state.log.length-1].type}</span>
                          <span className="text-slate-300 truncate max-w-xl font-normal">{state.log[state.log.length-1].message}</span>
                      </div>
                  )}
              </div>
          </div>

          {expanded && (
              <div className="h-40 overflow-y-auto px-4 py-2">
                  {logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-4 py-1.5 border-b border-slate-800/30">
                          <div className="flex w-[200px] shrink-0 font-bold text-xs tracking-wider">
                              <span className="text-slate-500 w-[110px] truncate">{l.stage || 'SYS'}</span>
                              <span className={`${getColor(l.type.toUpperCase())} flex-1`}>{l.type}</span>
                          </div>
                          <span className="text-xs text-slate-300 break-all">{l.message}</span>
                      </div>
                  ))}
                  {logs.length === 0 && <div className="text-slate-500 text-xs p-2 text-center">No logs recorded in this session.</div>}
              </div>
          )}
      </div>
  );
}
