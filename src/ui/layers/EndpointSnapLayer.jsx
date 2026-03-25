import React, { useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

export function EndpointSnapLayer({ onConnect }) {
    const dataTable = useStore(state => state.dataTable);
    const hiddenElementIds = useStore(state => state.hiddenElementIds || []);
    const canvasMode = useStore(state => state.canvasMode);

    // We want to render snap points for Measure, Break, Insert Support, Connect
    const showSnaps = ['MEASURE', 'BREAK', 'INSERT_SUPPORT', 'CONNECT'].includes(canvasMode);

    const [connectDraft, setConnectDraft] = useState(null);
    const [cursorPos, setCursorPos] = useState(null);

    const snapPoints = useMemo(() => {
        if (!showSnaps) return [];
        const pts = [];

        dataTable.forEach(row => {
            if (hiddenElementIds.includes(row._rowIndex)) return;

            if (row.ep1) pts.push({ row, pt: 'ep1', pos: new THREE.Vector3(row.ep1.x, row.ep1.y, row.ep1.z) });
            if (row.ep2) pts.push({ row, pt: 'ep2', pos: new THREE.Vector3(row.ep2.x, row.ep2.y, row.ep2.z) });

            if (row.ep1 && row.ep2) {
                const mx = (row.ep1.x + row.ep2.x) / 2;
                const my = (row.ep1.y + row.ep2.y) / 2;
                const mz = (row.ep1.z + row.ep2.z) / 2;
                pts.push({ row, pt: 'mid', pos: new THREE.Vector3(mx, my, mz) });
            }
        });
        return pts;
    }, [dataTable, canvasMode, hiddenElementIds, showSnaps]);

    const handlePointerDown = (e, target) => {
        if (canvasMode !== 'CONNECT') return;
        e.stopPropagation();
        setConnectDraft({
            fromElement: target.row,
            fromEP: target.pt,
            fromPosition: target.pos
        });
    };

    const handlePointerUp = (e, target) => {
        if (canvasMode !== 'CONNECT' || !connectDraft) return;
        e.stopPropagation();

        if (connectDraft.fromElement._rowIndex !== target.row._rowIndex) {
            onConnect(connectDraft.fromElement._rowIndex, connectDraft.fromEP, target.pos);
        }
        setConnectDraft(null);
        setCursorPos(null);
    };

    const handlePointerMove = (e) => {
        if (!connectDraft) return;
        setCursorPos(e.point);
    };

    if (!showSnaps) return null;

    return (
        <group onPointerMove={handlePointerMove}>
            {snapPoints.map((target, i) => (
                <mesh
                    key={`snap-${i}`}
                    position={target.pos}
                    onPointerDown={(e) => handlePointerDown(e, target)}
                    onPointerUp={(e) => handlePointerUp(e, target)}
                    userData={{ isSnapPoint: true, snapPos: [target.pos.x, target.pos.y, target.pos.z], type: target.pt, row: target.row }}
                >
                    <sphereGeometry args={[15, 8, 8]} />
                    <meshBasicMaterial
                        color="#eab308"
                        transparent
                        opacity={canvasMode === 'CONNECT' ? 0.6 : 0.0}
                        depthTest={false}
                    />
                </mesh>
            ))}

            {connectDraft && cursorPos && canvasMode === 'CONNECT' && (
                <Line
                    points={[connectDraft.fromPosition, cursorPos]}
                    color="#eab308"
                    lineWidth={3}
                    dashed
                    dashSize={50}
                    gapSize={20}
                />
            )}
        </group>
    );
}
