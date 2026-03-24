import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';

export function SupportPropertyPanel() {
  const { dispatch } = useAppContext();
  const multiSelectedIds = useStore(state => state.multiSelectedIds);
  const dataTable = useStore(state => state.dataTable);
  const clearMultiSelect = useStore(state => state.clearMultiSelect);
  const pushHistory = useStore(state => state.pushHistory);
  const deleteElements = useStore(state => state.deleteElements);

  const [localAttrs, setLocalAttrs] = useState({ CA1: '', CA2: '', CA3: '' });

  // Only show if all selected are SUPPORTS
  const selectedSupports = multiSelectedIds
      .map(id => dataTable.find(r => r._rowIndex === id))
      .filter(Boolean);

  const isVisible = multiSelectedIds.length > 0 && selectedSupports.length === multiSelectedIds.length && selectedSupports.every(s => (s.type || '').toUpperCase() === 'SUPPORT');

  useEffect(() => {
      if (isVisible && selectedSupports.length > 0) {
          // Default inputs to the first support's values
          const first = selectedSupports[0];
          setLocalAttrs({
              CA1: first.CA1 || '',
              CA2: first.CA2 || '',
              CA3: first.CA3 || ''
          });
      }
  }, [isVisible, multiSelectedIds]);

  if (!isVisible) return null;

  const handleApply = () => {
      pushHistory('Support Attr Batch Edit');
      dispatch({ type: 'BATCH_UPDATE_SUPPORT_ATTRS', payload: { rowIndices: multiSelectedIds, attrs: localAttrs } });

      // Update Zustand immediately so UI syncs
      const updated = dataTable.map(r => {
          if (multiSelectedIds.includes(r._rowIndex) && (r.type || '').toUpperCase() === 'SUPPORT') {
              return { ...r, ...localAttrs };
          }
          return r;
      });
      useStore.getState().setDataTable(updated);

      clearMultiSelect();
  };

  const handleDelete = () => {
      if (window.confirm(`Delete ${multiSelectedIds.length} supports?`)) {
          pushHistory('Batch Delete Supports');
          dispatch({ type: 'DELETE_ELEMENTS', payload: { rowIndices: multiSelectedIds } });
          deleteElements(multiSelectedIds);
          clearMultiSelect();
      }
  };

  return (
      <div className="absolute bottom-12 left-4 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 p-3">
          <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Batch Edit Supports</span>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{multiSelectedIds.length} Selected</span>
          </div>

          <div className="space-y-2 mb-4">
              {['CA1', 'CA2', 'CA3'].map(ca => (
                  <div key={ca} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-8">{ca}</span>
                      <input
                          type="text"
                          value={localAttrs[ca]}
                          onChange={(e) => setLocalAttrs(prev => ({ ...prev, [ca]: e.target.value }))}
                          className="flex-1 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                  </div>
              ))}
          </div>

          <div className="flex gap-2">
              <button
                  onClick={handleApply}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded transition"
              >
                  Apply to All
              </button>
              <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                  title="Delete Selected Supports"
              >
                  🗑️
              </button>
          </div>
      </div>
  );
}
