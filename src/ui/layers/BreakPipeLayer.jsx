import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';

import { useEffect } from 'react';

export function BreakPipeLayer() {
    const canvasMode = useStore(state => state.canvasMode);
    const [cursorPos, setCursorPos] = useState(null);

    useEffect(() => {
        const handleHover = (e) => {
            if (canvasMode !== 'BREAK') return;
            setCursorPos(e.detail?.point || null);
        };

        window.addEventListener('canvas-break-hover', handleHover);
        return () => window.removeEventListener('canvas-break-hover', handleHover);
    }, [canvasMode]);

    if (canvasMode !== 'BREAK' || !cursorPos) return null;

    return (
        <group>
            <mesh position={cursorPos}>
                <sphereGeometry args={[15, 8, 8]} />
                <meshBasicMaterial color="#ef4444" wireframe />
            </mesh>
        </group>
    );
}
