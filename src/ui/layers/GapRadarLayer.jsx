import React, { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { distance } from '../../engine/GapFixEngine';

export function GapRadarLayer() {
    const dataTable = useStore(state => state.dataTable);
    const showGapRadar = useStore(state => state.showGapRadar);

    const gaps = useMemo(() => {
        if (!showGapRadar) return [];
        const found = [];

        // Scan sequential gaps O(n)
        for (let i = 0; i < dataTable.length - 1; i++) {
            const rowA = dataTable[i];
            const rowB = dataTable[i + 1];
            if (rowA.ep2 && rowB.ep1) {
                const dist = distance(rowA.ep2, rowB.ep1);
                if (dist > 0 && dist <= 25.0) {
                    found.push({
                        pt1: new THREE.Vector3(rowA.ep2.x, rowA.ep2.y, rowA.ep2.z),
                        pt2: new THREE.Vector3(rowB.ep1.x, rowB.ep1.y, rowB.ep1.z),
                        dist,
                        fixable: dist <= 6.0
                    });
                }
            }
        }
        return found;
    }, [dataTable, showGapRadar]);

    if (!showGapRadar) return null;

    return (
        <group>
            {gaps.map((gap, i) => {
                const color = gap.fixable ? '#f97316' : '#ef4444'; // Orange : Red
                const mid = gap.pt1.clone().lerp(gap.pt2, 0.5);

                return (
                    <group key={`gap-${i}`}>
                        <Line
                            points={[gap.pt1, gap.pt2]}
                            color={color}
                            lineWidth={10}
                            dashed
                            dashSize={gap.dist / 3}
                            gapSize={gap.dist / 3}
                            depthTest={false}
                        />
                        <mesh position={mid}>
                            <sphereGeometry args={[gap.dist / 2 + 10, 16, 16]} />
                            <meshBasicMaterial color={color} transparent opacity={0.3} depthTest={false} />
                        </mesh>
                        <Text
                            position={[mid.x, mid.y + 15, mid.z]}
                            color={color}
                            fontSize={25}
                            outlineWidth={3}
                            outlineColor="#000"
                            fontWeight="bold"
                            depthTest={false}
                        >
                            {gap.dist.toFixed(1)}mm
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}
