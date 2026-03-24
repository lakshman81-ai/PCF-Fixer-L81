import React, { useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { distance } from '../../engine/GapFixEngine';

export function EndpointSnapLayer({ onConnect }) {
    const dataTable = useStore(state => state.dataTable);
    const setHovered = useStore(state => state.setHovered);
    const canvasMode = useStore(state => state.canvasMode);

    const [connectDraft, setConnectDraft] = useState(null);
    const [cursorPos, setCursorPos] = useState(null);

    const { camera, gl } = useThree();

    const snapRadius = 50;

    const snapPoints = useMemo(() => {
        if (canvasMode !== 'CONNECT') return [];
        const pts = [];
        dataTable.forEach(row => {
            if (row.ep1) pts.push({ row, pt: 'ep1', pos: new THREE.Vector3(row.ep1.x, row.ep1.y, row.ep1.z) });
            if (row.ep2) pts.push({ row, pt: 'ep2', pos: new THREE.Vector3(row.ep2.x, row.ep2.y, row.ep2.z) });
        });
        return pts;
    }, [dataTable, canvasMode]);

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

    if (canvasMode !== 'CONNECT') return null;

    return (
        <group onPointerMove={handlePointerMove}>
            {snapPoints.map((target, i) => (
                <mesh
                    key={`snap-${i}`}
                    position={target.pos}
                    onPointerDown={(e) => handlePointerDown(e, target)}
                    onPointerUp={(e) => handlePointerUp(e, target)}
                    onPointerEnter={() => setHovered(target.row._rowIndex)}
                    onPointerLeave={() => setHovered(null)}
                >
                    <sphereGeometry args={[20, 16, 16]} />
                    <meshBasicMaterial color="#eab308" transparent opacity={0.6} />
                </mesh>
            ))}

            {connectDraft && cursorPos && (
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
