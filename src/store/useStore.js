import { create } from 'zustand';

// Decoupled, Atomic Zustand store primarily aimed at driving high-performance
// visual updates for the 3D Canvas without forcing global React Context re-renders.

export const useStore = create((set, get) => ({
  // The global source of truth for raw pipe geometries
  dataTable: [],

  // Proposals emitted from the SmartFixer
  proposals: [],

  // Method to approve/reject a proposal directly from Canvas
  setProposalStatus: (rowIndex, status) => set((state) => {
      // Find proposal matching the row and update its status
      const updatedProposals = state.proposals.map(prop => {
          if (prop.elementA?._rowIndex === rowIndex || prop.elementB?._rowIndex === rowIndex) {
              return { ...prop, _fixApproved: status };
          }
          return prop;
      });
      // Also sync back to dataTable so it is reflected globally when re-synced
      const updatedTable = state.dataTable.map(r =>
          r._rowIndex === rowIndex ? { ...r, _fixApproved: status } : r
      );

      // Need a way to tell the app context to sync from zustand.
      // We will dispatch a custom window event that StatusBar/AppContext can listen to.
      window.dispatchEvent(new CustomEvent('zustand-fix-status-changed', {
          detail: { rowIndex, status }
      }));

      return { proposals: updatedProposals, dataTable: updatedTable };
  }),

  // Highlighting/Interaction state for the canvas
  selectedElementId: null,
  hoveredElementId: null,

  // Sync function to mirror AppContext if required,
  // or act as the standalone state manager.
  setDataTable: (table) => set({ dataTable: table }),

  setProposals: (proposals) => set({ proposals }),

// History stack for Undo
history: [],
historyIdx: 0,
pushHistory: (label) => set((state) => {
    // Keep last 20 snapshots
    const newHistory = [...state.history.slice(0, state.historyIdx), { label, dataTable: state.dataTable }];
    if (newHistory.length > 20) newHistory.shift();
    return { history: newHistory, historyIdx: newHistory.length };
}),
undo: () => {
    set((state) => {
        if (state.historyIdx === 0) return state; // Nothing to undo
        const prevIdx = state.historyIdx - 1;
        const prevSnapshot = state.history[prevIdx];

        // Dispatch the event OUTSIDE the state update cycle using setTimeout
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('zustand-undo'));
        }, 0);

        return { dataTable: prevSnapshot.dataTable, historyIdx: prevIdx };
    });
},

  // Interaction handlers
  setSelected: (id) => set({ selectedElementId: id }),
  setHovered: (id) => set({ hoveredElementId: id }),

// Canvas Modes & Interactions
canvasMode: 'VIEW', // 'VIEW' | 'CONNECT' | 'BREAK' | 'INSERT_SUPPORT' | 'MEASURE'
setCanvasMode: (mode) => set({ canvasMode: mode }),

multiSelectedIds: [],
toggleMultiSelect: (id) => set((state) => ({
    multiSelectedIds: state.multiSelectedIds.includes(id)
        ? state.multiSelectedIds.filter(i => i !== id)
        : [...state.multiSelectedIds, id]
})),
clearMultiSelect: () => set({ multiSelectedIds: [] }),
deleteElements: (ids) => set((state) => {
    // Delete geometry immediately from Zustand to sync 3D View instantly
    const newTable = state.dataTable.filter(row => !ids.includes(row._rowIndex));
    const reindexed = newTable.map((r, i) => ({ ...r, _rowIndex: i + 1 }));
    return {
        dataTable: reindexed,
        multiSelectedIds: [] // Clear selection on delete
    };
}),

dragAxisLock: null, // 'X' | 'Y' | 'Z' | null
setDragAxisLock: (axis) => set({ dragAxisLock: axis }),

showEPLabels: false,
setShowEPLabels: (val) => set({ showEPLabels: val }),

showGapRadar: false,
setShowGapRadar: (val) => set({ showGapRadar: val }),

measurePts: [],
addMeasurePt: (pt) => set((state) => ({
    measurePts: state.measurePts.length < 2 ? [...state.measurePts, pt] : [pt]
})),
clearMeasure: () => set({ measurePts: [] }),

  // A helper method that safely retrieves pipes only
  getPipes: () => get().dataTable.filter(r => (r.type || "").toUpperCase() === 'PIPE'),

  // A helper method that safely retrieves all non-PIPE components for distinct 3D rendering
  getImmutables: () => get().dataTable.filter(r => (r.type || "").toUpperCase() !== 'PIPE' && (r.type || "").toUpperCase() !== 'SUPPORT'),

  // All draggable components (pipes + fittings, excluding SUPPORT)
  getAllDraggable: () => get().dataTable.filter(r => (r.type || "").toUpperCase() !== 'SUPPORT'),
}));
