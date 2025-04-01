import React, { useMemo, createContext, useState, useContext } from 'react';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';

enum WalkControls {
    forward = 'forward',
    back = 'back',
    left = 'left',
    right = 'right',
    jump = 'jump',
    run = 'run',
}

enum DriveControls {
    forward = 'forward',
    back = 'back',
    left = 'left',
    right = 'right',
    brake = 'brake',
    reset = 'reset',
}

export type ControlScheme = 'simple' | 'fps' | 'none';

// Create context for control scheme
const ControlSchemeContext = createContext<{
    scheme: ControlScheme;
    setScheme: (scheme: ControlScheme) => void;
}>({
    scheme: 'simple',
    setScheme: () => { },
});

// Hook to use the control scheme context
export const useControlScheme = () => useContext(ControlSchemeContext);

function Controls({ children }: { children: React.ReactNode }) {
    const [controlScheme, setControlScheme] = useState<ControlScheme>('simple');

    const map = useMemo<KeyboardControlsEntry<DriveControls>[]>(() => [
        // { name: WalkControls.forward, keys: ['ArrowUp', 'KeyW'] },
        // { name: WalkControls.back, keys: ['ArrowDown', 'KeyS'] },
        // { name: WalkControls.left, keys: ['ArrowLeft', 'KeyA'] },
        // { name: WalkControls.right, keys: ['ArrowRight', 'KeyD'] },
        // { name: WalkControls.run, keys: ['Shift'] },
        // { name: WalkControls.jump, keys: ['Space'] },
        { name: DriveControls.forward, keys: ['ArrowUp', 'KeyW'] },
        { name: DriveControls.back, keys: ['ArrowDown', 'KeyS'] },
        { name: DriveControls.left, keys: ['ArrowLeft', 'KeyA'] },
        { name: DriveControls.right, keys: ['ArrowRight', 'KeyD'] },
        { name: DriveControls.brake, keys: ['Space'] },
        { name: DriveControls.reset, keys: ['KeyR'] },
    ], [])

    return (
        <ControlSchemeContext.Provider value={{
            scheme: controlScheme,
            setScheme: setControlScheme
        }}>
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 100,
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '5px',
                color: 'white'
            }}>
                <div>Control Scheme:</div>
                <button
                    onClick={() => setControlScheme('simple')}
                    style={{ background: controlScheme === 'simple' ? '#4a4' : '#444', margin: '2px', border: 'none', padding: '5px 10px', borderRadius: '3px', color: 'white' }}
                >
                    Simple
                </button>
                <button
                    onClick={() => setControlScheme('fps')}
                    style={{ background: controlScheme === 'fps' ? '#4a4' : '#444', margin: '2px', border: 'none', padding: '5px 10px', borderRadius: '3px', color: 'white' }}
                >
                    FPS
                </button>
                <button
                    onClick={() => setControlScheme('none')}
                    style={{ background: controlScheme === 'none' ? '#4a4' : '#444', margin: '2px', border: 'none', padding: '5px 10px', borderRadius: '3px', color: 'white' }}
                >
                    None
                </button>
            </div>
            <KeyboardControls map={map}>
                {children}
            </KeyboardControls>
        </ControlSchemeContext.Provider>
    );
}

export default Controls;
