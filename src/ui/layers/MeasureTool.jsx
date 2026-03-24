import React, { useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

export function MeasurePanelOverlay() {
    const canvasMode = useStore(state => state.canvasMode);
    const measurePts = useStore(state => state.measurePts);
    const clearMeasure = useStore(state => state.clearMeasure);

    if (canvasMode !== 'MEASURE' || measurePts.length !== 2) return null;

    const pt1 = measurePts[0];
    const pt2 = measurePts[1];
    const dx = Math.abs(pt1.x - pt2.x);
    const dy = Math.abs(pt1.y - pt2.y);
    const dz = Math.abs(pt1.z - pt2.z);
    const total = pt1.distanceTo(pt2);

    return (
        <div className="absolute top-24 right-4 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 z-30 pointer-events-auto">
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Measure Δ</span>
                <button onClick={clearMeasure} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-slate-500 font-bold">ΔX</span>
                <span className="text-slate-200 text-right font-mono">{dx.toFixed(1)}</span>
                <span className="text-slate-500 font-bold">ΔY</span>
                <span className="text-slate-200 text-right font-mono">{dy.toFixed(1)}</span>
                <span className="text-slate-500 font-bold">ΔZ</span>
                <span className="text-slate-200 text-right font-mono">{dz.toFixed(1)}</span>
                <span className="text-yellow-500 font-bold mt-2 border-t border-slate-800 pt-1">Total</span>
                <span className="text-yellow-400 text-right font-mono font-bold mt-2 border-t border-slate-800 pt-1">{total.toFixed(1)}</span>
            </div>
        </div>
    );
}

export function MeasureTool() {
    const canvasMode = useStore(state => state.canvasMode);
    const setCanvasMode = useStore(state => state.setCanvasMode);
    const measurePts = useStore(state => state.measurePts);
    const addMeasurePt = useStore(state => state.addMeasurePt);
    const clearMeasure = useStore(state => state.clearMeasure);

    const [cursorPos, setCursorPos] = useState(null);

    const handlePointerDown = (e) => {
        if (canvasMode !== 'MEASURE') return;
        e.stopPropagation();

        if (measurePts.length >= 2) {
            clearMeasure();
            setCanvasMode('VIEW');
        } else {
            addMeasurePt(e.point);
        }
    };

    const handlePointerMove = (e) => {
        if (canvasMode !== 'MEASURE' || measurePts.length !== 1) return;
        setCursorPos(e.point);
    };

    if (canvasMode !== 'MEASURE') return null;

    return (
        <group onPointerMove={handlePointerMove}>
            {/* Click Plane */}
            <mesh visible={false} onPointerDown={handlePointerDown}>
                <planeGeometry args={[100000, 100000]} />
            </mesh>

            {measurePts.map((pt, i) => (
                <mesh key={`pt-${i}`} position={pt}>
                    <sphereGeometry args={[15, 16, 16]} />
                    <meshBasicMaterial color="#eab308" />
                </mesh>
            ))}

            {measurePts.length === 1 && cursorPos && (
                <Line
                    points={[measurePts[0], cursorPos]}
                    color="#eab308"
                    lineWidth={2}
                    dashed
                />
            )}

            {measurePts.length === 2 && (
                <Line
                    points={[measurePts[0], measurePts[1]]}
                    color="#eab308"
                    lineWidth={3}
                />
            )}

            {measurePts.length === 2 && (() => {
                const pt1 = measurePts[0];
                const pt2 = measurePts[1];
                const total = pt1.distanceTo(pt2);
                const mid = pt1.clone().lerp(pt2, 0.5);

                return (
                    <group>
                        <Text
                            position={[mid.x, mid.y + 20, mid.z]}
                            color="#eab308"
                            fontSize={25}
                            outlineWidth={3}
                            outlineColor="#000"
                            fontWeight="bold"
                        >
                            {total.toFixed(1)}mm
                        </Text>
                    </group>
                );
            })()}
        </group>
    );
}