import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { distance } from '../../engine/GapFixEngine';

export function SceneHealthHUD() {
  const dataTable = useStore(state => state.dataTable);
  const setShowGapRadar = useStore(state => state.setShowGapRadar);

  const stats = useMemo(() => {
      let pipes = 0;
      let supports = 0;
      let fixableGaps = 0;
      let brokenGaps = 0;
      let maxGap = 0;

      for (let i = 0; i < dataTable.length; i++) {
          const row = dataTable[i];
          const t = (row.type || '').toUpperCase();
          if (t === 'PIPE') pipes++;
          if (t === 'SUPPORT') supports++;

          if (i < dataTable.length - 1) {
              const nextRow = dataTable[i + 1];
              if (row.ep2 && nextRow.ep1) {
                  const dist = distance(row.ep2, nextRow.ep1);
                  if (dist > 0) {
                      if (dist > maxGap) maxGap = dist;
                      if (dist <= 25.0) fixableGaps++;
                      else brokenGaps++;
                  }
              }
          }
      }

      return { pipes, supports, fixableGaps, brokenGaps, maxGap };
  }, [dataTable]);

  return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 pointer-events-auto">
          <div className="bg-slate-800/80 border border-slate-700 backdrop-blur rounded-full px-4 py-1.5 flex gap-4 shadow-lg text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Pipes: {stats.pipes}
              </div>

              <button
                  onClick={() => setShowGapRadar(true)}
                  className={`flex items-center gap-1.5 transition-colors hover:text-white ${stats.fixableGaps > 0 ? 'text-amber-400' : 'text-green-400'}`}
                  title="Click to show Gap Radar"
              >
                  <span className={`w-2 h-2 rounded-full ${stats.fixableGaps > 0 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                  Gaps (≤25mm): {stats.fixableGaps}
              </button>

              <div className={`flex items-center gap-1.5 ${stats.brokenGaps > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${stats.brokenGaps > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  Disconnected: {stats.brokenGaps}
              </div>

              {stats.maxGap > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-600 pl-4">
                      Max Gap: {stats.maxGap.toFixed(1)}mm
                  </div>
              )}

              <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-600 pl-4">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Supports: {stats.supports}
              </div>
          </div>
      </div>
  );
}
