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
      if (type === 'Error') return 'text-red-400';
      if (type === 'Warning') return 'text-yellow-300';
      if (type === 'Fix' || type === 'Applied') return 'text-green-400';
      return 'text-slate-400';
  };

  return (
      <div className={`absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 transition-all duration-300 z-30 ${expanded ? 'h-40' : 'h-7'}`}>
          <div
              className="w-full h-7 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800"
              onClick={() => setExpanded(!expanded)}
          >
              <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">{expanded ? '▼' : '▲'} Log ({state.log.length})</span>
                  {!expanded && state.log.length > 0 && (
                      <span className={`text-xs ${getColor(state.log[state.log.length-1].type)} truncate max-w-lg`}>
                          {state.log[state.log.length-1].message}
                      </span>
                  )}
              </div>
          </div>

          {expanded && (
              <div className="h-32 overflow-y-auto p-2">
                  {logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-3 py-1 border-b border-slate-800/50">
                          <span className={`text-[10px] uppercase font-bold w-16 shrink-0 ${getColor(l.type)}`}>{l.type}</span>
                          <span className="text-xs text-slate-500 w-24 shrink-0">{l.stage || 'SYS'}</span>
                          <span className="text-xs text-slate-300 font-mono break-all">{l.message}</span>
                      </div>
                  ))}
                  {logs.length === 0 && <div className="text-slate-500 text-xs p-2 text-center">No logs recorded in this session.</div>}
              </div>
          )}
      </div>
  );
}
