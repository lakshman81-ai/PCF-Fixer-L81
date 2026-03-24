import React, { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useStore } from '../../store/useStore';

export function EPLabelsLayer() {
    const dataTable = useStore(state => state.dataTable);
    const showEPLabels = useStore(state => state.showEPLabels);
    const setShowEPLabels = useStore(state => state.setShowEPLabels);

    useEffect(() => {
        if (showEPLabels && dataTable.length > 300) {
            console.warn("EPLabels disabled: Too many elements (>300).");
            setShowEPLabels(false);
        }
    }, [dataTable.length, showEPLabels, setShowEPLabels]);

    const labels = useMemo(() => {
        if (!showEPLabels || dataTable.length > 300) return [];

        const pts = [];
        dataTable.forEach(row => {
            if (row.ep1) {
                pts.push({ text: `EP1: (${row.ep1.x}, ${row.ep1.y}, ${row.ep1.z})`, pos: [row.ep1.x, row.ep1.y + 20, row.ep1.z] });
            }
            if (row.ep2) {
                pts.push({ text: `EP2: (${row.ep2.x}, ${row.ep2.y}, ${row.ep2.z})`, pos: [row.ep2.x, row.ep2.y + 20, row.ep2.z] });
            }
        });
        return pts;
    }, [dataTable, showEPLabels]);

    if (!showEPLabels) return null;

    return (
        <group>
            {labels.map((l, i) => (
                <Text
                    key={i}
                    position={l.pos}
                    color="#94a3b8"
                    fontSize={16}
                    outlineWidth={1}
                    outlineColor="#0f172a"
                    fontWeight="normal"
                >
                    {l.text}
                </Text>
            ))}
        </group>
    );
}
