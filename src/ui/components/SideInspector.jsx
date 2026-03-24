import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';

export function SideInspector() {
  const { state: appState, dispatch } = useAppContext();
  const selectedElementId = useStore(state => state.selectedElementId);
  const setSelected = useStore(state => state.setSelected);
  const pushHistory = useStore(state => state.pushHistory);
  const setDataTable = useStore(state => state.setDataTable);

  const [localData, setLocalData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (selectedElementId) {
      const element = appState.stage2Data.find(r => r._rowIndex === selectedElementId);
      if (element) {
        setLocalData(JSON.parse(JSON.stringify(element)));
        setIsDirty(false);
      } else {
        setLocalData(null);
      }
    } else {
      setLocalData(null);
    }
  }, [selectedElementId, appState.stage2Data]);

  if (!selectedElementId || !localData) return null;

  const handleChange = (field, subfield, value) => {
    setLocalData(prev => {
      const updated = { ...prev };
      if (subfield) {
        updated[field] = { ...updated[field], [subfield]: value };
      } else {
        updated[field] = value;
      }
      return updated;
    });
    setIsDirty(true);
  };

  const handleApply = () => {
    // Parse floats before committing to math engine
    const parsedData = { ...localData };
    ['ep1', 'ep2', 'cp', 'bp'].forEach(pt => {
        if (parsedData[pt]) {
            parsedData[pt] = {
                x: parseFloat(parsedData[pt].x) || 0,
                y: parseFloat(parsedData[pt].y) || 0,
                z: parseFloat(parsedData[pt].z) || 0
            };
        }
    });
    if (parsedData.bore) parsedData.bore = parseFloat(parsedData.bore) || 0;

    pushHistory('Inspector Edit');

    // Update AppContext
    const updatedTable = appState.stage2Data.map(r =>
        r._rowIndex === parsedData._rowIndex ? parsedData : r
    );
    dispatch({ type: "SET_STAGE_2_DATA", payload: updatedTable });

    // Update Zustand
    setDataTable(updatedTable);

    dispatch({ type: "ADD_LOG", payload: { type: "Info", stage: "UI", message: `Updated Row ${parsedData._rowIndex} via Inspector.` }});
    setIsDirty(false);
  };

  const InputRow = ({ label, field, subfield, val }) => (
      <div className="flex items-center justify-between my-1">
          <span className="text-xs text-slate-400 w-8">{label}</span>
          <input
              className={`w-16 bg-slate-800 text-xs px-1 py-0.5 rounded border focus:outline-none ${isDirty && localData[field]?.[subfield] !== val ? 'border-amber-500 text-amber-200' : 'border-slate-600 text-slate-200'}`}
              type="number"
              value={localData[field]?.[subfield] ?? ''}
              onChange={(e) => handleChange(field, subfield, e.target.value)}
              placeholder={val ?? ''}
          />
      </div>
  );

  return (
    <div className="absolute left-4 top-24 w-72 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur flex flex-col z-20 transition-transform duration-300">
        <div className="flex justify-between items-center bg-slate-800 p-2 rounded-t-lg border-b border-slate-700">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">{localData.type}</span>
                <span className="text-sm text-slate-300">Row {localData._rowIndex}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white px-1">✕</button>
        </div>

        <div className="p-3 overflow-y-auto max-h-[60vh]">
            <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Endpoint 1</h3>
                <div className="flex gap-2">
                    <InputRow label="X" field="ep1" subfield="x" val={localData.ep1?.x} />
                    <InputRow label="Y" field="ep1" subfield="y" val={localData.ep1?.y} />
                    <InputRow label="Z" field="ep1" subfield="z" val={localData.ep1?.z} />
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Endpoint 2</h3>
                <div className="flex gap-2">
                    <InputRow label="X" field="ep2" subfield="x" val={localData.ep2?.x} />
                    <InputRow label="Y" field="ep2" subfield="y" val={localData.ep2?.y} />
                    <InputRow label="Z" field="ep2" subfield="z" val={localData.ep2?.z} />
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Attributes</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                        <span className="text-xs text-slate-400 block">Bore</span>
                        <input className="w-full bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200" type="number" value={localData.bore || ''} onChange={(e) => handleChange('bore', null, e.target.value)} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">SKEY</span>
                        <input className="w-full bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200" type="text" value={localData.skey || ''} onChange={(e) => handleChange('skey', null, e.target.value)} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">CA1</span>
                        <input className="w-full bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200" type="text" value={localData.CA1 || ''} onChange={(e) => handleChange('CA1', null, e.target.value)} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">PipelineRef</span>
                        <input className="w-full bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-200" type="text" value={localData.pipelineRef || ''} onChange={(e) => handleChange('pipelineRef', null, e.target.value)} />
                    </div>
                </div>
            </div>

            <button
                onClick={handleApply}
                disabled={!isDirty}
                className={`w-full py-1.5 rounded text-sm font-bold transition-colors ${isDirty ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
                {isDirty ? 'Apply Changes' : 'Applied'}
            </button>
        </div>
    </div>
  );
}
