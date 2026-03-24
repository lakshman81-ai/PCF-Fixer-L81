import React from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';
import { fix6mmGaps, fix25mmGapsWithPipe } from '../../engine/GapFixEngine';

export function CanvasToolbar({ onUndo, dragMode, setDragMode, snapResolution, handleAutoCenter }) {
  const { state: appState, dispatch } = useAppContext();

  const canvasMode = useStore(state => state.canvasMode);
  const setCanvasMode = useStore(state => state.setCanvasMode);
  const showEPLabels = useStore(state => state.showEPLabels);
  const setShowEPLabels = useStore(state => state.setShowEPLabels);
  const showGapRadar = useStore(state => state.showGapRadar);
  const setShowGapRadar = useStore(state => state.setShowGapRadar);
  const pushHistory = useStore(state => state.pushHistory);
  const dataTable = useStore(state => state.dataTable);

  const [collapsed, setCollapsed] = React.useState(() => {
    return sessionStorage.getItem('pcf-toolbar-collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    sessionStorage.setItem('pcf-toolbar-collapsed', String(next));
  };

  const handleFix6mm = () => {
      pushHistory('Fix 6mm Gaps');
      const { updatedTable, fixLog } = fix6mmGaps(dataTable);
      fixLog.forEach(l => dispatch({ type: 'ADD_LOG', payload: l }));
      dispatch({ type: 'APPLY_GAP_FIX', payload: { updatedTable } });
      useStore.getState().setDataTable(updatedTable); // Ensure 3D View instantly syncs
  };

  const handleFix25mm = () => {
      pushHistory('Fix 25mm Gaps (Insert Pipe)');
      const { updatedTable, fixLog } = fix25mmGapsWithPipe(dataTable, 'AUTO');
      fixLog.forEach(l => dispatch({ type: 'ADD_LOG', payload: l }));
      dispatch({ type: 'APPLY_GAP_FIX', payload: { updatedTable } });
      useStore.getState().setDataTable(updatedTable); // Ensure 3D View instantly syncs
  };

  const ModeBtn = ({ mode, icon, label, color }) => {
      const active = canvasMode === mode;
      return (
          <button
              onClick={() => setCanvasMode(active ? 'VIEW' : mode)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded transition text-sm ${active ? `bg-${color}-600 text-white font-bold` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title={label}
          >
              <span className="w-4 text-center">{icon}</span>
              {!collapsed && <span>{label}</span>}
          </button>
      );
  };

  const ToggleBtn = ({ active, onClick, icon, label, title }) => (
      <button
          onClick={onClick}
          className={`flex items-center gap-2 px-2 py-1.5 rounded transition text-sm ${active ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          title={title}
      >
          <span className="w-4 text-center">{icon}</span>
          {!collapsed && <span>{label}</span>}
      </button>
  );

  return (
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                  <button
                      onClick={handleAutoCenter}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 shadow flex items-center gap-2 text-sm transition-colors"
                      title="Auto Center Camera"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h6"/><path d="M3 3v6"/><path d="M21 3h-6"/><path d="M21 3v6"/><path d="M3 21h6"/><path d="M3 21v-6"/><path d="M21 21h-6"/><path d="M21 21v-6"/></svg>
                      {!collapsed && "Auto Center"}
                  </button>
                  <button
                      onClick={() => setDragMode(!dragMode)}
                      className={`px-3 py-1.5 rounded border shadow flex items-center gap-2 text-sm transition-colors ${dragMode ? 'bg-amber-500 hover:bg-amber-400 text-white border-amber-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                      title={dragMode ? "Exit Drag Edit Mode" : "Enter Drag Edit Mode (snap-to-grid)"}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>
                      {!collapsed && (dragMode ? `Drag ON (${snapResolution}mm)` : "Drag Edit")}
                  </button>
              </div>

              <div className="flex gap-2">
                  <button onClick={toggleCollapse} className="bg-slate-800 text-slate-400 hover:text-white px-2 rounded h-full flex items-center justify-center border border-slate-700">
                      {collapsed ? '◀' : '▶'}
                  </button>

                  <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-1.5 flex gap-2">
                      <div className="flex flex-col gap-1 border-r border-slate-700 pr-2">
                          <ModeBtn mode="CONNECT" icon="🔗" label="Connect" color="amber" />
                          <ModeBtn mode="BREAK" icon="✂" label="Break" color="red" />
                          <ModeBtn mode="MEASURE" icon="📏" label="Measure" color="yellow" />
                          <ModeBtn mode="INSERT_SUPPORT" icon="⊕" label="Support" color="green" />
                      </div>
                      <div className="flex flex-col gap-1 pl-1">
                          <ToggleBtn active={showGapRadar} onClick={() => setShowGapRadar(!showGapRadar)} icon="⚡" label="Gap Radar" title="Show all gaps" />
                          <ToggleBtn active={showEPLabels} onClick={() => setShowEPLabels(!showEPLabels)} icon="•••" label="EP Labels" title="Show endpoint coordinates" />
                          <button onClick={onUndo} className="flex items-center gap-2 px-2 py-1.5 rounded transition text-sm bg-slate-800 text-slate-300 hover:bg-slate-700" title="Undo (Ctrl+Z)">
                              <span className="w-4 text-center">↩</span>
                              {!collapsed && <span>Undo</span>}
                          </button>

                          <div className="flex gap-1 mt-1">
                              <button onClick={handleFix6mm} className="flex-1 bg-slate-700 hover:bg-slate-600 text-xs py-1 rounded text-white" title="Auto-fix ≤6mm gaps">Fix 6mm</button>
                              <button onClick={handleFix25mm} className="flex-1 bg-slate-700 hover:bg-slate-600 text-xs py-1 rounded text-white" title="Insert pipes for 6-25mm gaps">Fix 25mm</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {canvasMode !== 'VIEW' && (
              <div className="bg-slate-900/90 border border-slate-700 rounded px-3 py-1 text-xs text-amber-400 font-bold uppercase shadow-lg">
                  MODE: {canvasMode}
              </div>
          )}
      </div>
  );
}
