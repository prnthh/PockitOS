import React, { useMemo } from 'react';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';

enum WalkControls {
    forward = 'forward',
    back = 'back',
    left = 'left',
    right = 'right',
    jump = 'jump',
    run = 'run',
}

function Controls({ children }: { children: React.ReactNode }) {
    const map = useMemo<KeyboardControlsEntry<WalkControls>[]>(() => [
        { name: WalkControls.forward, keys: ['ArrowUp', 'KeyW'] },
        { name: WalkControls.back, keys: ['ArrowDown', 'KeyS'] },
        { name: WalkControls.left, keys: ['ArrowLeft', 'KeyA'] },
        { name: WalkControls.right, keys: ['ArrowRight', 'KeyD'] },
        { name: WalkControls.run, keys: ['Shift'] },
        { name: WalkControls.jump, keys: ['Space'] },
    ], [])
    return (
        <KeyboardControls map={map}>
            {children}
        </KeyboardControls>
    );
}

export default Controls;
