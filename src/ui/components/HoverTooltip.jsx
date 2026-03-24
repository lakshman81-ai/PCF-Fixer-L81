import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

const TYPE_CONFIG = {
  PIPE:   { color: '#3b82f6', bg: 'bg-blue-600' },
  VALVE:  { color: '#ef4444', bg: 'bg-red-600' },
  FLANGE: { color: '#a855f7', bg: 'bg-purple-600' },
  BEND:   { color: '#f59e0b', bg: 'bg-amber-600' },
  TEE:    { color: '#10b981', bg: 'bg-green-600' },
  OLET:   { color: '#06b6d4', bg: 'bg-cyan-600' },
  SUPPORT:{ color: '#94a3b8', bg: 'bg-slate-600' },
};

export function HoverTooltip() {
  const hoveredElementId = useStore(state => state.hoveredElementId);
  const dataTable = useStore(state => state.dataTable);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visibleId, setVisibleId] = useState(null);

  useEffect(() => {
    const handlePointerMove = (e) => {
        setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    let timeout;
    if (hoveredElementId) {
        timeout = setTimeout(() => {
            setVisibleId(hoveredElementId);
        }, 150);
    } else {
        setVisibleId(null);
    }
    return () => clearTimeout(timeout);
  }, [hoveredElementId]);

  if (!visibleId) return null;

  const element = dataTable.find(r => r._rowIndex === visibleId);
  if (!element) return null;

  const bgClass = (TYPE_CONFIG[(element.type||'').toUpperCase()] || { bg: 'bg-slate-600' }).bg;

  let length = 0;
  if (element.ep1 && element.ep2) {
      const dx = element.ep1.x - element.ep2.x;
      const dy = element.ep1.y - element.ep2.y;
      const dz = element.ep1.z - element.ep2.z;
      length = Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  return (
    <div
        className="fixed z-50 pointer-events-none bg-slate-900 border border-slate-700 shadow-xl rounded p-2"
        style={{ left: pos.x + 15, top: pos.y + 15 }}
    >
        <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${bgClass}`}>{element.type}</span>
            <span className="text-xs text-slate-300 font-bold">Row {element._rowIndex}</span>
        </div>
        <div className="text-[10px] text-slate-400">
            <div>Bore: {element.bore}</div>
            <div>Length: {length.toFixed(1)}mm</div>
            {element.ep1 && <div>EP1: ({element.ep1.x}, {element.ep1.y}, {element.ep1.z})</div>}
        </div>
    </div>
  );
}
